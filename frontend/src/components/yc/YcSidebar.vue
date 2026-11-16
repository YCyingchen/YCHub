<template>
  <div v-if="open" class="yc-sidebar__mask" @click="close"></div>
  <aside class="yc-sidebar" :class="{ 'is-open': open }">
    <div class="yc-brand">
      <span class="yc-brand__mark">YC</span>
      <span class="yc-brand__text">
        <strong>YCHub</strong>
        <small>影尘 · 自托管文件管理</small>
      </span>
      <button class="yc-iconbtn yc-sidebar__close" @click="close">
        <YcIcon name="x" :size="18" />
      </button>
    </div>

    <button v-if="isLoggedIn" class="yc-user" @click="go('/settings/profile')">
      <span class="yc-user__avatar">{{ initial }}</span>
      <span class="yc-user__meta">
        <span class="yc-user__name">{{ username }}</span>
        <span class="yc-user__role">{{ roleText }}</span>
      </span>
      <YcIcon name="chevron-right" :size="15" class="yc-user__arrow" />
    </button>

    <div v-if="!isLoggedIn" class="yc-guest">
      <p>你正在查看一个公开分享</p>
      <router-link v-if="!hideLoginButton" to="/login" class="yc-btn">
        登录 YCHub
      </router-link>
    </div>

    <div v-if="isLoggedIn" class="yc-nav">
      <p class="yc-nav__caption">快速访问</p>
      <div
        class="yc-nav__item yc-tree__root"
        :class="{ 'is-active': isRoot }"
        role="button"
        tabindex="0"
        @click="go('/files')"
        @keydown.enter="go('/files')"
      >
        <YcIcon name="home" :size="18" />
        <span>我的文件</span>
        <button
          class="yc-tree__chevron"
          :title="rootOpen ? '收起' : '展开'"
          @click.stop="rootOpen = !rootOpen"
        >
          <YcIcon
            :name="rootOpen ? 'chevron-down' : 'chevron-right'"
            :size="13"
          />
        </button>
      </div>
      <div v-if="rootOpen" class="yc-tree__children">
        <p v-if="volumesLoading" class="yc-nav__empty">读取存储空间…</p>
        <p v-else-if="volumes.length === 0" class="yc-nav__empty">
          暂无存储空间
        </p>
        <YcTreeNode
          v-for="vol in volumes"
          :key="vol.path"
          :node="vol"
          :depth="1"
        />
      </div>

      <button class="yc-nav__item" @click="toggleRecent">
        <YcIcon name="clock" :size="18" />
        <span>最近使用</span>
        <span v-if="recent.length" class="yc-nav__count">{{ recent.length }}</span>
        <YcIcon
          :name="showRecent ? 'chevron-up' : 'chevron-down'"
          :size="14"
          class="yc-nav__chevron"
        />
      </button>
      <div v-if="showRecent" class="yc-nav__sub">
        <p v-if="!recent.length" class="yc-nav__empty">还没有访问记录</p>
        <button
          v-for="item in recent"
          :key="item.path"
          class="yc-nav__subitem"
          @click="go(item.path)"
        >
          {{ item.name }}
        </button>
      </div>

      <button class="yc-nav__item" @click="toggleFavorites">
        <YcIcon name="star" :size="18" />
        <span>收藏</span>
        <span v-if="favorites.length" class="yc-nav__count">{{
          favorites.length
        }}</span>
        <YcIcon
          :name="showFavorites ? 'chevron-up' : 'chevron-down'"
          :size="14"
          class="yc-nav__chevron"
        />
      </button>
      <div v-if="showFavorites" class="yc-nav__sub">
        <p v-if="!favorites.length" class="yc-nav__empty">
          在详情面板点星标收藏文件夹
        </p>
        <button
          v-for="item in favorites"
          :key="item.path"
          class="yc-nav__subitem"
          @click="go(item.path)"
        >
          <YcIcon name="folder" :size="14" />
          {{ item.name }}
        </button>
      </div>

      <p class="yc-nav__caption">工具</p>
      <button class="yc-nav__item" @click="go('/shares')">
        <YcIcon name="link" :size="18" />
        <span>分享管理</span>
      </button>
      <button class="yc-nav__item is-disabled" disabled>
        <YcIcon name="transfer" :size="18" />
        <span>传输任务</span>
        <span class="yc-nav__soon">即将</span>
      </button>
      <button class="yc-nav__item is-disabled" disabled>
        <YcIcon name="trash" :size="18" />
        <span>回收站</span>
        <span class="yc-nav__soon">即将</span>
      </button>

      <template v-if="isAdmin">
        <p class="yc-nav__caption">系统</p>
        <button
          class="yc-nav__item"
          :class="{ 'is-active': route.path.startsWith('/settings') }"
          @click="go('/settings/global')"
        >
          <YcIcon name="settings" :size="18" />
          <span>设置</span>
        </button>
      </template>
    </div>

    <div class="yc-sidebar__foot">
      <div v-if="isLoggedIn" class="yc-usage">
        <div class="yc-usage__row">
          <span>存储空间</span>
          <span class="yc-usage__value">{{ used }} / {{ total }}</span>
        </div>
        <div class="yc-usage__track">
          <span :style="{ width: usedPercent + '%' }" />
        </div>
      </div>
      <div class="yc-sidebar__bottom">
        <span class="yc-sidebar__version">YCHub v{{ displayVersion }}</span>
        <button v-if="canLogout" class="yc-sidebar__logout" @click="logout">
          <YcIcon name="logout" :size="15" />
          退出
        </button>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { storeToRefs } from "pinia";
