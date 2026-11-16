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

    <div class="yc-segment" role="group" aria-label="视图">
      <button
        class="yc-segment__btn"
        :class="{ 'is-active': yc.viewMode === 'list' }"
        title="列表视图"
        @click="yc.setViewMode('list')"
      >
        <YcIcon name="list" :size="17" />
      </button>
      <button
        class="yc-segment__btn"
        :class="{ 'is-active': yc.viewMode === 'grid' }"
        title="图标视图"
        @click="yc.setViewMode('grid')"
      >
        <YcIcon name="grid" :size="16" />
      </button>
    </div>

    <div
      v-if="yc.viewMode === 'grid'"
      class="yc-size"
      role="group"
      aria-label="图标大小"
    >
      <button
        v-for="size in iconSizes"
        :key="size.id"
        class="yc-size__btn"
        :class="{ 'is-active': yc.iconSize === size.id }"
        :title="`${size.label}图标`"
        @click="yc.setIconSize(size.id)"
      >
        {{ size.label }}
      </button>
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
import { computed, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useFileStore } from "@/stores/file";
import { useLayoutStore } from "@/stores/layout";
import { useAuthStore } from "@/stores/auth";
import { useYcStore } from "@/stores/yc";
import YcIcon from "@/components/yc/YcIcon.vue";

const router = useRouter();
const route = useRoute();
const fileStore = useFileStore();
const layoutStore = useLayoutStore();
const authStore = useAuthStore();
const yc = useYcStore();

const newOpen = ref(false);

const iconSizes = [
  { id: "small", label: "小" },
  { id: "medium", label: "中" },
  { id: "large", label: "大" },
] as const;

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

.yc-segment {
  display: flex;
  padding: 2px;
  gap: 2px;
  border: 1px solid var(--yc-border);
  border-radius: var(--yc-radius-sm);
  background: var(--yc-surface-2);
  flex: none;
}
.yc-segment__btn {
  width: 28px;
  height: 26px;
  display: grid;
  place-items: center;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--yc-muted);
  cursor: pointer;
}
.yc-segment__btn.is-active {
  background: var(--yc-surface);
  color: var(--yc-accent);
  box-shadow: var(--yc-shadow-sm);
}

.yc-size {
  display: flex;
  gap: 2px;
  padding: 2px;
  border: 1px solid var(--yc-border);
  border-radius: var(--yc-radius-sm);
  background: var(--yc-surface-2);
  flex: none;
}
.yc-size__btn {
  width: 26px;
  height: 26px;
  display: grid;
  place-items: center;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--yc-muted);
  font-family: inherit;
  font-size: 11.5px;
  cursor: pointer;
}
.yc-size__btn.is-active {
  background: var(--yc-surface);
  color: var(--yc-accent);
  font-weight: 600;
  box-shadow: var(--yc-shadow-sm);
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
    padding: 0 10px;
    gap: 6px;
  }
  .yc-commandbar__menu {
    display: grid;
  }
  .yc-commandbar__nav,
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
  .yc-crumbs__item {
    max-width: 120px;
  }
}

@media (max-width: 620px) {
  .yc-segment {
    display: flex;
  }
  .yc-size {
    display: none;
  }
  .yc-commandbar__upload,
  [title="刷新"] {
    display: none;
  }
  .yc-crumbs__item {
    max-width: 90px;
    padding: 5px 4px;
  }
  .yc-btn {
    padding: 0 10px;
  }
}
</style>
