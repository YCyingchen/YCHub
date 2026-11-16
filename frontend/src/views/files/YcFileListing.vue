<template>
  <div class="yc-files">
    <YcCommandBar />

    <div class="yc-files__body">
      <section
        class="yc-files__listing"
        @click="onListingClick"
        @contextmenu.prevent="onListingContext"
        @pointerdown="onPointerDown"
      >
        <div v-if="layoutStore.loading" class="yc-state">
          <span class="yc-spinner" />
          <p>正在加载…</p>
          <small>大文件夹第一次打开会慢一点，之后就快了</small>
        </div>

        <div v-else-if="empty" class="yc-state">
          <span class="yc-state__icon">
            <YcIcon name="folder" :size="34" />
          </span>
          <p>这个文件夹是空的</p>
          <small>上传文件或新建文件夹，开始整理这里</small>
          <button
            v-if="canCreate"
            class="yc-btn yc-btn--primary yc-state__btn"
            @click="prompt('upload')"
          >
            <YcIcon name="upload" :size="15" />
            上传文件
          </button>
        </div>

        <div v-else-if="filterEmpty" class="yc-state">
          <span class="yc-state__icon">
            <YcIcon name="filter" :size="34" />
          </span>
          <p>没有匹配的项目</p>
          <small>换个筛选类型，或显示全部项目</small>
          <button
            class="yc-btn yc-btn--primary yc-state__btn"
            @click="yc.setFilterKind('all')"
          >
            <YcIcon name="x" :size="15" />
            清除筛选
          </button>
        </div>

        <template v-else>
          <YcFileList
            v-if="yc.viewMode === 'list'"
            :items="items"
            :selected="fileStore.selected"
            :sorting="sorting"
            :grouped="yc.grouped"
            @open="open"
            @context="openMenu"
            @sort="sort"
            @reorder="onReorder"
          />
          <YcFileGrid
            v-else-if="yc.viewMode === 'grid'"
            :items="items"
            :selected="fileStore.selected"
            :grouped="yc.grouped"
            @open="open"
            @context="openMenu"
            @reorder="onReorder"
          />
          <div v-else-if="yc.viewMode === 'dual'" class="yc-dual">
            <div class="yc-dual__pane">
              <YcFileList
                :items="items"
                :selected="fileStore.selected"
                :sorting="sorting"
                :grouped="yc.grouped"
                @open="open"
                @context="openMenu"
                @sort="sort"
                @reorder="onReorder"
              />
            </div>
            <div class="yc-dual__pane">
              <YcPane path="/" />
            </div>
          </div>
          <div v-else class="yc-columns">
            <YcPane v-for="path in columnPaths" :key="path" :path="path" />
          </div>
        </template>

        <div v-if="band.visible" class="yc-band" :style="bandStyle" />
      </section>

      <YcDetails v-if="yc.detailsOpen" />
    </div>

    <YcStatusBar />

    <Teleport to="body">
      <div v-if="menu.open" class="yc-menu__mask" @click="closeMenu" />
      <div
        v-if="menu.open"
        class="yc-menu"
        :style="{ left: menu.x + 'px', top: menu.y + 'px' }"
        @contextmenu.prevent
      >
        <template v-if="menu.item">
          <button class="yc-menu__item" @click="action('open')">
            <span>打开</span><kbd>Enter</kbd>
          </button>
          <button class="yc-menu__item" @click="action('preview')">
            <span>快速预览</span><kbd>Space</kbd>
          </button>
          <button
            v-if="canDownload"
            class="yc-menu__item"
            @click="action('download')"
          >
            <span>下载</span><kbd>Ctrl+S</kbd>
          </button>
          <div class="yc-menu__sep" />
          <button
            v-if="canRename"
            class="yc-menu__item"
            @click="action('rename')"
          >
            <span>重命名</span><kbd>F2</kbd>
          </button>
          <template v-if="canMove">
            <button class="yc-menu__item" @click="action('copy')">
              <span>复制到…</span><kbd>Ctrl+C</kbd>
            </button>
            <button class="yc-menu__item" @click="action('move')">
              <span>移动到…</span><kbd>Ctrl+X</kbd>
            </button>
          </template>
          <div class="yc-menu__sep" />
          <button
            v-if="canShare"
            class="yc-menu__item"
            @click="action('share')"
          >
            <span>分享链接</span>
          </button>
          <button class="yc-menu__item" @click="action('info')">
            <span>详细信息</span>
          </button>
          <div v-if="canDelete" class="yc-menu__sep" />
          <button
            v-if="canDelete"
            class="yc-menu__item is-danger"
            @click="action('delete')"
          >
            <span>删除</span><kbd>Del</kbd>
          </button>
        </template>

        <template v-else>
          <button
            v-if="canCreate"
            class="yc-menu__item"
            @click="action('newDir')"
          >
            <span>新建文件夹</span>
          </button>
          <button
            v-if="canCreate"
            class="yc-menu__item"
            @click="action('newFile')"
          >
            <span>新建文件</span>
          </button>
          <button
            v-if="canCreate"
            class="yc-menu__item"
            @click="action('upload')"
          >
            <span>上传文件</span>
          </button>
          <div class="yc-menu__sep" />
          <button class="yc-menu__item" @click="action('selectAll')">
            <span>全选</span><kbd>Ctrl+A</kbd>
          </button>
          <button class="yc-menu__item" @click="action('refresh')">
            <span>刷新</span>
          </button>
        </template>
      </div>
    </Teleport>

    <YcSearch
      v-if="layoutStore.currentPromptName === 'search'"
      @close="layoutStore.closeHovers()"
    />
  </div>