import { useAuthStore } from "@/stores/auth";
import { useLayoutStore } from "@/stores/layout";
import { useYcStore } from "@/stores/yc";
import { files as api, volumes as volumesApi } from "@/api";
import * as auth from "@/utils/auth";
import {
  version,
  noAuth,
  loginPage,
  logoutPage,
  hideLoginButton,
} from "@/utils/constants";
import prettyBytes from "pretty-bytes";
import YcIcon from "@/components/yc/YcIcon.vue";
import YcTreeNode from "@/components/yc/YcTreeNode.vue";

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const layoutStore = useLayoutStore();
const yc = useYcStore();
const { recent, favorites } = storeToRefs(yc);

const open = computed(() => layoutStore.currentPromptName === "sidebar");
const isLoggedIn = computed(() => authStore.isLoggedIn);
const username = computed(() => authStore.user?.username ?? "");
const isAdmin = computed(() => authStore.user?.perm?.admin === true);
const initial = computed(() => (username.value[0] ?? "Y").toUpperCase());
const roleText = computed(() => (isAdmin.value ? "管理员" : "用户"));
const displayVersion = computed(() =>
  /^\d/.test(version) ? version : "1.0.0"
);
const isRoot = computed(
  () => route.path === "/files" || route.path === "/files/"
);
const canLogout = computed(
  () => !noAuth && (loginPage || logoutPage !== "/login")
);

const showRecent = ref(false);
const showFavorites = ref(false);
const rootOpen = ref(true);
const volumes = ref<VolumeInfo[]>([]);
const volumesLoading = ref(true);

const used = ref("0 B");
const total = ref("0 B");
const usedPercent = ref(0);

const close = () => layoutStore.closeHovers();
const go = (path: string) => {
  router.push(path);
  close();
};
const toggleRecent = () => {
  showRecent.value = !showRecent.value;
  if (showRecent.value) showFavorites.value = false;
};
const toggleFavorites = () => {
  showFavorites.value = !showFavorites.value;
  if (showFavorites.value) showRecent.value = false;
};
const logout = () => {
  close();
  auth.logout();
};

