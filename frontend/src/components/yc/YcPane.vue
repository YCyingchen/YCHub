<template>
  <div
    ref="paneEl"
    class="yc-pane"
    :class="{ 'is-active': active }"
    @dragover.prevent="onDragOverZone($event)"
    @drop="onDropZone($event)"
    @pointerdown.capture="emit('activate')"
  >
    <div class="yc-pane__bar">
      <button
        class="yc-pane__up"
        :disabled="currentPath === '/'"
        title="上一级"
        @click="goUp"
      >
        <YcIcon name="arrow-left" :size="15" />
      </button>
      <span class="yc-pane__path" :title="currentPath">{{
        displayPath(currentPath)
      }}</span>
      <span class="yc-pane__count">{{ displayItems.length }}</span>
    </div>

    <div class="yc-pane__head">
      <span class="yc-pane__col-name">名称</span>
      <span class="yc-pane__col-size">大小</span>
      <span class="yc-pane__col-time">修改时间</span>
    </div>

    <div class="yc-pane__list" @pointerdown="onBandStart" @click.self="clearSelection">
      <p v-if="loading" class="yc-pane__hint">加载中…</p>
      <p v-else-if="displayItems.length === 0" class="yc-pane__hint">
        空文件夹
      </p>

      <div
        v-for="item in displayItems"
        :key="item.index"
        class="yc-pane__row"
        :class="{ 'is-selected': isSelected(item), 'is-dir': item.isDir }"
        :data-index="item.index"
        draggable="true"
        @dragstart="onDragStart(item, $event)"
        @dragend="cleanupGhost"
        @dragover.stop.prevent="onDragOverRow(item, $event)"
        @drop.stop="onDropItem(item, $event)"
        @click="onClick(item, $event)"
        @dblclick="openItem(item)"
        @contextmenu.prevent="onContext(item, $event)"
      >
        <span class="yc-pane__icon" :class="`is-${typeOf(item).kind}`">
          <YcIcon :name="typeOf(item).icon" :size="16" />
        </span>
        <span class="yc-pane__name">{{ item.name }}</span>
        <span class="yc-pane__size">{{
          item.isDir ? "—" : filesize(item.size)
        }}</span>
        <span class="yc-pane__time">{{ timeOf(item.modified) }}</span>
      </div>
    </div>

    <div v-if="band.visible" class="yc-band" :style="bandStyle" />
  </div>
</template>

