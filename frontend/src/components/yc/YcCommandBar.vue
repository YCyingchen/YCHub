<template>
  <div class="yc-commandbar-wrap">
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

    <div class="yc-crumbs-box" :class="{ 'is-editing': editingPath }">
      <div
        v-if="!editingPath"
        class="yc-crumbs"
        role="navigation"
        aria-label="路径"
      >
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
      <input
        v-else
        ref="pathInput"
        v-model="pathDraft"
        class="yc-path-input"
        type="text"
        spellcheck="false"
        placeholder="输入路径后回车，例如 /vol1/1000"
        @keydown.enter.prevent="submitPath"
        @keydown.esc.prevent="cancelPath"
      />
      <button
        v-if="!editingPath"
        class="yc-path-edit"
        title="输入路径"
        @click.stop="startEditPath"
      >
        <YcIcon name="edit" :size="15" />
      </button>
      <button
        v-else
        class="yc-path-edit"
        title="取消"
        @mousedown.prevent
        @click="cancelPath"
      >
        <YcIcon name="x" :size="15" />
      </button>
    </div>

    <button class="yc-search" @click="openSearch">
      <YcIcon name="search" :size="16" />
      <span>搜索文件</span>
      <kbd>Ctrl K</kbd>
    </button>

    <div ref="viewRef" class="yc-view yc-top-collapsible">
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
      class="yc-iconbtn yc-details-toggle yc-top-collapsible"
      :class="{ 'is-active': yc.detailsOpen }"
      title="详情面板"
      @click="yc.toggleDetails()"
    >
      <YcIcon name="columns" :size="18" />
    </button>

    <template v-if="canCreate">
      <button class="yc-iconbtn yc-top-collapsible" title="刷新" @click="refresh">
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

    <div class="yc-toolbar">
      <button
        class="yc-toolbar__icon"
        :class="{ 'is-active': yc.viewMode === 'list' }"
        title="列表视图"
        @click="yc.setViewMode('list')"
      >
        <YcIcon name="list" :size="17" />
      </button>
      <button
        class="yc-toolbar__icon"
        :class="{ 'is-active': yc.viewMode === 'grid' }"
        title="图标视图"
        @click="yc.setViewMode('grid')"
      >
        <YcIcon name="grid" :size="16" />
      </button>
      <div class="yc-toolbar__sizes">
        <button
          v-for="size in iconSizes"
          :key="size.id"
          class="yc-toolbar__size"
          :class="{ 'is-active': yc.iconSize === size.id }"
          :title="`${size.label}图标`"
          @click="yc.setIconSize(size.id)"
        >
          {{ size.label }}
        </button>
      </div>
      <button
        class="yc-toolbar__icon"
        :class="{ 'is-active': yc.grouped }"
        title="分组显示"
        @click="yc.toggleGrouped()"
      >
        <YcIcon name="folder" :size="17" />
      </button>
      <span class="yc-toolbar__sep" />
      <button
        class="yc-toolbar__icon"
        :class="{ 'is-active': yc.detailsOpen }"
        title="详情面板"
        @click="yc.toggleDetails()"
      >
        <YcIcon name="columns" :size="17" />
      </button>
      <button class="yc-toolbar__icon" title="刷新" @click="refresh">
        <YcIcon name="refresh" :size="17" />
      </button>
      <span class="yc-toolbar__sep" />
      <button
        class="yc-toolbar__btn"
        :disabled="!canOpen"
        @click="openSelected"
      >
        <YcIcon name="arrow-right" :size="15" />
        打开
      </button>
      <button
        class="yc-toolbar__btn"
        :disabled="!canDownload"
        @click="showPrompt('download')"
      >
        <YcIcon name="download" :size="15" />
        下载
      </button>
      <button
        class="yc-toolbar__btn"
        :disabled="!canShare"
        @click="showPrompt('share')"
      >
        <YcIcon name="link" :size="15" />
        分享
      </button>
      <span class="yc-toolbar__sep" />
      <button
        class="yc-toolbar__btn"
        :disabled="!canRename"
        @click="showPrompt('rename')"
      >
        <YcIcon name="edit" :size="15" />
        重命名
      </button>
      <button
        class="yc-toolbar__btn"
        :disabled="!canCopy"
        @click="showPrompt('copy')"
      >
        <YcIcon name="file" :size="15" />
        复制到
      </button>
      <button
        class="yc-toolbar__btn"
        :disabled="!canMove"
        @click="showPrompt('move')"
      >
        <YcIcon name="transfer" :size="15" />
        移动到
      </button>
      <span class="yc-toolbar__sep" />
      <button
        class="yc-toolbar__btn"
        :disabled="!canDelete"
        @click="showPrompt('delete')"
      >
        <YcIcon name="trash" :size="15" />
        删除
      </button>
      <button class="yc-toolbar__btn" @click="showPrompt('info')">
        <YcIcon name="info" :size="15" />
        信息
      </button>
      <template v-if="canCreate">
        <span class="yc-toolbar__sep" />
        <button class="yc-toolbar__btn" @click="showPrompt('newDir')">
          <YcIcon name="folder-plus" :size="15" />
          新建文件夹
        </button>
        <button class="yc-toolbar__btn" @click="showPrompt('newFile')">
          <YcIcon name="file-plus" :size="15" />
          新建文件
        </button>
      </template>
      <span class="yc-toolbar__sep" />
      <button class="yc-toolbar__btn" @click="selectAll">
        <YcIcon name="check" :size="15" />
        全选
      </button>
      <span class="yc-toolbar__spacer" />
      <span v-if="selCount" class="yc-toolbar__count"
        >已选 {{ selCount }} 项</span
      >
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  computed,
  inject,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
} from "vue";
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