let usageController: AbortController | null = null;
const fetchUsage = async () => {
  if (!isLoggedIn.value) return;
  usageController?.abort();
  usageController = new AbortController();
  try {
    const res = await api.usage("/files/", usageController.signal);
    used.value = prettyBytes(res.used, { binary: true });
    total.value = prettyBytes(res.total, { binary: true });
    usedPercent.value =
      res.total > 0 ? Math.min(100, Math.round((res.used / res.total) * 100)) : 0;
  } catch {
    /* 忽略用量请求失败，避免打断导航 */
  }
};

const loadVolumes = async () => {
  volumesLoading.value = true;
  try {
    volumes.value = await volumesApi.list();
  } catch {
    volumes.value = [];
  } finally {
    volumesLoading.value = false;
  }
};

onMounted(() => {
  fetchUsage();
  loadVolumes();
});
watch(
  () => route.path,
  (p) => {
    close();
    if (p.startsWith("/files")) fetchUsage();
  }
);
</script>

<style scoped>
.yc-sidebar {
  position: fixed;
  inset: 0 auto 0 0;
  width: var(--yc-sidebar);
  display: flex;
  flex-direction: column;
  padding: 16px 12px 12px;
  background: var(--yc-surface);
  border-right: 1px solid var(--yc-border);
  z-index: 60;
}

.yc-sidebar__mask {
  display: none;
}

