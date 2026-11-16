<template>
  <div class="yc-commandbar">
    <button class="yc-iconbtn yc-commandbar__menu" @click="openSidebar">
      <YcIcon name="menu" :size="19" />
    </button>

    <div class="yc-commandbar__nav">
      <button class="yc-iconbtn" title="后退" @click="back">
        <YcIcon name="arrow-left" :size="18" />
      </button>
      <button class="yc-iconbtn" title="前进" @click="forward">
        <YcIcon name="arrow-right" :size="18" />
      </button>
    </div>

    <div class="yc-crumbs" role="navigation" aria-label="路径">
      <button class="yc-crumbs__item" @click="jump(0)">我的文件</button>
      <template v-for="(crumb, i) in crumbs" :key="i">
        <YcIcon name="chevron-right" :size="13" class="yc-crumbs__sep" />
        <button
          class="yc-crumbs__item"
          :class="{ 'is-current': i === crumbs.length - 1 }"
          @click="jump(i + 1)"
        >
          {{ crumb }}
        </button>
      </template>
    </div>

    <button class="yc-search" @click="openSearch">
      <YcIcon name="search" :size="16" />
      <span>搜索文件</span>
      <kbd>Ctrl K</kbd>
    </button>

    <div ref="viewRef" class="yc-view">
      <button
        class="yc-iconbtn yc-view__trigger"
        :class="{ 'is-active': viewOpen }"
        title="视图设置"
        @click="viewOpen = !viewOpen"
      >
        <YcIcon
          :name="yc.viewMode === 'grid' ? 'grid' : 'list'"
          :size="18"
        />
        <YcIcon name="chevron-down" :size="11" class="yc-view__caret" />
      </button>

      <div v-if="viewOpen" class="yc-view__menu">
        <p class="yc-view__caption">视图</p>
        <button
          class="yc-view__item"
          :class="{ 'is-active': yc.viewMode === 'list' }"
          @click="setView('list')"
        >
          <YcIcon name="list" :size="16" />
          <span>列表</span>
          <YcIcon
            v-if="yc.viewMode === 'list'"
            name="check"
            :size="14"
            class="yc-view__check"
          />
        </button>
        <button
          class="yc-view__item"
          :class="{ 'is-active': yc.viewMode === 'grid' }"
          @click="setView('grid')"
        >
          <YcIcon name="grid" :size="16" />
          <span>图标</span>
          <YcIcon
            v-if="yc.viewMode === 'grid'"
            name="check"
            :size="14"
            class="yc-view__check"
          />
        </button>

        <div class="yc-view__sep" />

        <div class="yc-view__subwrap">
          <button
            class="yc-view__item"
            :class="{ 'is-disabled': yc.viewMode !== 'grid' }"
            @click="toggleSize"
          >
            <YcIcon name="grid" :size="16" />
            <span class="yc-view__grow">
              图标大小
              <small>{{ sizeLabel }}</small>
            </span>
            <YcIcon name="chevron-right" :size="13" class="yc-view__arrow" />
          </button>
          <div v-if="sizeOpen && yc.viewMode === 'grid'" class="yc-view__submenu">
            <button
              v-for="size in iconSizes"
              :key="size.id"
              class="yc-view__item"
              :class="{ 'is-active': yc.iconSize === size.id }"
              @click="chooseSize(size.id)"
            >
              <span>{{ size.label }}</span>
              <YcIcon
                v-if="yc.iconSize === size.id"
                name="check"
                :size="14"
                class="yc-view__check"
              />
            </button>
          </div>
        </div>

        <div class="yc-view__sep" />

        <button class="yc-view__item" @click="yc.toggleGrouped()">
          <YcIcon name="columns" :size="16" />
          <span class="yc-view__grow">
            分组显示
            <small>文件夹在上，文件在下</small>
          </span>
          <YcIcon
            v-if="yc.grouped"
            name="check"
            :size="14"
            class="yc-view__check"
          />
        </button>

        <div class="yc-view__sep" />

        <button class="yc-view__item" @click="toggleHidden">
          <YcIcon name="eye" :size="16" />
          <span class="yc-view__grow">
            显示隐藏项目
            <small>以点开头的文件</small>
          </span>
          <YcIcon
            v-if="showHidden"
            name="check"
            :size="14"
            class="yc-view__check"
          />
        </button>
      </div>
    </div>

    <button
      class="yc-iconbtn yc-details-toggle"
      :class="{ 'is-active': yc.detailsOpen }"
      title="详情面板"
      @click="yc.toggleDetails()"
    >
      <YcIcon name="columns" :size="18" />
    </button>

    <template v-if="canCreate">
      <button class="yc-iconbtn" title="刷新" @click="refresh">
        <YcIcon name="refresh" :size="17" />
      </button>
      <button class="yc-btn yc-commandbar__upload" @click="upload">
        <YcIcon name="upload" :size="16" />
        <span>上传</span>
      </button>
      <div class="yc-new">
        <button class="yc-btn yc-btn--primary" @click="toggleNew">
          <YcIcon name="plus" :size="16" />
          <span>新建</span>
          <YcIcon name="chevron-down" :size="13" />
        </button>
        <div v-if="newOpen" class="yc-new__menu" @mouseleave="newOpen = false">
          <button @click="newPrompt('newDir')">
            <YcIcon name="folder-plus" :size="16" />
            新建文件夹
          </button>
          <button @click="newPrompt('newFile')">
            <YcIcon name="file-plus" :size="16" />
            新建文件
          </button>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, onBeforeUnmount, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useFileStore } from "@/stores/file";
