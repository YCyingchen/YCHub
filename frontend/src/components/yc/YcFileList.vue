<template>
  <div class="yc-table" role="grid">
    <div class="yc-table__head" role="row">
      <button
        class="yc-table__cell yc-table__cell--name"
        role="columnheader"
        @click="$emit('sort', 'name')"
      >
        名称
        <YcIcon
          v-if="sorting.by === 'name'"
          :name="sorting.asc ? 'chevron-up' : 'chevron-down'"
          :size="13"
        />
      </button>
      <button
        class="yc-table__cell yc-table__cell--size"
        role="columnheader"
        @click="$emit('sort', 'size')"
      >
        大小
        <YcIcon
          v-if="sorting.by === 'size'"
          :name="sorting.asc ? 'chevron-up' : 'chevron-down'"
          :size="13"
        />
      </button>
      <button
        class="yc-table__cell yc-table__cell--time"
        role="columnheader"
        @click="$emit('sort', 'modified')"
      >
        修改时间
        <YcIcon
          v-if="sorting.by === 'modified'"
          :name="sorting.asc ? 'chevron-up' : 'chevron-down'"
          :size="13"
        />
      </button>
      <span class="yc-table__cell yc-table__cell--tag" role="columnheader"
        >类型</span
      >
    </div>

    <template v-for="group in groups" :key="group.key">
      <div v-if="group.label" class="yc-group__title">
        <YcIcon
          :name="group.key === 'dirs' ? 'folder' : 'file'"
          :size="14"
        />
        <span>{{ group.label }}</span>
        <span class="yc-group__count">{{ group.items.length }}</span>
      </div>

      <div
        v-for="item in group.items"
        :key="item.index"
        class="yc-row"
        :class="{
          'is-selected': selected.includes(item.index),
          'is-dir': item.isDir,
        }"
        :data-index="item.index"
        draggable="true"
        role="row"
        tabindex="0"
        @dragstart="onDragStart(item, $event)"
        @dragover.prevent
        @drop="onDrop(item, $event)"
        @click="onClick(item, $event)"
        @dblclick="$emit('open', item)"
        @keydown.enter="$emit('open', item)"
        @keydown.space.prevent="$emit('open', item)"
        @contextmenu.prevent="onContext(item, $event)"
      >
        <span class="yc-typeicon" :class="`is-${typeOf(item).kind}`">
          <YcIcon :name="typeOf(item).icon" :size="17" />
        </span>
        <span class="yc-row__name">
          <span class="yc-row__title">{{ item.name }}</span>
          <span class="yc-row__sub">{{ typeOf(item).label }}</span>
        </span>
        <span class="yc-table__cell yc-table__cell--size yc-row__meta">
          {{ item.isDir ? "—" : sizeOf(item.size) }}
        </span>
        <span class="yc-table__cell yc-table__cell--time yc-row__meta">
          {{ timeOf(item.modified) }}
        </span>
        <span class="yc-table__cell yc-table__cell--tag">
          <span class="yc-pill">{{ typeOf(item).label }}</span>
        </span>
        <button
          class="yc-row__more"
          title="更多"
          @click.stop="$emit('context', item, $event)"
        >
          <YcIcon name="more" :size="16" />
        </button>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { filesize } from "@/utils";
import dayjs from "dayjs";
import { fileType } from "@/utils/yc";
import { useFileStore } from "@/stores/file";
import YcIcon from "@/components/yc/YcIcon.vue";

const props = defineProps<{
  items: ResourceItem[];
  selected: number[];
  sorting: Sorting;
  grouped?: boolean;
}>();

const emit = defineEmits<{
  (e: "open", item: ResourceItem): void;
  (e: "select", index: number, event: MouseEvent): void;
  (e: "context", item: ResourceItem, event: MouseEvent): void;
  (e: "sort", by: string): void;
  (e: "reorder", fromName: string, toName: string): void;
}>();

const fileStore = useFileStore();

const groups = computed(() => {
  if (!props.grouped) {
    return [{ key: "all", label: "", items: props.items }];
  }

  const dirs = props.items.filter((item) => item.isDir);
  const files = props.items.filter((item) => !item.isDir);
  const result: { key: string; label: string; items: ResourceItem[] }[] = [];

  if (dirs.length) {
    result.push({ key: "dirs", label: "文件夹", items: dirs });
  }
  if (files.length) {
    result.push({ key: "files", label: "文件", items: files });
  }
  return result;
});

const typeOf = (item: ResourceItem) => fileType(item);
const sizeOf = (size: number) => filesize(size);
const timeOf = (value: string) =>
  value ? dayjs(value).format("YYYY-MM-DD HH:mm") : "—";

const onClick = (item: ResourceItem, event: MouseEvent) => {
  if (event.ctrlKey || event.metaKey) {
    if (fileStore.selected.includes(item.index)) {
      fileStore.removeSelected(item.index);
    } else {
      fileStore.selected.push(item.index);
    }
    return;
  }
  if (event.shiftKey && fileStore.selected.length > 0) {
    const anchor = fileStore.selected[0];
    const from = Math.min(anchor, item.index);
    const to = Math.max(anchor, item.index);
    const range: number[] = [];
    for (let i = from; i <= to; i++) range.push(i);
    fileStore.selected = range;
    return;
  }
  // 桌面端再次单击已选中的唯一项目时取消选择
  if (
    window.innerWidth > 900 &&
    fileStore.selected.length === 1 &&
    fileStore.selected[0] === item.index
  ) {
    fileStore.selected = [];
    return;
  }
  fileStore.selected = [item.index];
  emit("select", item.index, event);
  // 触屏 / 窄屏没有双击语义，单击直接进入
  if (window.innerWidth <= 900) emit("open", item);
};

