import { computed, reactive, shallowReactive, watch } from "vue";
import {
  resendMessage,
  sendMessage,
  ChatIndex,
  ChatLog,
  getChat,
  updateChat,
  updateChatLog,
  deleteChatLog,
  loadChatLogByCursor,
  stopReply,
  removeChatPrompt,
  PromptData,
} from "../api";
import {
  AssistantMessage,
  ErrorMessage,
  Message,
  MessageChunk,
  UserMessage,
} from "./message";
import { listen } from "../utils/api";
import { usePrompt } from "../hooks/prompt";

export class Chat {
  busy: boolean = false;
  index!: ChatIndex;
  messages: Array<Message> = [];
  prevCursor?: string | null; // undefined meas not loaded, null means no more logs
  stopReplyHandler?: () => void;
  destroyCallbacks: Array<() => void> = [];
  prompt: PromptData | null = null;

  constructor(index: ChatIndex) {
    const chat = shallowReactive(this);
    chat.index = index;
    chat.messages = reactive([]);

    const prompt = usePrompt(computed(() => this.index.promptId ?? null));
    watch(
      prompt,
      () => {
        chat.prompt = prompt.value;
      },
      {
        immediate: true,
      }
    );

    listen("prompt-deleted", (event) => {
      const deletedId = (event.payload as any).id;
      if (this.index.promptId === deletedId) {
        this.index.promptId = undefined;
      }
    }).then((unlisten) => this.destroyCallbacks.push(unlisten));

    return chat;
  }

  destroy() {
    this.destroyCallbacks.forEach((cb) => cb());
  }

  async loadPrevLogs() {
    const res = await this.loadLogByCursor(this.prevCursor ?? undefined);
    this.prevCursor = res.nextCursor;
    this.addPreviousLogs(res.records);
    return res;
  }

  private async loadLogByCursor(cursor?: string) {
    return loadChatLogByCursor({
      chatId: this.index.id,
      size: 20,
      cursor,
    });
  }

  private addPreviousLogs(logs: ChatLog[]) {
    this.messages.unshift(...logs.reverse().map((log) => this.handleLog(log)));
  }

  private handleLog(log: ChatLog) {
    switch (log.role) {
      case "user": {
        const msg = new UserMessage(log.message);
        msg.setId(log.id);
        msg.finished = log.finished;
        msg.markHistory();
        return msg;
      }
      case "assistant": {
        const msg = new AssistantMessage(log.id, log.message);
        msg.markHistory();
        return msg;
      }
      default: {
        throw new Error("Unknown log role");
      }
    }
  }

  async updateLog(logId: string, content: string) {
    await updateChatLog(logId, content);
    const msg = this.messages.find((item) => item.id === logId);
    if (msg) {
      msg.content = content;
    }
  }

  async clear() {
    this.messages.length = 0;
    this.prevCursor = undefined;
  }

  async stopReply() {
    this.busy = false;
    let user_message_id = this.messages.findLast(
      (item) => item instanceof UserMessage
    )?.id;
    if (user_message_id) {
      await stopReply(user_message_id);

      // To avoid the stop reply message is sent before the stop reply command
      setTimeout(() => {
        this.stopReplyHandler?.();
      }, 1000);
    }
  }

  async deleteLog(logId: string) {
    await deleteChatLog(logId);
    const index = this.messages.findIndex((item) => item.id === logId);
    this.messages.splice(index, 1);
  }

  async changePrompt(promptId: string) {
    await updateChat({
      id: this.index.id,
      promptId,
    });
    this.index.promptId = promptId;
  }

  async removePrompt() {
    this.index.promptId = undefined;
    await removeChatPrompt(this.index.id);
  }

  async getPreviousUserLog(logId?: string): Promise<Message | null> {
    if (!logId) {
      const previousLog = this.messages.findLast(
        (item) => item instanceof UserMessage
      );
      return previousLog ?? null;
    }

    const index = this.messages.findIndex((item) => item.id === logId);
    if (index === -1) {
      return null;
    }

    const previousLog = this.messages.findLast(
      (item, i) => i < index && item instanceof UserMessage
    );

    // TODO: Currently can not handle the scroll things. When come up with a solution, uncomment the following code
    // if (!previousLog) {
    //   if (this.prevCursor !== null) {
    //     await this.loadPrevLogs();
    //     return this.getPreviousUserLog(logId)
    //   }
    // }

    return previousLog ?? null;
  }