import { useLayoutStore } from "@/stores/layout";
import { useAuthStore } from "@/stores/auth";
import { useYcStore } from "@/stores/yc";
import { users } from "@/api";
import YcIcon from "@/components/yc/YcIcon.vue";

const router = useRouter();
const route = useRoute();
const fileStore = useFileStore();
const layoutStore = useLayoutStore();
const authStore = useAuthStore();
const yc = useYcStore();
const $showError = inject<IToastError>("$showError")!;

const newOpen = ref(false);
const viewOpen = ref(false);
const sizeOpen = ref(false);
const viewRef = ref<HTMLElement | null>(null);

const iconSizes = [
  { id: "small", label: "小" },
  { id: "medium", label: "中" },
  { id: "large", label: "大" },
] as const;

const sizeLabel = computed(
  () => iconSizes.find((size) => size.id === yc.iconSize)?.label ?? "中"
);

const showHidden = computed(
  () => authStore.user !== null && authStore.user.hideDotfiles === false
);

const setView = (mode: "list" | "grid") => {
  yc.setViewMode(mode);
  viewOpen.value = false;
  sizeOpen.value = false;
};

const chooseSize = (id: "small" | "medium" | "large") => {
  yc.setIconSize(id);
  viewOpen.value = false;
  sizeOpen.value = false;
};

const toggleSize = () => {
  if (yc.viewMode !== "grid") return;
  sizeOpen.value = !sizeOpen.value;
};

const toggleHidden = async () => {
  const user = authStore.user;
  if (!user) return;

  const hideDotfiles = !user.hideDotfiles;
  try {
    await users.update({ id: user.id, hideDotfiles }, ["hideDotfiles"]);
    authStore.updateUser({ hideDotfiles });
    fileStore.reload = true;
  } catch (error) {
    if (error instanceof Error) $showError(error);
  }

  viewOpen.value = false;
  sizeOpen.value = false;
};

const onDocClick = (event: MouseEvent) => {
  if (!viewOpen.value) return;
  const target = event.target as Node | null;
  if (target && viewRef.value && !viewRef.value.contains(target)) {
    viewOpen.value = false;
    sizeOpen.value = false;
  }
};

const onEsc = (event: KeyboardEvent) => {
  if (event.key !== "Escape") return;
  viewOpen.value = false;
  sizeOpen.value = false;
};

onMounted(() => {
  document.addEventListener("click", onDocClick, true);
  window.addEventListener("keydown", onEsc);
});

onBeforeUnmount(() => {
  document.removeEventListener("click", onDocClick, true);
  window.removeEventListener("keydown", onEsc);
});

