<template>
  <div class="yc-settings">
    <div class="yc-settings__bar">
      <button class="yc-iconbtn yc-settings__menu" @click="openSidebar">
        <YcIcon name="menu" :size="19" />
      </button>
      <h1>设置</h1>
    </div>

    <div class="yc-settings__body">
      <aside class="yc-settings__nav">
        <router-link
          to="/settings/appearance"
          class="yc-settings__link"
          active-class="is-active"
        >
          <YcIcon name="image" :size="17" />
          外观
        </router-link>
        <router-link
          to="/settings/profile"
          class="yc-settings__link"
          active-class="is-active"
        >
          <YcIcon name="user" :size="17" />
          账号
        </router-link>
        <router-link
          to="/settings/storage"
          class="yc-settings__link"
          active-class="is-active"
        >
          <YcIcon name="folder" :size="17" />
          存储
        </router-link>
        <router-link
          to="/settings/about"
          class="yc-settings__link"
          active-class="is-active"
        >
          <YcIcon name="info" :size="17" />
          关于
        </router-link>

        <template v-if="user?.perm.admin">
          <p class="yc-settings__caption">管理员</p>
          <router-link
            to="/settings/global"
            class="yc-settings__link"
            active-class="is-active"
          >
            <YcIcon name="settings" :size="17" />
            全局设置
          </router-link>
          <router-link
            to="/settings/users"
            class="yc-settings__link"
            active-class="is-active"
          >
            <YcIcon name="user" :size="17" />
            用户管理
          </router-link>
        </template>
      </aside>

      <div class="yc-settings__content">
        <router-view></router-view>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from "@/stores/auth";
import { useLayoutStore } from "@/stores/layout";
import { computed, onBeforeUnmount, onMounted } from "vue";
import YcIcon from "@/components/yc/YcIcon.vue";

const authStore = useAuthStore();
const layoutStore = useLayoutStore();

const user = computed(() => authStore.user);

const openSidebar = () => layoutStore.showHover("sidebar");

onMounted(() => document.body.classList.add("yc-settings-mode"));
onBeforeUnmount(() => document.body.classList.remove("yc-settings-mode"));
</script>

<style scoped>
.yc-settings {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--yc-bg);
}

.yc-settings__bar {
  position: static;
  z-index: auto;
  flex: none;
  width: 100%;
  height: var(--yc-commandbar);
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 20px;
  background: var(--yc-surface);
  border-bottom: 1px solid var(--yc-border);
}
.yc-settings__bar h1 {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: var(--yc-text);
}
.yc-settings__menu {
  display: none;
}

.yc-settings__body {
  flex: 1;
  display: flex;
  min-height: 0;
}

.yc-settings__nav {
  width: 200px;
  flex: none;
  padding: 18px 12px;
  border-right: 1px solid var(--yc-border);
  background: var(--yc-surface);
  overflow-y: auto;
}
.yc-settings__caption {
  margin: 16px 10px 6px;
  font-size: 11px;
  color: var(--yc-muted);
}
.yc-settings__link {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 36px;
  padding: 0 10px;
  margin-bottom: 2px;
  border-radius: var(--yc-radius-sm);
  color: var(--yc-text-2);
  font-size: 13px;
  text-decoration: none;
}
.yc-settings__link:hover {
  background: var(--yc-surface-2);
  color: var(--yc-text);
}
.yc-settings__link.is-active {
  background: var(--yc-accent-soft);
  color: var(--yc-accent);
  font-weight: 600;
}

.yc-settings__content {
  flex: 1;
  min-width: 0;
  overflow-y: auto;
  padding: 28px 40px 60px;
}
.yc-settings__content > :deep(*) {
  max-width: 880px;
}
.yc-settings__loading {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--yc-muted);
  font-size: 13px;
}

.yc-iconbtn {
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: var(--yc-text-2);
  cursor: pointer;
}
.yc-iconbtn:hover {
  background: var(--yc-surface-2);
}

.yc-spinner {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid var(--yc-border);
  border-top-color: var(--yc-accent);
  animation: yc-set-spin 0.9s linear infinite;
}
@keyframes yc-set-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 900px) {
  .yc-settings__bar {
    padding: 0 10px;
  }
  .yc-settings__menu {
    display: grid;
  }
  .yc-settings__body {
    flex-direction: column;
    overflow-y: auto;
  }
  .yc-settings__nav {
    width: 100%;
    display: flex;
    gap: 6px;
    padding: 10px;
    border-right: 0;
    border-bottom: 1px solid var(--yc-border);
    overflow-x: auto;
  }
  .yc-settings__caption {
    display: none;
  }
  .yc-settings__link {
    flex: none;
    height: 34px;
    padding: 0 12px;
    margin: 0;
    border: 1px solid var(--yc-border);
    border-radius: var(--yc-radius-pill);
  }
  .yc-settings__content {
    overflow: visible;
    padding: 18px 14px 40px;
  }
}
</style>