</template>

<script setup lang="ts">
import {
  computed,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref,
  watch,
} from "vue";
import { useRoute, useRouter } from "vue-router";
import { storeToRefs } from "pinia";
import { useFileStore } from "@/stores/file";
import { useLayoutStore } from "@/stores/layout";
import { useAuthStore } from "@/stores/auth";
import { useYcStore } from "@/stores/yc";
import { files as api, users } from "@/api";
import YcCommandBar from "@/components/yc/YcCommandBar.vue";
import YcFileList from "@/components/yc/YcFileList.vue";
import YcFileGrid from "@/components/yc/YcFileGrid.vue";
import YcDetails from "@/components/yc/YcDetails.vue";
import YcSearch from "@/components/yc/YcSearch.vue";
import YcPane from "@/components/yc/YcPane.vue";
import YcStatusBar from "@/components/yc/YcStatusBar.vue";
import YcIcon from "@/components/yc/YcIcon.vue";
import { matchesFilter } from "@/utils/yc";

const route = useRoute();
const router = useRouter();
const fileStore = useFileStore();
const layoutStore = useLayoutStore();
const authStore = useAuthStore();
const yc = useYcStore();
const { req } = storeToRefs(fileStore);

const menu = reactive<{
  open: boolean;
  x: number;
  y: number;
  item: ResourceItem | null;
}>({ open: false, x: 0, y: 0, item: null });

const visibleItems = computed<ResourceItem[]>(() =>
  (req.value?.items ?? []).filter((item) =>
    matchesFilter(item, yc.filterKind)
  )
);

const orderedItems = computed<ResourceItem[]>(() => {
  const all = visibleItems.value;
  const order = yc.orders[route.path] ?? [];
  if (!order.length) return all;

  const byName = new Map(all.map((item) => [item.name, item]));
  const used = new Set<string>();
  const result: ResourceItem[] = [];

  for (const name of order) {
    const item = byName.get(name);
    if (item) {
      result.push(item);
      used.add(name);
    }
  }
  for (const item of all) {
    if (!used.has(item.name)) result.push(item);
  }
  return result;
});

const items = computed<ResourceItem[]>(() => {
  const all = orderedItems.value;
  const dirs = all.filter((i) => i.isDir);
  const files = all.filter((i) => !i.isDir);
  return [...dirs, ...files];
});