.yc-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 4px 6px 14px;
}
.yc-brand__mark {
  width: 36px;
  height: 36px;
  border-radius: 11px;
  display: grid;
  place-items: center;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.4px;
  color: #fff;
  background: linear-gradient(135deg, #4f6bff 0%, #7a5cff 100%);
  box-shadow: 0 6px 14px rgba(79, 107, 255, 0.28);
}
.yc-brand__text {
  display: flex;
  flex-direction: column;
  line-height: 1.25;
  min-width: 0;
}
.yc-brand__text strong {
  font-size: 18px;
  font-weight: 700;
  color: var(--yc-text);
  letter-spacing: 0.2px;
}
.yc-brand__text small {
  font-size: 10.5px;
  color: var(--yc-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.yc-sidebar__close {
  display: none;
  margin-left: auto;
}

.yc-iconbtn {
  width: 30px;
  height: 30px;
  display: grid;
  place-items: center;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: var(--yc-muted);
  cursor: pointer;
}
.yc-iconbtn:hover {
  background: var(--yc-accent-soft);
  color: var(--yc-accent);
}

.yc-user {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px;
  margin-bottom: 14px;
  border: 1px solid var(--yc-border);
  border-radius: var(--yc-radius);
  background: var(--yc-surface-2);
  cursor: pointer;
  text-align: left;
  font-family: inherit;
  transition: border-color 0.15s ease, background 0.15s ease;
}
.yc-user:hover {
  border-color: var(--yc-accent);
  background: var(--yc-accent-soft);
}
.yc-user__avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: var(--yc-accent);
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  flex: none;
}
.yc-user__meta {
  display: flex;
  flex-direction: column;
  min-width: 0;
  line-height: 1.3;
}
.yc-user__name {
  font-size: 13px;
  font-weight: 600;
  color: var(--yc-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.yc-user__role {
  font-size: 11px;
  color: var(--yc-muted);
}
.yc-user__arrow {
  margin-left: auto;
  color: var(--yc-muted);
  flex: none;
}

.yc-nav {
  flex: 1;
  overflow-y: auto;
  padding: 0 2px;
  margin: 0 -2px;
}
.yc-nav__caption {
  margin: 12px 8px 6px;
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.3px;
  color: var(--yc-muted);
}
.yc-nav__item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  height: 36px;
  padding: 0 10px;
  margin-bottom: 2px;
  border: 0;
  border-radius: var(--yc-radius-sm);
  background: transparent;
  color: var(--yc-text-2);
  font-family: inherit;
  font-size: 13px;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
  text-align: left;
}
.yc-nav__item:hover {
  background: var(--yc-surface-2);
  color: var(--yc-text);
}
.yc-nav__item.is-active {
  background: var(--yc-accent-soft);
  color: var(--yc-accent);
  font-weight: 600;
}
.yc-nav__item.is-active :deep(.yc-icon) {
  color: var(--yc-accent);
}
.yc-nav__item.is-disabled {
  color: var(--yc-muted);
  cursor: default;
  opacity: 0.7;
}
.yc-nav__item.is-disabled:hover {
  background: transparent;
}
.yc-nav__count {
  margin-left: auto;
  font-size: 11px;
  color: var(--yc-muted);
}
.yc-nav__chevron {
  margin-left: 4px;
  color: var(--yc-muted);
}
.yc-nav__soon {
  margin-left: auto;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: var(--yc-radius-pill);
  background: var(--yc-surface-2);
  color: var(--yc-muted);
}
.yc-nav__sub {
  padding: 2px 0 4px 38px;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.yc-tree__root {
  cursor: pointer;
}
.yc-tree__root > span {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.yc-tree__chevron {
  width: 18px;
  height: 18px;
  display: grid;
  place-items: center;
  border: 0;
  border-radius: 5px;
  background: transparent;
  color: var(--yc-muted);
  cursor: pointer;
  flex: none;
  margin-left: auto;
}
.yc-tree__chevron:hover {
  background: var(--yc-surface);
  color: var(--yc-text);
}
.yc-tree__children {
  padding: 2px 0 6px;
}
.yc-nav__subitem {
  display: flex;
  align-items: center;
  gap: 6px;
  border: 0;
  background: transparent;
  color: var(--yc-muted);
  font-family: inherit;
  font-size: 12px;
  padding: 5px 8px;
  border-radius: 7px;
  cursor: pointer;
  text-align: left;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.yc-nav__subitem:hover {
  background: var(--yc-surface-2);
  color: var(--yc-text);
}
.yc-nav__empty {
  margin: 2px 8px 4px;
  font-size: 11px;
  color: var(--yc-muted);
}

.yc-guest {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px;
  border: 1px solid var(--yc-border);
  border-radius: var(--yc-radius);
  background: var(--yc-surface-2);
}
.yc-guest p {
  margin: 0;
  font-size: 12px;
  color: var(--yc-muted);
  line-height: 1.5;
}

.yc-sidebar__foot {
  flex: none;
  padding-top: 10px;
  border-top: 1px solid var(--yc-border);
}
.yc-usage {
  padding: 2px 4px 10px;
}
.yc-usage__row {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: var(--yc-muted);
  margin-bottom: 6px;
}
.yc-usage__value {
  color: var(--yc-text-2);
}
.yc-usage__track {
  height: 5px;
  border-radius: 3px;
  background: var(--yc-surface-2);
  overflow: hidden;
  border: 1px solid var(--yc-border);
}
.yc-usage__track span {
  display: block;
  height: 100%;
  background: var(--yc-accent);
  border-radius: 3px;
  transition: width 0.3s ease;
}
.yc-sidebar__bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 4px;
}
.yc-sidebar__version {
  font-size: 10.5px;
  color: var(--yc-muted);
}
.yc-sidebar__logout {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border: 0;
  background: transparent;
  color: var(--yc-muted);
  font-family: inherit;
  font-size: 11px;
  cursor: pointer;
  padding: 4px 6px;
  border-radius: 7px;
}
.yc-sidebar__logout:hover {
  color: var(--yc-danger);
  background: var(--yc-danger-soft);
}

@media (max-width: 1024px) {
  .yc-sidebar {
    transform: translateX(-100%);
    transition: transform 0.22s ease;
    box-shadow: var(--yc-shadow-lg);
    width: 260px;
  }
  .yc-sidebar.is-open {
    transform: translateX(0);
  }
  .yc-sidebar__mask {
    display: block;
    position: fixed;
    inset: 0;
    background: rgba(16, 24, 40, 0.32);
    z-index: 55;
  }
  .yc-sidebar__close {
    display: grid;
  }
}
</style>