const crumbs = computed(() => {
  const path = route.path.replace(/^\/files\/?/, "");
  if (!path) return [];
  return path
    .split("/")
    .filter(Boolean)
    .map((seg) => {
      try {
        return decodeURIComponent(seg);
      } catch {
        return seg;
      }
    });
});

const canCreate = computed(() => authStore.user?.perm?.create === true);

const jump = (depth: number) => {
  const segs = route.path
    .replace(/^\/files\/?/, "")
    .split("/")
    .filter(Boolean)
    .slice(0, depth);
  router.push("/files/" + segs.map((s) => s).join("/"));
};

const back = () => router.back();
const forward = () => router.forward();

const openSidebar = () => layoutStore.showHover("sidebar");
const openSearch = () => layoutStore.showHover("search");
const refresh = () => {
  fileStore.reload = true;
};
const upload = () => layoutStore.showHover("upload");

const toggleNew = () => {
  newOpen.value = !newOpen.value;
};
const newPrompt = (name: string) => {
  newOpen.value = false;
  layoutStore.showHover(name);
};
</script>

<style scoped>
.yc-commandbar {
  display: flex;
  align-items: center;
  gap: 8px;
  height: var(--yc-commandbar);
  padding: 0 16px;
  background: var(--yc-surface);
  border-bottom: 1px solid var(--yc-border);
  flex: none;
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
  transition: background 0.15s ease, color 0.15s ease;
  flex: none;
}
.yc-iconbtn:hover {
  background: var(--yc-surface-2);
  color: var(--yc-text);
}
.yc-iconbtn.is-active {
  background: var(--yc-accent-soft);
  color: var(--yc-accent);
}
.yc-iconbtn[disabled] {
  opacity: 0.35;
  cursor: default;
}
.yc-commandbar__menu {
  display: none;
}
.yc-commandbar__nav {
  display: flex;
  gap: 2px;
}

.yc-crumbs {
  display: flex;
  align-items: center;
  gap: 2px;
  min-width: 0;
  overflow: hidden;
  flex: 1;
}
.yc-crumbs__item {
  border: 0;
  background: transparent;
  color: var(--yc-text-2);
  font-family: inherit;
  font-size: 13px;
  padding: 5px 8px;
  border-radius: 7px;
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 180px;
}
.yc-crumbs__item:hover {
  background: var(--yc-surface-2);
  color: var(--yc-text);
}
.yc-crumbs__item.is-current {
  color: var(--yc-text);
  font-weight: 600;
}
.yc-crumbs__sep {
  color: var(--yc-border-strong);
  flex: none;
}

.yc-search {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 220px;
  height: 34px;
  padding: 0 10px;
  border: 1px solid var(--yc-border);
  border-radius: var(--yc-radius-sm);
  background: var(--yc-surface-2);
  color: var(--yc-muted);
  font-family: inherit;
  font-size: 12.5px;
  cursor: pointer;
  flex: none;
  transition: border-color 0.15s ease, background 0.15s ease;
}
.yc-search:hover {
  border-color: var(--yc-border-strong);
  background: var(--yc-surface);
}
.yc-search span {
  flex: 1;
  text-align: left;
}
.yc-search kbd {
  font-family: inherit;
  font-size: 10.5px;
  color: var(--yc-muted);
  border: 1px solid var(--yc-border);
  border-radius: 5px;
  padding: 1px 5px;
  background: var(--yc-surface);
}