const onReorder = (fromName: string, toName: string) => {
  const from = items.value.find((item) => item.name === fromName);
  const to = items.value.find((item) => item.name === toName);
  if (!from || !to) return;
  if (yc.grouped && from.isDir !== to.isDir) return;

  const names = items.value.map((item) => item.name);
  const fromIndex = names.indexOf(fromName);
  const toIndex = names.indexOf(toName);
  if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return;

  const next = [...names];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  yc.setOrder(route.path, next);
};

const sorting = computed<Sorting>(
  () => req.value?.sorting ?? { by: "name", asc: true }
);
const empty = computed(
  () =>
    !layoutStore.loading &&
    (req.value?.numDirs ?? 0) + (req.value?.numFiles ?? 0) === 0
);
const filterEmpty = computed(
  () =>
    !layoutStore.loading &&
    (req.value?.numDirs ?? 0) + (req.value?.numFiles ?? 0) > 0 &&
    visibleItems.value.length === 0
);

const columnPaths = computed(() => {
  const segments = route.path
    .replace(/^\/files\/?/, "")
    .split("/")
    .filter(Boolean);
  const paths = ["/"];
  let current = "";
  for (const segment of segments) {
    current += "/" + segment;
    paths.push(current);
  }
  return paths;
});

const canCreate = computed(() => authStore.user?.perm?.create === true);
const canDownload = computed(() => authStore.user?.perm?.download === true);
const canRename = computed(() => authStore.user?.perm?.rename === true);
const canDelete = computed(() => authStore.user?.perm?.delete === true);
const canShare = computed(
  () =>
    authStore.user?.perm?.share === true &&
    authStore.user?.perm?.download === true &&
    fileStore.selectedCount === 1
);
const canMove = computed(() => canRename.value && fileStore.selectedCount > 0);

const clearSelection = () => {
  fileStore.selected = [];
};
const closeMenu = () => {
  menu.open = false;
  menu.item = null;
};

const openMenuAt = (event: MouseEvent, item: ResourceItem | null) => {
  const width = 208;
  const height = item ? 330 : 240;
  menu.x = Math.min(event.clientX, window.innerWidth - width - 8);
  menu.y = Math.min(event.clientY, window.innerHeight - height - 8);
  menu.item = item;
  menu.open = true;
};
const openMenu = (item: ResourceItem, event: MouseEvent) => {
  openMenuAt(event, item);
};
const openBlankMenu = (event: MouseEvent) => {
  fileStore.selected = [];
  openMenuAt(event, null);
};

const isItemTarget = (event: Event) => {
  const el = event.target as HTMLElement | null;
  return !!el?.closest(".yc-card, .yc-row");
};

const onListingClick = (event: MouseEvent) => {
  if (suppressClick) {
    suppressClick = false;
    return;
  }
  if (!isItemTarget(event)) clearSelection();
};

const onListingContext = (event: MouseEvent) => {
  if (isItemTarget(event)) return;
  openBlankMenu(event);
};

const band = reactive({
  visible: false,
  startX: 0,
  startY: 0,
  x: 0,
  y: 0,
  w: 0,
  h: 0,
});
let bandMoved = false;
let suppressClick = false;

const bandStyle = computed(() => ({
  left: `${band.x}px`,
  top: `${band.y}px`,
  width: `${band.w}px`,
  height: `${band.h}px`,
}));

const onPointerMove = (event: PointerEvent) => {
  const dx = event.clientX - band.startX;
  const dy = event.clientY - band.startY;

  if (!bandMoved && Math.hypot(dx, dy) < 4) return;
  bandMoved = true;
  band.visible = true;
  band.x = Math.min(event.clientX, band.startX);
  band.y = Math.min(event.clientY, band.startY);
  band.w = Math.abs(dx);
  band.h = Math.abs(dy);

  const selected: number[] = [];
  document
    .querySelectorAll<HTMLElement>(".yc-files__listing [data-index]")
    .forEach((element) => {
      const rect = element.getBoundingClientRect();
      const intersects =
        rect.right > band.x &&
        rect.left < band.x + band.w &&
        rect.bottom > band.y &&
        rect.top < band.y + band.h;
      if (!intersects) return;
      const index = Number(element.dataset.index);
      if (!Number.isNaN(index)) selected.push(index);
    });

  fileStore.selected = selected;
};

