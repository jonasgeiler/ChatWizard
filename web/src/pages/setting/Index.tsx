import {
  NButton,
  NDivider,
  NForm,
  NFormItem,
  NInput,
  NRadioButton,
  NRadioGroup,
  NScrollbar,
  NSelect,
  NSwitch,
} from "naive-ui";
import { computed, defineComponent, nextTick } from "vue";
import { getSettings, updateSettings, Settings } from "../../api";
import { useAsyncData } from "../../hooks/asyncData";
import { useI18n } from "../../hooks/i18n";
import { openUrl, getPlatform } from "../../utils/api";
import { isTauri } from "../../utils/env";
import { languages } from "../../i18n";

export default defineComponent({
  setup() {
    const { t } = useI18n();

    const platform = useAsyncData(getPlatform);
    const isMacos = computed(() => platform.value === "darwin");

    const model = useAsyncData(async () => {
      return getSettings();
    }, {});

    async function updateSettingHandler(key: keyof Settings) {
      nextTick().then(async () => {
        await updateSettings({
          [key]: model.value[key],
        });
      });
    }

    return () => (
      <div
        data-tauri-drag-region
        class="h-full p-8 flex flex-col justify-center"
      >
        <NScrollbar>
          <div class="grid place-items-center pr-12 h-full">
            {model.value ? (
              <NForm
                class="w-full"
                model={model.value}
                labelPlacement="left"
                labelWidth="auto"
              >
                <NFormItem label={t("setting.locale") + " :"}>
                  <NSelect
                    v-model:value={model.value.language}
                    onUpdateValue={() => updateSettingHandler("language")}
                    options={languages.map((lang) => ({
                      label: lang.messages.lang,
                      value: lang.lang,
                    }))}
                  ></NSelect>
                </NFormItem>
                <NFormItem label={t("setting.theme") + " :"}>
                  <NRadioGroup
                    v-model:value={model.value.theme}
                    onUpdateValue={() => updateSettingHandler("theme")}
                  >
                    <NRadioButton value="system">
                      {t("setting.theme.system")}
                    </NRadioButton>
                    <NRadioButton value="light">
                      {t("setting.theme.light")}
                    </NRadioButton>
                    <NRadioButton value="dark">
                      {t("setting.theme.dark")}
                    </NRadioButton>
                  </NRadioGroup>
                </NFormItem>
                <NFormItem label={t("setting.apiKey") + " :"}>
                  <NInput
                    v-model:value={model.value.apiKey}
                    type="password"
                    showPasswordOn="click"
                    placeholder={`sk-${"x".repeat(48)}`}
                    onBlur={() => updateSettingHandler("apiKey")}
                  ></NInput>
                </NFormItem>
                <NFormItem label={t("setting.proxy") + " :"}>
                  <NInput
                    v-model:value={model.value.proxy}
                    onBlur={() => updateSettingHandler("proxy")}
                    placeholder="e.g. http://127.0.0.1:1080"
                  ></NInput>
                </NFormItem>
                <NFormItem label={t("setting.forwardUrl") + " :"}>
                  <NInput
                    v-model:value={model.value.forwardUrl}
                    onBlur={() => updateSettingHandler("forwardUrl")}
                    placeholder="e.g. http://your-server:8080"
                  ></NInput>
                </NFormItem>
                <NFormItem label={t("setting.forwardApiKey") + " :"}>
                  <NSwitch
                    v-model:value={model.value.forwardApiKey}
                    onUpdateValue={() => updateSettingHandler("forwardApiKey")}
                  ></NSwitch>
                </NFormItem>
                {isTauri ? (
                  <NFormItem label={t("setting.homePage") + " :"}>
                    <NSelect
                      v-model:value={model.value.homePage}
                      onUpdateValue={() => updateSettingHandler("homePage")}
                      options={[
                        {
                          label: t("chat.casual.title"),
                          value: "casual",
                        },
                        {
                          label: t("chat.conversations"),
                          value: "chats",
                        },
                      ]}
                    ></NSelect>
                  </NFormItem>
                ) : null}
                {isTauri ? (
                  <NDivider>{t("setting.needRestart.hint")}</NDivider>
                ) : null}
                {isTauri ? (
                  <NFormItem label={t("setting.hideMainWindow") + " :"}>
                    <NSwitch
                      v-model:value={model.value.hideMainWindow}
                      onUpdateValue={() =>
                        updateSettingHandler("hideMainWindow")
                      }
                    ></NSwitch>
                  </NFormItem>
                ) : null}
                {isTauri && !isMacos ? (
                  <NFormItem label={t("setting.hideTaskbar") + " :"}>
                    <NSwitch
                      v-model:value={model.value.hideTaskbar}
                      onUpdateValue={() => updateSettingHandler("hideTaskbar")}
                    ></NSwitch>
                  </NFormItem>
                ) : null}
                {isTauri ? (
                  <NFormItem label={t("setting.enableWebServer") + " :"}>
                    <NSwitch
                      v-model:value={model.value.enableWebServer}
                      onUpdateValue={() =>
                        updateSettingHandler("enableWebServer")
                      }
                    ></NSwitch>
                    {model.value.enableWebServer ? (
                      <NButton
                        class="ml-4"
                        text
                        onClick={() => openUrl("http://127.0.0.1:23333")}
                      >
                        http://127.0.0.1:23333
                      </NButton>
                    ) : null}
                  </NFormItem>
                ) : null}
              </NForm>
            ) : null}
          </div>
        </NScrollbar>
      </div>
    );
  },
});
