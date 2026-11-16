<template>
  <div class="yc-grid" role="grid">
    <div
      v-for="item in items"
      :key="item.index"
      class="yc-card"
      :class="{ 'is-selected': selected.includes(item.index) }"
      role="gridcell"
      tabindex="0"
      @click="onClick(item, $event)"
      @dblclick="$emit('open', item)"
      @keydown.enter="$emit('open', item)"
      @contextmenu.prevent="onContext(item, $event)"
    >
      <span class="yc-card__icon" :class="`is-${typeOf(item).kind}`">
        <img
          v-if="thumbOf(item)"
          :src="thumbOf(item) || ''"
          :alt="item.name"
          loading="lazy"
          @error="($event.target as HTMLImageElement).style.display = 'none'"
        />
        <YcIcon v-else :name="typeOf(item).icon" :size="26" />
      </span>
      <span class="yc-card__name">{{ item.name }}</span>
      <span class="yc-card__meta">
        {{ item.isDir ? "文件夹" : sizeOf(item.size) }}
      </span>
      <button
        class="yc-card__more"
        title="更多"
        @click.stop="$emit('context', item, $event)"
      >
        <YcIcon name="more" :size="15" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { filesize } from "@/utils";
import { enableThumbs } from "@/utils/constants";
import { files as api } from "@/api";
import { fileType } from "@/utils/yc";
import { useFileStore } from "@/stores/file";
import YcIcon from "@/components/yc/YcIcon.vue";

const props = defineProps<{
  items: ResourceItem[];
  selected: number[];
}>();

const emit = defineEmits<{
  (e: "open", item: ResourceItem): void;
  (e: "select", index: number, event: MouseEvent): void;
  (e: "context", item: ResourceItem, event: MouseEvent): void;
}>();

const fileStore = useFileStore();

const typeOf = (item: ResourceItem) => fileType(item);
const sizeOf = (size: number) => filesize(size);

const thumbOf = (item: ResourceItem) => {
  if (!enableThumbs || item.isDir) return null;
  const type = typeOf(item);
  if (type.kind !== "image" && type.kind !== "video") return null;
  return api.getPreviewURL(item, "thumb");
};

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
.yc-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(154px, 1fr));
  gap: 10px;
  padding: 14px;
}

.yc-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  padding: 12px;
  border: 1px solid var(--yc-border);
  border-radius: var(--yc-radius);
  background: var(--yc-surface);
  cursor: default;
  transition: border-color 0.15s ease, box-shadow 0.15s ease,
    background 0.15s ease;
}
.yc-card:hover {
  border-color: var(--yc-border-strong);
  box-shadow: var(--yc-shadow-sm);
}
.yc-card.is-selected {
  border-color: var(--yc-accent);
  background: var(--yc-accent-soft);
}

.yc-card__icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  overflow: hidden;
  background: var(--yc-type-doc);
  color: var(--yc-type-doc-fg);
  margin-bottom: 2px;
}
.yc-card__icon img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.yc-card__icon.is-folder {
  background: var(--yc-type-folder);
  color: var(--yc-type-folder-fg);
}
.yc-card__icon.is-image {
  background: var(--yc-type-image);
  color: var(--yc-type-image-fg);
}
.yc-card__icon.is-video {
  background: var(--yc-type-video);
  color: var(--yc-type-video-fg);
}
.yc-card__icon.is-audio {
  background: var(--yc-type-audio);
  color: var(--yc-type-audio-fg);
}
.yc-card__icon.is-zip {
  background: var(--yc-type-zip);
  color: var(--yc-type-zip-fg);
}

.yc-card__name {
  font-size: 12.5px;
  color: var(--yc-text);
  width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.yc-card__meta {
  font-size: 11px;
  color: var(--yc-muted);
}
.yc-card__more {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 26px;
  height: 26px;
  display: grid;
  place-items: center;
  border: 0;
  border-radius: 7px;
  background: var(--yc-surface);
  color: var(--yc-muted);
  cursor: pointer;
  opacity: 0;
}
.yc-card:hover .yc-card__more,
.yc-card.is-selected .yc-card__more {
  opacity: 1;
}
.yc-card__more:hover {
  color: var(--yc-text);
}
</style>