const onPointerUp = () => {
  window.removeEventListener("pointermove", onPointerMove);
  band.visible = false;
  if (bandMoved) suppressClick = true;
};

const onPointerDown = (event: PointerEvent) => {
  if (event.button !== 0 || window.innerWidth <= 900) return;

  const target = event.target as HTMLElement | null;
  if (
    target?.closest(
      ".yc-card, .yc-row, button, a, input, .yc-group__title, .yc-menu"
    )
  ) {
    return;
  }

  bandMoved = false;
  band.visible = false;
  band.startX = event.clientX;
  band.startY = event.clientY;
  band.x = event.clientX;
  band.y = event.clientY;
  band.w = 0;
  band.h = 0;

  window.addEventListener("pointermove", onPointerMove);
  window.addEventListener("pointerup", onPointerUp, { once: true });
};

const open = (item: ResourceItem) => {
  closeMenu();
  router.push(item.url);
};

const prompt = (name: string) => {
  closeMenu();
  layoutStore.showHover(name);
};

const action = (name: string) => {
  const item = menu.item;
  const selectedItem =
    item ??
    (fileStore.selected.length === 1 && req.value
      ? req.value.items[fileStore.selected[0]]
      : null);

  switch (name) {
    case "open":
      if (item) open(item);
      break;
    case "preview":
      if (item) router.push(item.url);
      closeMenu();
      break;
    case "download":
      if (selectedItem) api.download(null, selectedItem.url);
      closeMenu();
      break;
    case "rename":
      prompt("rename");
      break;
    case "copy":
      prompt("copy");
      break;
    case "move":
      prompt("move");
      break;
    case "share":
      prompt("share");
      break;
    case "info":
      prompt("info");
      break;
    case "delete":
      prompt("delete");
      break;
    case "newDir":
      prompt("newDir");
      break;
    case "newFile":
      prompt("newFile");
      break;
    case "upload":
      prompt("upload");
      break;
    case "selectAll":
      fileStore.selected = items.value.map((i) => i.index);
      closeMenu();
      break;
    case "refresh":
      fileStore.reload = true;
      closeMenu();
      break;
  }
};

const sort = async (by: string) => {
  const asc = !(sorting.value.by === by && sorting.value.asc);
  try {
    if (authStore.user?.id) {
      await users.update({ id: authStore.user.id, sorting: { by, asc } }, [
        "sorting",
      ]);
    }
  } catch {
    /* 排序偏好保存失败时仍然按本地排序刷新 */
  }
  fileStore.reload = true;
};

const onKeydown = (event: KeyboardEvent) => {
  const target = event.target as HTMLElement | null;
  const typing =
    target &&
    (target.tagName === "INPUT" ||
      target.tagName === "TEXTAREA" ||
      target.isContentEditable);
  if (typing || layoutStore.currentPrompt !== null) return;

  if (event.key === "Escape") {
    closeMenu();
    fileStore.selected = [];
    return;
  }
  if (event.key === "F2") {
    if (canRename.value && fileStore.selectedCount === 1) {
      event.preventDefault();
      layoutStore.showHover("rename");
    }
    return;
  }
  if (event.key === "Delete") {
    if (canDelete.value && fileStore.selectedCount > 0) {
      event.preventDefault();
      layoutStore.showHover("delete");
    }
    return;
  }
  if (event.key === " " && fileStore.selectedCount === 1 && req.value) {
    event.preventDefault();
    router.push(req.value.items[fileStore.selected[0]].url);
    return;
  }
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "a") {
    event.preventDefault();
    fileStore.selected = items.value.map((i) => i.index);
  }
};