  async getNextUserLog(logId?: string) {
    if (!logId) {
      return null;
    }

    const index = this.messages.findIndex((item) => item.id === logId);
    if (index === -1) {
      return null;
    }

    const nextLog = this.messages.find(
      (item, i) => i > index && item instanceof UserMessage
    );

    return nextLog ?? null;
  }

  async sendMessage(message: string, params?: { onFinish?: () => void }) {
    const userMessage = reactive(new UserMessage(message));
    this.messages.push(userMessage);

    const [messageId, replyId] = await sendMessage(this.index.id, message);
    userMessage.setId(messageId);

    this.__receiveAssistantMessage(this, userMessage, replyId, params);

    return messageId;
  }

  async resendMessage(messageId: string, params?: { onFinish?: () => void }) {
    const index = this.messages.findIndex((item) => {
      return item instanceof UserMessage && item.id === messageId;
    });

    if (index === -1) {
      return;
    }

    const userMessage = this.messages[index] as UserMessage;

    if (
      index === this.messages.length - 1 ||
      (index === this.messages.length - 2 &&
        this.messages[index + 1] instanceof ErrorMessage)
    ) {
      // We can reuse the message if it is the last message
      // or is the second last message and the last message is an error message

      this.messages.length = index + 1;

      userMessage.delivered = false;
      userMessage.finished = null;

      const [newMessageId, replyId] = await resendMessage(userMessage.id);
      userMessage.id = newMessageId;

      this.__receiveAssistantMessage(this, userMessage, replyId, params);
    } else {
      // Otherwise, we need to create a new message
      this.sendMessage(userMessage.content, params);
    }
  }

  async updateBacktrack(backtrack: number) {
    this.index.config.backtrack = backtrack;
    await updateChat({
      id: this.index.id,
      config: this.index.config,
    });
  }

  async __receiveAssistantMessage(
    chat: Chat,
    userMessage: UserMessage,
    id: string,
    params?: {
      onFinish?: () => void;
    }
  ) {
    const userMessageId = userMessage.id;
    const {
      message: assistantMessage,
      startLoading,
      endLoading,
    } = useAssistantMessage(id);

    startLoading();
    this.messages.push(assistantMessage);

    this.busy = true;
    const unListen = await listen(userMessageId, (event) => {
      endLoading();
      const chunk = event.payload as MessageChunk;

      switch (chunk.type) {
        case "error": {
          this.messages.pop();
          this.messages.push(new ErrorMessage(chunk.data));
          userMessage.finished = false;
          this.busy = false;
          params?.onFinish?.();
          break;
        }
        case "data": {
          assistantMessage.appendContent(chunk.data);
          userMessage.delivered = true;
          break;
        }
        case "done": {
          assistantMessage.markHistory();
          this.busy = false;
          userMessage.finished = true;
          params?.onFinish?.();
          unListen();

          getChat(chat.index.id).then((newChat) => {
            Object.assign(chat.index, newChat);
          });
          break;
        }
      }
    });

    this.stopReplyHandler = () => {
      endLoading();
      unListen();
      this.busy = false;
      if (!this.messages[this.messages.length - 1]?.content) {
        this.messages.pop();
      }
      if (this.messages[this.messages.length - 1]?.content) {
        (this.messages[this.messages.length - 1] as AssistantMessage).markHistory()
      }
      this.stopReplyHandler = undefined;
    };
  }
}

function useAssistantMessage(id: string) {
  let index = 0;
  const values = [".&nbsp;&nbsp;", "..&nbsp;", "..."];
  const message = reactive(new AssistantMessage(id, ""));

  let interval: NodeJS.Timeout;

  function startLoading() {
    message.content = values[index];
    interval = setInterval(() => {
      index += 1;
      index = index % values.length;
      message.content = values[index];
    }, 500);
  }

  function endLoading() {
    if (!message.pending) {
      return;
    }
    message.pending = false;
    clearInterval(interval);
    message.content = "";
  }

  return {
    message,
    startLoading,
    endLoading,
  };
}