const selCount = computed(() => fileStore.selectedCount);
const selectedItem = computed(() => {
  const current = fileStore.req;
  if (!current || fileStore.selected.length !== 1) return null;
  return current.items[fileStore.selected[0]] ?? null;
});

const canOpen = computed(() => selectedItem.value !== null);
const canDownload = computed(
  () => authStore.user?.perm.download === true && selCount.value > 0
);
const canShare = computed(
  () =>
    authStore.user?.perm.share === true &&
    authStore.user?.perm.download === true &&
    selCount.value === 1
);
const canRename = computed(
  () => authStore.user?.perm.rename === true && selCount.value === 1
);
const canCopy = computed(
  () => authStore.user?.perm.create === true && selCount.value > 0
);
const canMove = computed(
  () => authStore.user?.perm.rename === true && selCount.value > 0
);
const canDelete = computed(
  () => authStore.user?.perm.delete === true && selCount.value > 0
);

const openSelected = () => {
  if (selectedItem.value) router.push(selectedItem.value.url);
};

const showPrompt = (name: string) => layoutStore.showHover(name);

const editingPath = ref(false);
const pathDraft = ref("");
const pathInput = ref<HTMLInputElement | null>(null);

const currentPath = computed(() => {
  const raw = route.path.replace(/^\/files\/?/, "").replace(/\/+$/, "");
  if (!raw) return "/";
  try {
    return "/" + decodeURIComponent(raw);
  } catch {
    return "/" + raw;
  }
});

const startEditPath = () => {
  pathDraft.value = currentPath.value;
  editingPath.value = true;
  nextTick(() => {
    pathInput.value?.focus();
    pathInput.value?.select();
  });
};

const cancelPath = () => {
  editingPath.value = false;
};

const submitPath = () => {
  let target = pathDraft.value.trim();
  if (!target) target = "/";
  if (target.startsWith("/files")) target = target.slice(5) || "/";
  if (!target.startsWith("/")) target = "/" + target;
  target = target.replace(/\/+$/, "");
  if (!target) target = "/";
  editingPath.value = false;
  router.push("/files" + (target === "/" ? "/" : target));
};

