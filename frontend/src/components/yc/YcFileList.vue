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

    <div
      v-for="item in items"
      :key="item.index"
      class="yc-row"
      :class="{
        'is-selected': selected.includes(item.index),
        'is-dir': item.isDir,
      }"
      role="row"
      tabindex="0"
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
  </div>
</template>

<script setup lang="ts">
import { filesize } from "@/utils";
import dayjs from "dayjs";
import { fileType } from "@/utils/yc";
import { useFileStore } from "@/stores/file";
import YcIcon from "@/components/yc/YcIcon.vue";

const props = defineProps<{
  items: ResourceItem[];
  selected: number[];
  sorting: Sorting;
}>();

const emit = defineEmits<{
  (e: "open", item: ResourceItem): void;
  (e: "select", index: number, event: MouseEvent): void;
  (e: "context", item: ResourceItem, event: MouseEvent): void;
  (e: "sort", by: string): void;
}>();

const fileStore = useFileStore();

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

.yc-row {
  display: flex;
  align-items: center;
  height: 52px;
  padding: 0 8px 0 8px;
  border-bottom: 1px solid var(--yc-border);
  border-radius: 0;
  cursor: default;
  position: relative;
  transition: background 0.12s ease;
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