.yc-view {
  position: relative;
  flex: none;
}
.yc-view__trigger {
  display: flex;
  align-items: center;
  gap: 1px;
  width: auto;
  padding: 0 5px;
}
.yc-view__caret {
  color: var(--yc-muted);
}
.yc-view__menu {
  position: absolute;
  right: 0;
  top: 40px;
  min-width: 196px;
  padding: 6px;
  background: var(--yc-surface);
  border: 1px solid var(--yc-border);
  border-radius: var(--yc-radius);
  box-shadow: var(--yc-shadow-lg);
  z-index: 60;
}
.yc-view__caption {
  margin: 6px 10px 4px;
  font-size: 10.5px;
  color: var(--yc-muted);
}
.yc-view__item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 10px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: var(--yc-text-2);
  font-family: inherit;
  font-size: 12.5px;
  cursor: pointer;
  text-align: left;
}
.yc-view__item:hover {
  background: var(--yc-accent-soft);
  color: var(--yc-accent);
}
.yc-view__item.is-active {
  color: var(--yc-accent);
  font-weight: 600;
}
.yc-view__item.is-disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
.yc-view__item.is-disabled:hover {
  background: transparent;
  color: var(--yc-text-2);
}
.yc-view__check {
  margin-left: auto;
  color: var(--yc-accent);
}
.yc-view__grow {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}
.yc-view__grow small {
  font-size: 10.5px;
  font-weight: 400;
  color: var(--yc-muted);
}
.yc-view__arrow {
  color: var(--yc-muted);
}
.yc-view__sep {
  height: 1px;
  margin: 5px 6px;
  background: var(--yc-border);
}
.yc-view__subwrap {
  position: relative;
}
.yc-view__submenu {
  position: absolute;
  left: 100%;
  top: 0;
  margin-left: 6px;
  min-width: 108px;
  padding: 5px;
  background: var(--yc-surface);
  border: 1px solid var(--yc-border);
  border-radius: 10px;
  box-shadow: var(--yc-shadow);
  z-index: 61;
}
.yc-view__submenu .yc-view__item {
  padding: 7px 10px;
}

.yc-commandbar__upload {
  margin-left: 2px;
}

.yc-new {
  position: relative;
  flex: none;
}
.yc-new__menu {
  position: absolute;
  right: 0;
  top: 40px;
  min-width: 168px;
  padding: 6px;
  background: var(--yc-surface);
  border: 1px solid var(--yc-border);
  border-radius: var(--yc-radius);
  box-shadow: var(--yc-shadow);
  z-index: 40;
}
.yc-new__menu button {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  border: 0;
  background: transparent;
  color: var(--yc-text-2);
  font-family: inherit;
  font-size: 13px;
  padding: 8px 10px;
  border-radius: 8px;
  cursor: pointer;
  text-align: left;
}
.yc-new__menu button:hover {
  background: var(--yc-accent-soft);
  color: var(--yc-accent);
}

@media (max-width: 1024px) {
  .yc-commandbar {
    flex-wrap: wrap;
    height: auto;
    padding: 6px 10px;
    gap: 6px;
    row-gap: 4px;
  }
  .yc-commandbar__menu {
    display: grid;
  }
  .yc-commandbar__nav {
    display: flex;
  }
  .yc-details-toggle,
  .yc-commandbar__upload span,
  .yc-search kbd {
    display: none;
  }
  .yc-search {
    width: 36px;
    justify-content: center;
    padding: 0;
    background: transparent;
    border-color: transparent;
  }
  .yc-search span {
    display: none;
  }
  .yc-iconbtn {
    width: 30px;
    height: 30px;
  }
  .yc-view__trigger {
    width: auto;
    padding: 0 4px;
  }
  .yc-crumbs {
    order: 10;
    flex: 0 0 100%;
    width: 100%;
    overflow-x: auto;
    overflow-y: hidden;
    padding-bottom: 2px;
    scrollbar-width: none;
    -webkit-overflow-scrolling: touch;
  }
  .yc-crumbs::-webkit-scrollbar {
    display: none;
  }
  .yc-crumbs__item {
    max-width: none;
    flex: none;
    padding: 4px 7px;
    font-size: 12.5px;
  }
  .yc-crumbs__sep {
    flex: none;
  }
}

@media (max-width: 620px) {
  .yc-commandbar {
    gap: 4px;
    padding: 6px 8px;
  }
  .yc-iconbtn {
    width: 28px;
    height: 28px;
  }
  .yc-crumbs__item {
    padding: 4px 6px;
  }
  .yc-btn {
    padding: 0 8px;
  }
  .yc-view__menu {
    min-width: 180px;
  }
  .yc-view__submenu {
    position: static;
    margin: 2px 0 4px;
    padding: 0 0 0 22px;
    min-width: 0;
    border: 0;
    box-shadow: none;
  }
}
</style>
