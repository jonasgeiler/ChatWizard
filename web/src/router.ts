import { createRouter, createWebHashHistory } from "vue-router";

export default createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: "/",
      component: () => import("./App"),
      redirect: "/main/casual-chat",
      children: [
        {
          path: "main",
          component: () => import("./pages/main/Index"),
          children: [
            {
              name: "casual-chat",
              path: "casual-chat",
              component: () => import("./pages/main/CasualChat"),
            },
            {
              name: "chat",
              path: "chat",
              component: () => import("./pages/main/Chat"),
            },
            {
              name: "prompt",
              path: "prompt",
              component: () => import("./pages/main/Prompt"),
            },
            {
              name: "promptMarket",
              path: "prompt-market",
              component: () => import("./pages/main/PromptMarket"),
            },
            {
              name: "plugin",
              path: "plugin",
              component: () => import("./pages/main/Plugin"),
            },
            {
              name: "setting",
              path: "setting",
              component: () => import("./pages/setting/Index"),
            },
          ],
        },
        {
          path: "casual-chat",
          component: () => import("./pages/casualChat/Index"),
        },
        {
          path: "setting",
          component: () => import("./pages/setting/Index"),
        },
        {
          path: "export",
          component: () => import("./pages/export/Index"),
        },
        {
          path: "about",
          component: () => import("./pages/about/Index"),
        },
      ],
    },
  ],
});