const selectAll = () => {
  const req = fileStore.req;
  if (req) fileStore.selected = req.items.map((item) => item.index);
};

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
.yc-commandbar-wrap {
  flex: none;
}

.yc-crumbs-box {
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
  height: 34px;
  padding: 0 6px;
  border: 1px solid var(--yc-border);
  border-radius: var(--yc-radius-sm);
  background: var(--yc-surface-2);
}

.yc-crumbs-box.is-editing {
  background: var(--yc-surface);
  border-color: var(--yc-accent);
}
.yc-path-input {
  flex: 1;
  min-width: 0;
  height: 100%;
  border: 0;
  background: transparent;
  color: var(--yc-text);
  font-family: inherit;
  font-size: 13px;
  outline: none;
}
.yc-path-input::placeholder {
  color: var(--yc-muted);
}
.yc-path-edit {
  width: 26px;
  height: 26px;
  display: grid;
  place-items: center;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--yc-muted);
  cursor: pointer;
  flex: none;
}
.yc-path-edit:hover {
  background: var(--yc-accent-soft);
  color: var(--yc-accent);
}

.yc-toolbar__icon {
  width: 30px;
  height: 30px;
  display: grid;
  place-items: center;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: var(--yc-text-2);
  cursor: pointer;
  flex: none;
}
.yc-toolbar__icon:hover {
  background: var(--yc-accent-soft);
  color: var(--yc-accent);
}
.yc-toolbar__icon.is-active {
  background: var(--yc-accent-soft);
  color: var(--yc-accent);
}
.yc-toolbar__sizes {
  display: flex;
  gap: 1px;
  padding: 2px;
  border: 1px solid var(--yc-border);
  border-radius: 8px;
  background: var(--yc-surface-2);
  flex: none;
}
.yc-toolbar__size {
  width: 26px;
  height: 25px;
  display: grid;
  place-items: center;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--yc-muted);
  font-family: inherit;
  font-size: 11px;
  cursor: pointer;
}
.yc-toolbar__size.is-active {
  background: var(--yc-surface);
  color: var(--yc-accent);
  font-weight: 600;
}
.yc-toolbar__btn.is-active {
  background: var(--yc-accent-soft);
  color: var(--yc-accent);
}

.yc-toolbar {
  display: flex;
  align-items: center;
  gap: 2px;
  height: 44px;
  padding: 0 16px;
  background: var(--yc-surface);
  border-bottom: 1px solid var(--yc-border);
}
.yc-toolbar__btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 30px;
  padding: 0 10px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: var(--yc-text-2);
  font-family: inherit;
  font-size: 12.5px;
  cursor: pointer;
  white-space: nowrap;
}
.yc-toolbar__btn:hover:not(:disabled) {
  background: var(--yc-accent-soft);
  color: var(--yc-accent);
}
.yc-toolbar__btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.yc-toolbar__sep {
  width: 1px;
  height: 18px;
  margin: 0 6px;
  background: var(--yc-border);
  flex: none;
}
.yc-toolbar__spacer {
  flex: 1;
}
.yc-toolbar__count {
  font-size: 11.5px;
  color: var(--yc-muted);
}

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
    justify-content: space-between;
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
  .yc-iconbtn.yc-view__trigger {
    width: auto;
    padding: 0 4px;
  }
  .yc-crumbs-box {
    order: 10;
    flex: 0 0 100%;
    width: 100%;
  }
  .yc-crumbs {
    width: 100%;
    overflow-x: auto;
    overflow-y: hidden;
    padding-bottom: 2px;
    scrollbar-width: none;
    -webkit-overflow-scrolling: touch;
  }
  .yc-toolbar {
    display: none;
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
@media (min-width: 1025px) {
  .yc-top-collapsible {
    display: none !important;
  }
}
</style>