<script setup lang="ts">
import { computed, inject, reactive, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { files as api } from "@/api";
import { filesize } from "@/utils";
import { displayPath, fileType } from "@/utils/yc";
import YcIcon from "@/components/yc/YcIcon.vue";
import dayjs from "dayjs";

const props = withDefaults(
  defineProps<{
    path: string;
    items?: ResourceItem[];
    selected?: number[];
    controlled?: boolean;
    externalNavigation?: boolean;
    active?: boolean;
  }>(),
  {
    items: undefined,
    selected: undefined,
    controlled: false,
    externalNavigation: false,
    active: false,
  }
);

const emit = defineEmits<{
  (e: "select", index: number, event: MouseEvent): void;
  (e: "open", item: ResourceItem): void;
  (e: "context", item: ResourceItem, event: MouseEvent): void;
  (e: "navigate", path: string): void;
  (e: "dropFiles"): void;
  (e: "activate"): void;
  (e: "selectMany", indexes: number[]): void;
}>();

const $showSuccess = inject<(message: string) => void>("$showSuccess")!;
const $showError = inject<(error: Error | string) => void>("$showError")!;

const router = useRouter();

const normalize = (path: string) => {
  let value = path || "/";
  value = value.replace(/^\/files(?=\/|$)/, "");
  if (!value.startsWith("/")) value = "/" + value;
  value = value.replace(/\/+$/, "");
  return value || "/";
};

const currentPath = ref(normalize(props.path));
const ownItems = ref<ResourceItem[]>([]);
const loading = ref(false);
const ownSelected = ref<number[]>([]);
const paneEl = ref<HTMLElement | null>(null);

const displayItems = computed(() =>
  props.controlled && props.items ? props.items : ownItems.value
);

const typeOf = (item: ResourceItem) => fileType(item);
const timeOf = (value: string) =>
  value ? dayjs(value).format("YYYY-MM-DD HH:mm") : "—";

const isSelected = (item: ResourceItem) => {
  const list = props.controlled ? props.selected ?? [] : ownSelected.value;
  return list.includes(item.index);
};

const clearSelection = () => {
  if (ignoreClick) {
    ignoreClick = false;
    return;
  }
  if (props.controlled) {
    emit("select", -1, new MouseEvent("click"));
    return;
  }
  ownSelected.value = [];
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
let ignoreClick = false;
let bandAdditive = false;
let bandBase: number[] = [];

const bandStyle = computed(() => ({
  left: `${band.x}px`,
  top: `${band.y}px`,
  width: `${band.w}px`,
  height: `${band.h}px`,
}));

const selectionNow = () =>
  props.controlled ? props.selected ?? [] : ownSelected.value;

const applyBandSelection = (indexes: number[]) => {
  if (props.controlled) emit("selectMany", indexes);
  else ownSelected.value = indexes;
};

const onBandMove = (event: PointerEvent) => {
  const dx = event.clientX - band.startX;
  const dy = event.clientY - band.startY;

  if (!bandMoved && Math.hypot(dx, dy) < 4) return;
  bandMoved = true;
  band.visible = true;
  band.x = Math.min(event.clientX, band.startX);
  band.y = Math.min(event.clientY, band.startY);
  band.w = Math.abs(dx);
  band.h = Math.abs(dy);

  const hits: number[] = [];
  paneEl.value
    ?.querySelectorAll<HTMLElement>(".yc-pane__row[data-index]")
    .forEach((element) => {
      const rect = element.getBoundingClientRect();
      const intersects =
        rect.right > band.x &&
        rect.left < band.x + band.w &&
        rect.bottom > band.y &&
        rect.top < band.y + band.h;
      if (!intersects) return;
      const index = Number(element.dataset.index);
      if (!Number.isNaN(index)) hits.push(index);
    });

  if (bandAdditive) {
    const merged = [...bandBase];
    for (const index of hits) {
      if (!merged.includes(index)) merged.push(index);
    }
    applyBandSelection(merged);
  } else {
    applyBandSelection(hits);
  }
};

const onBandUp = () => {
  window.removeEventListener("pointermove", onBandMove);
  band.visible = false;
  if (bandMoved) ignoreClick = true;
};

const onBandStart = (event: PointerEvent) => {
  if (event.button !== 0 || window.innerWidth <= 900) return;

  const target = event.target as HTMLElement | null;
  if (
    target?.closest(
      ".yc-pane__row, .yc-pane__bar, .yc-pane__head, button, a, input"
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
  bandAdditive = event.ctrlKey || event.metaKey || event.shiftKey;
  bandBase = bandAdditive ? [...selectionNow()] : [];

  window.addEventListener("pointermove", onBandMove);
  window.addEventListener("pointerup", onBandUp, { once: true });
};

const load = async () => {
  if (props.controlled) return;
  loading.value = true;
  try {
    const path = currentPath.value;
    const res = await api.fetch(
      "/files" + (path === "/" ? "/" : path + "/")
    );
    const all = res.items ?? [];
    ownItems.value = [
      ...all.filter((item) => item.isDir),
      ...all.filter((item) => !item.isDir),
    ];
  } catch {
    ownItems.value = [];
  } finally {
    loading.value = false;
  }
};

watch(
  () => props.path,
  (value) => {
    currentPath.value = normalize(value);
    ownSelected.value = [];
    load();
  }
);

watch(currentPath, () => {
  if (!props.controlled) load();
});

if (!props.controlled) load();

const rangeSelect = (anchorIndex: number, index: number) => {
  const list = displayItems.value;
  const from = list.findIndex((item) => item.index === anchorIndex);
  const to = list.findIndex((item) => item.index === index);
  if (from < 0 || to < 0) return [index];
  const start = Math.min(from, to);
  const end = Math.max(from, to);
  return list.slice(start, end + 1).map((item) => item.index);
};

const onClick = (item: ResourceItem, event: MouseEvent) => {
  if (props.controlled) {
    emit("select", item.index, event);
    return;
  }
  if (event.ctrlKey || event.metaKey) {
    const index = ownSelected.value.indexOf(item.index);
    if (index === -1) ownSelected.value.push(item.index);
    else ownSelected.value.splice(index, 1);
    return;
  }
  if (event.shiftKey && ownSelected.value.length > 0) {
    ownSelected.value = rangeSelect(ownSelected.value[0], item.index);
    return;
  }
  ownSelected.value = [item.index];
};

const onContext = (item: ResourceItem, event: MouseEvent) => {
  if (!props.controlled) ownSelected.value = [item.index];
  emit("context", item, event);
};

const openItem = (item: ResourceItem) => {
  if (item.isDir) {
    const target = normalize(item.path);
    if (props.externalNavigation) emit("navigate", target);
    else currentPath.value = target;
    return;
  }
  emit("open", item);
  router.push(item.url);
};

const goUp = () => {
  if (currentPath.value === "/") return;
  const parts = currentPath.value.split("/").filter(Boolean);
  parts.pop();
  const target = "/" + parts.join("/");
  if (props.externalNavigation) emit("navigate", target || "/");
  else currentPath.value = target || "/";
};

let ghostEl: HTMLElement | null = null;

const targetLabel = (path: string) => {
  const clean = normalize(path);
  if (clean === "/") return "根目录";
  const parts = clean.split("/").filter(Boolean);
  return parts[parts.length - 1] || "根目录";
};

const cleanupGhost = () => {
  document.querySelectorAll(".yc-drag-ghost").forEach((el) => el.remove());
  ghostEl = null;
};

const buildGhost = (files: ResourceItem[], event: DragEvent) => {
  cleanupGhost();

  const row = event.currentTarget as HTMLElement | null;
  const wrap = document.createElement("div");
  wrap.className = "yc-drag-ghost";
  wrap.dataset.count = String(files.length);
  wrap.style.cssText =
    "position:fixed;top:-1000px;left:-1000px;display:flex;align-items:center;" +
    "gap:10px;padding:8px 12px;background:#fff;border:1px solid #e6e8ec;" +
    "border-radius:10px;box-shadow:0 8px 24px rgba(16,24,40,.18);" +
    "font-family:inherit;z-index:99999;pointer-events:none;max-width:280px;";

  const icon = row?.querySelector(".yc-pane__icon")?.cloneNode(true) as
    | HTMLElement
    | null;
  if (icon) {
    icon.style.width = "34px";
    icon.style.height = "34px";
    icon.style.borderRadius = "9px";
    icon.style.flex = "none";
    wrap.appendChild(icon);
  }

  const text = document.createElement("div");
  text.style.cssText =
    "display:flex;flex-direction:column;gap:2px;min-width:0;";

  const name = document.createElement("span");
  name.textContent =
    files.length > 1
      ? `${files[0].name} 等 ${files.length} 项`
      : files[0].name;
  name.style.cssText =
    "font-size:12.5px;color:#16181D;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;";

  const sub = document.createElement("span");
  sub.dataset.role = "sub";
  const kind = files.every((file) => file.isDir) ? "文件夹" : "文件";
  sub.textContent = `${event.shiftKey ? "移动" : "复制"} ${files.length} 个${kind}`;
  sub.style.cssText = "font-size:10.5px;color:#8A9099;white-space:nowrap;";

  text.append(name, sub);
  wrap.appendChild(text);
  document.body.appendChild(wrap);
  ghostEl = wrap;
  return wrap;
};

const updateGhost = (targetPath: string, move: boolean) => {
  const ghost = document.querySelector(".yc-drag-ghost") as HTMLElement | null;
  if (!ghost) return;
  const sub = ghost.querySelector('[data-role="sub"]') as HTMLElement | null;
  if (sub) {
    const count = Number(ghost.dataset.count ?? "1");
    sub.textContent = `${move ? "移动" : "复制"} ${count} 项到 ${targetLabel(
      targetPath
    )}`;
  }
};

const onDragOverRow = (item: ResourceItem, event: DragEvent) => {
  const ghost = document.querySelector(".yc-drag-ghost") as HTMLElement | null;
  if (!ghost) return;
  const target = item.isDir ? item.path : currentPath.value;
  updateGhost(target, event.shiftKey);
  if (event.dataTransfer) {
    event.dataTransfer.setDragImage(ghost, 18, 18);
  }
};

const onDragOverZone = (event: DragEvent) => {
  const ghost = document.querySelector(".yc-drag-ghost") as HTMLElement | null;
  if (!ghost) return;
  updateGhost(currentPath.value, event.shiftKey);
  if (event.dataTransfer) {
    event.dataTransfer.setDragImage(ghost, 18, 18);
  }
};

const activeSelection = () =>
  props.controlled ? props.selected ?? [] : ownSelected.value;

const onDragStart = (item: ResourceItem, event: DragEvent) => {
  if (!event.dataTransfer) return;

  const selected = activeSelection();
  const files =
    selected.includes(item.index) && selected.length > 1
      ? displayItems.value.filter((row) => selected.includes(row.index))
      : [item];

  event.dataTransfer.setData(
    "application/x-yc-file",
    JSON.stringify(
      files.map((file) => ({
        name: file.name,
        isDir: file.isDir,
        url: file.url,
        path: file.path,
        size: file.size,
        modified: file.modified,
      }))
    )
  );
  event.dataTransfer.effectAllowed = "copyMove";

  const ghost = buildGhost(files, event);
  event.dataTransfer.setDragImage(ghost, 18, 18);
};

interface DragFile {
  name: string;
  isDir: boolean;
  url: string;
  path: string;
  size: number;
  modified: string;
}

const handleDrop = async (event: DragEvent, targetPath: string) => {
  const raw = event.dataTransfer?.getData("application/x-yc-file");
  if (!raw) return;
  event.preventDefault();

  let parsed: DragFile[] | DragFile;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return;
  }

  const files = (Array.isArray(parsed) ? parsed : [parsed]).filter(
    (file) => file && file.name && file.path && file.url
  );
  if (files.length === 0) return;

  const target = normalize(targetPath);
  const movable = files.filter((file) => {
    const source = normalize(file.path);
    if (target === source) return false;
    if (target.startsWith(source + "/")) return false;
    return true;
  });
  if (movable.length === 0) {
    cleanupGhost();
    return;
  }

  const move = event.shiftKey;
  const action = move ? api.move : api.copy;
  const keepPath = currentPath.value;

  try {
    await action(
      movable.map((file) => ({
        from: file.url,
        to:
          "/files" +
          (target === "/" ? "" : target) +
          "/" +
          encodeURIComponent(file.name),
        name: file.name,
        size: file.size ?? 0,
        isDir: file.isDir,
        modified: file.modified ?? "",
        overwrite: false,
        rename: false,
      })),
      false,
      false
    );
    $showSuccess(
      `${move ? "已移动" : "已复制"} ${movable.length} 项到 ${targetLabel(
        target
      )}`
    );
    currentPath.value = keepPath;
    if (!props.controlled) await load();
    emit("dropFiles");
  } catch (error) {
    if (error instanceof Error) $showError(error);
  } finally {
    cleanupGhost();
  }
};

const onDropItem = (item: ResourceItem, event: DragEvent) => {
  if (item.isDir) {
    handleDrop(event, item.path);
    return;
  }
  handleDrop(event, currentPath.value);
};

const onDropZone = (event: DragEvent) => {
  handleDrop(event, currentPath.value);
};
</script>

<style scoped>
.yc-pane {
  position: relative;
  display: flex;
  flex-direction: column;
  min-width: 0;
  height: 100%;
  background: var(--yc-surface);
}
.yc-pane.is-active::after {
  content: "";
  position: absolute;
  inset: 0;
  border: 2px solid var(--yc-accent);
  border-radius: 2px;
  pointer-events: none;
  z-index: 20;
}
.yc-pane__bar {
  flex: none;
  display: flex;
  align-items: center;
  gap: 6px;
  height: 36px;
  padding: 0 8px;
  border-bottom: 1px solid var(--yc-border);
  background: var(--yc-surface-2);
}
.yc-pane__up {
  width: 24px;
  height: 24px;
  display: grid;
  place-items: center;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--yc-muted);
  cursor: pointer;
}
.yc-pane__up:hover:not(:disabled) {
  background: var(--yc-surface);
  color: var(--yc-text);
}
.yc-pane__up:disabled {
  opacity: 0.35;
  cursor: default;
}
.yc-pane__path {
  flex: 1;
  min-width: 0;
  font-size: 11.5px;
  color: var(--yc-text-2);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.yc-pane__count {
  font-size: 10.5px;
  color: var(--yc-muted);
}

.yc-pane__head {
  flex: none;
  display: flex;
  align-items: center;
  height: 28px;
  padding: 0 8px;
  border-bottom: 1px solid var(--yc-border);
  color: var(--yc-muted);
  font-size: 10.5px;
}
.yc-pane__col-name {
  flex: 1;
  padding-left: 24px;
}
.yc-pane__col-size {
  width: 72px;
  flex: none;
}
.yc-pane__col-time {
  width: 92px;
  flex: none;
}

.yc-pane__list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 2px 4px;
}
.yc-pane__hint {
  margin: 20px 10px;
  text-align: center;
  font-size: 12px;
  color: var(--yc-muted);
}
.yc-band {
  position: fixed;
  z-index: 900;
  border: 1px solid var(--yc-accent);
  background: rgba(79, 107, 255, 0.12);
  border-radius: 2px;
  pointer-events: none;
}
.yc-pane__row {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 38px;
  padding: 0 6px;
  border-radius: 7px;
  color: var(--yc-text-2);
  font-size: 12.5px;
  cursor: default;
  user-select: none;
  -webkit-user-drag: element;
}
.yc-pane__row:hover {
  background: var(--yc-surface-2);
}
.yc-pane__row.is-selected {
  background: var(--yc-accent-soft);
  color: var(--yc-accent);
}
.yc-pane__icon {
  width: 26px;
  height: 26px;
  border-radius: 7px;
  display: grid;
  place-items: center;
  flex: none;
  background: var(--yc-type-doc);
  color: var(--yc-type-doc-fg);
}
.yc-pane__icon.is-folder {
  background: var(--yc-type-folder);
  color: var(--yc-type-folder-fg);
}
.yc-pane__icon.is-image {
  background: var(--yc-type-image);
  color: var(--yc-type-image-fg);
}
.yc-pane__icon.is-video {
  background: var(--yc-type-video);
  color: var(--yc-type-video-fg);
}
.yc-pane__icon.is-audio {
  background: var(--yc-type-audio);
  color: var(--yc-type-audio-fg);
}
.yc-pane__icon.is-zip {
  background: var(--yc-type-zip);
  color: var(--yc-type-zip-fg);
}
.yc-pane__name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.yc-pane__size {
  width: 72px;
  flex: none;
  font-size: 10.5px;
  color: var(--yc-muted);
}
.yc-pane__time {
  width: 92px;
  flex: none;
  font-size: 10.5px;
  color: var(--yc-muted);
  white-space: nowrap;
}

@media (max-width: 900px) {
  .yc-pane__head {
    display: none;
  }
  .yc-pane__size,
  .yc-pane__time {
    display: none;
  }
  .yc-pane__bar {
    padding: 0 4px;
    gap: 4px;
  }
  .yc-pane__path {
    font-size: 10.5px;
  }
  .yc-pane__count {
    font-size: 9.5px;
  }
  .yc-pane__row {
    height: 44px;
    gap: 6px;
    padding: 0 4px;
  }
  .yc-pane__icon {
    width: 24px;
    height: 24px;
    border-radius: 6px;
  }
  .yc-pane__name {
    font-size: 11.5px;
  }
}
</style>