const onContext = (item: ResourceItem, event: MouseEvent) => {
  if (!fileStore.selected.includes(item.index)) {
    fileStore.selected = [item.index];
  }
  emit("context", item, event);
};

const onDragStart = (item: ResourceItem, event: DragEvent) => {
  if (!event.dataTransfer) return;
  event.dataTransfer.setData("text/yc-reorder", item.name);
  event.dataTransfer.effectAllowed = "move";
  const row = event.currentTarget as HTMLElement | null;
  if (row) event.dataTransfer.setDragImage(row, 18, 18);
};

const onDrop = (item: ResourceItem, event: DragEvent) => {
  const from = event.dataTransfer?.getData("text/yc-reorder");
  if (from && from !== item.name) emit("reorder", from, item.name);
};
</script>

<style scoped>
.yc-table {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.yc-table__head {
  display: flex;
  align-items: center;
  height: 34px;
  padding: 0 12px 0 8px;
  border-bottom: 1px solid var(--yc-border);
  color: var(--yc-muted);
  font-size: 11.5px;
  position: sticky;
  top: 0;
  background: var(--yc-surface);
  z-index: 2;
}
.yc-table__cell {
  border: 0;
  background: transparent;
  color: inherit;
  font-family: inherit;
  font-size: inherit;
  text-align: left;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0;
  cursor: pointer;
}
.yc-table__cell--name {
  flex: 1;
  padding-left: 44px;
}
.yc-table__cell--size {
  width: 110px;
  flex: none;
}
.yc-table__cell--time {
  width: 150px;
  flex: none;
}
.yc-table__cell--tag {
  width: 84px;
  flex: none;
  cursor: default;
  padding-left: 12px;
}

.yc-group__title {
  display: flex;
  align-items: center;
  gap: 7px;
  height: 34px;
  padding: 0 12px;
  background: var(--yc-surface-2);
  border-bottom: 1px solid var(--yc-border);
  color: var(--yc-text-2);
  font-size: 11.5px;
  font-weight: 600;
  position: sticky;
  top: 34px;
  z-index: 1;
}
.yc-group__title :deep(.yc-icon) {
  color: var(--yc-muted);
}
.yc-group__count {
  font-weight: 400;
  color: var(--yc-muted);
}

.yc-row {
  display: flex;
  align-items: center;
  height: var(--yc-row-h, 52px);
  padding: 0 8px 0 8px;
  border-bottom: 1px solid var(--yc-border);
  border-radius: 0;
  cursor: default;
  position: relative;
  transition: background 0.12s ease;
  user-select: none;
  -webkit-user-drag: element;
}
.yc-row:last-child {
  border-bottom: 0;
}
.yc-row:hover {
  background: var(--yc-surface-2);
}
.yc-row.is-selected {
  background: var(--yc-accent-soft);
}
.yc-row:focus-visible {
  outline: 2px solid var(--yc-accent);
  outline-offset: -2px;
}

.yc-typeicon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: grid;
  place-items: center;
  margin-right: 12px;
  flex: none;
  background: var(--yc-type-doc);
  color: var(--yc-type-doc-fg);
}
.yc-typeicon.is-folder {
  background: var(--yc-type-folder);
  color: var(--yc-type-folder-fg);
}
.yc-typeicon.is-image {
  background: var(--yc-type-image);
  color: var(--yc-type-image-fg);
}
.yc-typeicon.is-video {
  background: var(--yc-type-video);
  color: var(--yc-type-video-fg);
}
.yc-typeicon.is-audio {
  background: var(--yc-type-audio);
  color: var(--yc-type-audio-fg);
}
.yc-typeicon.is-doc,
.yc-typeicon.is-pdf {
  background: var(--yc-type-doc);
  color: var(--yc-type-doc-fg);
}
.yc-typeicon.is-zip {
  background: var(--yc-type-zip);
  color: var(--yc-type-zip-fg);
}

.yc-row__name {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.yc-row__title {
  font-size: 13px;
  color: var(--yc-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.yc-row.is-dir .yc-row__title {
  font-weight: 500;
}
.yc-row__sub {
  display: none;
  font-size: 11px;
  color: var(--yc-muted);
}
.yc-row__meta {
  font-size: 12px;
  color: var(--yc-muted);
  white-space: nowrap;
}
.yc-pill {
  display: inline-block;
  font-size: 11px;
  padding: 2px 8px;
  border-radius: var(--yc-radius-pill);
  background: var(--yc-surface-2);
  color: var(--yc-muted);
  border: 1px solid var(--yc-border);
}
.yc-row.is-selected .yc-pill {
  background: var(--yc-surface);
  border-color: transparent;
  color: var(--yc-accent);
}

.yc-row__more {
  width: 28px;
  height: 28px;
  display: grid;
  place-items: center;
  border: 0;
  border-radius: 7px;
  background: transparent;
  color: var(--yc-muted);
  cursor: pointer;
  opacity: 0;
  flex: none;
}
.yc-row:hover .yc-row__more,
.yc-row.is-selected .yc-row__more {
  opacity: 1;
}
.yc-row__more:hover {
  background: var(--yc-surface);
  color: var(--yc-text);
}

@media (max-width: 900px) {
  .yc-table__cell--time,
  .yc-table__cell--tag {
    display: none;
  }
  .yc-row {
    height: 62px;
  }
  .yc-row__sub {
    display: block;
  }
  .yc-table__head {
    height: 30px;
  }
  .yc-row__more {
    opacity: 1;
  }
  .yc-table__cell--size {
    width: auto;
  }
}

@media (max-width: 480px) {
  .yc-table__cell--size {
    display: none;
  }
}
</style>
