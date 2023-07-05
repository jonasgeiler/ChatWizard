import { Messages } from "./enUS";

const messages: Messages = {
  lang: "中文",

  "common.cancel": "取消",
  "common.ok": "确定",
  "common.copy": "复制",
  "common.delete": "删除",
  "common.copy.success": "已复制到剪贴板",
  "common.network.error.timeout": "网络超时",
  "common.network.error.connect": "网络链接失败",
  "common.newVersion": "新版本",

  "window.setting": "设置",

  "chat.new": "新建对话",
  "chat.casual.title": "闲聊",
  "chat.new.defaultTitle": "新对话",
  "chat.conversations": "对话列表",
  "chat.inputNameHint": "请输入对话标题",
  "chat.delivered": "已发送",
  "chat.exportMarkdown": "导出 Markdown",
  "chat.rename": "重命名",
  "chat.stick": "置顶",
  "chat.unstick": "取消置顶",
  "chat.archive": "归档",
  "chat.busy": "请等待上一条响应完成",

  "chat.explorer.hidePinned": "隐藏置顶",
  "chat.explorer.showPinned": "显示置顶",
  "chat.explorer.hideArchived": "隐藏归档",
  "chat.explorer.showArchived": "显示归档",

  "chat.message.resend": "重新发送",
  "chat.message.delete": "删除",
  "chat.message.delete.hint": "确定要删除此消息吗？",
  "chat.message.stopReply": "停止回复",

  "chat.prompt.changed": "提示词更换为: {name}",

  "chat.config.model": "模型",
  "chat.config.model.hint": "要使用的模型的ID。",
  "chat.config.maxBacktrack": "最大回溯",
  "chat.config.maxBacktrack.hint": "最大回溯次数，0 表示无限制。",
  "chat.config.temperature": "温度",
  "chat.config.temperature.hint":
    "使用什么取样温度，0到2之间。较高的值(如0.8)将使输出更加随机，而较低的值(如0.2)将使输出更加集中和确定。",
  "chat.config.topP": "Top P",
  "chat.config.topP.hint":
    "温度采样的另一种替代方法称为核采样，其中模型考虑具有top_p概率质量的标记的结果。所以0.1意味着只考虑包含前10%概率质量的令牌。",
  "chat.config.n": "N",
  "chat.config.n.hint": "为每个输入消息生成多少个聊天完成选项。",
  "chat.config.stop": "停止",
  "chat.config.stop.hint": "最多4个序列，API将停止生成进一步的符号。",
  "chat.config.maxTokens": "最大字数",
  "chat.config.maxTokens.hint": "聊天时生成的最大字数。",
  "chat.config.presencePenalty": "存在惩罚",
  "chat.config.presencePenalty.hint":
    "介于-2.0和2.0之间的数字。正值会根据新标记到目前为止是否出现在文本中来惩罚它们，从而增加模型谈论新主题的可能性。",
  "chat.config.frequencyPenalty": "频率惩罚",
  "chat.config.frequencyPenalty.hint":
    "介于-2.0和2.0之间的数字。正值会根据新符号在文本中的现有频率来惩罚它们，从而降低模型逐字重复同一行的可能性。",

  "chat.export": "导出",

  "chatModel.new": "新建模型",
  "chatModel.models": "模型列表",
  "chatModel.inputNameHint": "请输入模型名称",
  "chatModel.rename": "重命名",
  "chatModel.update.success": "更新成功",

  "prompt.new": "新建提示词",
  "prompt.prompts": "提示词列表",
  "prompt.inputNameHint": "请输入提示词标题",
  "prompt.newChat": "新建对话",
  "prompt.rename": "重命名",
  "prompt.update.success": "更新成功",

  "prompt.market.prompts": "提示词市场",
  "prompt.market.actions.install": "安装",
  "prompt.market.actions.newChat": "新建对话",
  "prompt.market.install.success": "提示词安装成功",

  "plugin.market.plugins": "插件市场",
  "plugin.market.actions.install": "安装",
  "plugin.market.actions.update": "更新",
  "plugin.market.actions.uninstall": "卸载",

  "config.setting": "设置",

  "setting.upgrade.newVersion": "有新版本可用",
  "setting.upgrade.cancel": "暂不升级",
  "setting.upgrade.upgrade": "升级",
  "setting.upgrade.downloading": "正在下载...",
  "setting.upgrade.relaunch": "重启",
  "setting.upgrade.later": "稍后重启",
  "setting.upgrade.download.success": "下载成功",
  "setting.upgrade.restart.hint": "请重启应用以应用更新。",

  "setting.locale": "语言",
  "setting.apiKey": "密钥",
  "setting.proxy": "代理",
  "setting.theme": "主题",
  "setting.theme.system": "跟随系统",
  "setting.theme.dark": "暗色",
  "setting.theme.light": "亮色",
  "setting.forwardUrl": "转发地址",
  "setting.forwardApiKey": "转发密钥",
  "setting.port": "端口",
  "setting.webPage": "网页版",
  "setting.enableWebServer": "启用 Web 服务",
  "setting.hideTaskbar": "隐藏任务栏图标",
  "setting.hideMainWindow": "隐藏主窗口",
  "setting.needRestart.hint": "下面的设置需要重启应用才能生效",
};

export default messages;