const onGlobalClick = (event: MouseEvent) => {
  if (!menu.open) return;
  const el = event.target as HTMLElement;
  if (!el.closest(".yc-menu")) closeMenu();
};

onMounted(() => {
  document.body.classList.add("yc-files-mode");
  window.addEventListener("keydown", onKeydown);
  window.addEventListener("click", onGlobalClick, true);
  if (req.value) yc.pushRecent(route.path, req.value.name);
});

onBeforeUnmount(() => {
  document.body.classList.remove("yc-files-mode");
  window.removeEventListener("keydown", onKeydown);
  window.removeEventListener("click", onGlobalClick, true);
  window.removeEventListener("pointermove", onPointerMove);
});

watch(req, (value) => {
  closeMenu();
  if (value) yc.pushRecent(route.path, value.name);
});
watch(
  () => route.path,
  () => closeMenu()
);
</script>

<style scoped>
.yc-files {
  display: flex;
  flex-direction: column;
  height: 100vh;
  height: 100dvh;
  background: var(--yc-bg);
  overflow: hidden;
}

.yc-files__body {
  flex: 1;
  display: flex;
  min-height: 0;
}

.yc-files__listing {
  flex: 1;
  min-width: 0;
  overflow: auto;
  background: var(--yc-surface);
}

.yc-state {
  height: 100%;
  min-height: 320px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 40px 20px;
  text-align: center;
  color: var(--yc-text-2);
}
.yc-state p {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--yc-text);
}
.yc-state small {
  font-size: 12px;
  color: var(--yc-muted);
}
.yc-state__icon {
  width: 64px;
  height: 64px;
  border-radius: 18px;
  display: grid;
  place-items: center;
  background: var(--yc-type-folder);
  color: var(--yc-type-folder-fg);
  margin-bottom: 6px;
}
.yc-state__btn {
  margin-top: 10px;
}

.yc-spinner {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 2.5px solid var(--yc-border);
  border-top-color: var(--yc-accent);
  animation: yc-spin 0.9s linear infinite;
  margin-bottom: 4px;
}
@keyframes yc-spin {
  to {
    transform: rotate(360deg);
  }
}

.yc-menu__mask {
  position: fixed;
  inset: 0;
  z-index: 998;
}
.yc-menu {
  position: fixed;
  z-index: 999;
  min-width: 200px;
  padding: 6px;
  background: var(--yc-surface);
  border: 1px solid var(--yc-border);
  border-radius: var(--yc-radius);
  box-shadow: var(--yc-shadow-lg);
}
.yc-menu__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
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
.yc-menu__item:hover {
  background: var(--yc-accent-soft);
  color: var(--yc-accent);
}
.yc-menu__item.is-danger {
  color: var(--yc-danger);
}
.yc-menu__item.is-danger:hover {
  background: var(--yc-danger-soft);
  color: var(--yc-danger);
}
.yc-menu__item kbd {
  font-family: inherit;
  font-size: 11px;
  color: var(--yc-muted);
}
.yc-menu__sep {
  height: 1px;
  margin: 5px 6px;
  background: var(--yc-border);
}

.yc-band {
  position: fixed;
  z-index: 900;
  border: 1px solid var(--yc-accent);
  background: rgba(79, 107, 255, 0.12);
  border-radius: 2px;
  pointer-events: none;
}

.yc-dual {
  display: flex;
  height: 100%;
  min-height: 0;
}
.yc-dual__pane {
  flex: 1;
  min-width: 0;
  overflow: auto;
}
.yc-dual__pane + .yc-dual__pane {
  border-left: 1px solid var(--yc-border);
}

.yc-columns {
  display: flex;
  height: 100%;
  min-height: 0;
  overflow-x: auto;
}
.yc-columns :deep(.yc-pane) {
  width: 280px;
  flex: none;
  border-right: 1px solid var(--yc-border);
}

@media (max-width: 900px) {
  .yc-files__body {
    display: block;
  }
  .yc-files__listing {
    height: 100%;
  }
}
</style>
