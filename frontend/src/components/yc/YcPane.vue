<template>
  <div
    class="yc-pane"
    @dragover.prevent
    @drop="onDropZone($event)"
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

    <div class="yc-pane__list" @click.self="clearSelection">
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
        @dragover.prevent
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
  </div>
</template>

<script setup lang="ts">
import { computed, inject, ref, watch } from "vue";
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
  }>(),
  {
    items: undefined,
    selected: undefined,
    controlled: false,
    externalNavigation: false,
  }
);

const emit = defineEmits<{
  (e: "select", index: number, event: MouseEvent): void;
  (e: "open", item: ResourceItem): void;
  (e: "context", item: ResourceItem, event: MouseEvent): void;
  (e: "navigate", path: string): void;
  (e: "dropFiles"): void;
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
  if (props.controlled) {
    emit("select", -1, new MouseEvent("click"));
    return;
  }
  ownSelected.value = [];
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

const onDragStart = (item: ResourceItem, event: DragEvent) => {
  if (!event.dataTransfer) return;
  event.dataTransfer.setData(
    "application/x-yc-file",
    JSON.stringify({
      name: item.name,
      isDir: item.isDir,
      url: item.url,
      path: item.path,
      size: item.size,
      modified: item.modified,
    })
  );
  event.dataTransfer.effectAllowed = "copyMove";
};

const handleDrop = async (event: DragEvent, targetPath: string) => {
  const raw = event.dataTransfer?.getData("application/x-yc-file");
  if (!raw) return;
  event.preventDefault();

  let data: {
    name: string;
    isDir: boolean;
    url: string;
    path: string;
    size: number;
    modified: string;
  };
  try {
    data = JSON.parse(raw);
  } catch {
    return;
  }

  const target = normalize(targetPath);
  if (!data.path || !data.name) return;
  if (target === normalize(data.path)) return;
  if (target.startsWith(normalize(data.path) + "/")) return;

  const destination =
    "/files" +
    (target === "/" ? "" : target) +
    "/" +
    encodeURIComponent(data.name);
  const move = event.shiftKey;
  const action = move ? api.move : api.copy;

  try {
    await action(
      [
        {
          from: data.url,
          to: destination,
          name: data.name,
          size: data.size ?? 0,
          isDir: data.isDir,
          modified: data.modified ?? "",
          overwrite: false,
          rename: false,
        },
      ],
      false,
      false
    );
    $showSuccess(move ? "已移动到当前目录" : "已复制到当前目录");
    emit("dropFiles");
    if (!props.controlled) await load();
  } catch (error) {
    if (error instanceof Error) $showError(error);
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
  display: flex;
  flex-direction: column;
  min-width: 0;
  height: 100%;
  background: var(--yc-surface);
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
</style>
