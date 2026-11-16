<template>
  <div class="yc-grids" :class="`is-${yc.iconSize}`">
    <template v-for="group in groups" :key="group.key">
      <div v-if="group.label" class="yc-group__title">
        <YcIcon
          :name="group.key === 'dirs' ? 'folder' : 'file'"
          :size="14"
        />
        <span>{{ group.label }}</span>
        <span class="yc-group__count">{{ group.items.length }}</span>
      </div>

      <div class="yc-grid" role="grid">
        <div
          v-for="item in group.items"
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
          <span
            class="yc-card__icon"
            :class="[
              `is-${typeOf(item).kind}`,
              { 'has-thumb': !!thumbOf(item) },
            ]"
          >
            <img
              v-if="thumbOf(item)"
              :src="thumbOf(item) || ''"
              :alt="item.name"
              loading="lazy"
              @error="
                ($event.target as HTMLImageElement).style.display = 'none'
              "
            />
            <YcIcon v-else :name="typeOf(item).icon" :size="iconPx" />
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
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { filesize } from "@/utils";
import { enableThumbs } from "@/utils/constants";
import { files as api } from "@/api";
import { fileType } from "@/utils/yc";
import { useFileStore } from "@/stores/file";
import { useYcStore } from "@/stores/yc";
import YcIcon from "@/components/yc/YcIcon.vue";

const props = defineProps<{
  items: ResourceItem[];
  selected: number[];
  grouped?: boolean;
}>();

const emit = defineEmits<{
  (e: "open", item: ResourceItem): void;
  (e: "select", index: number, event: MouseEvent): void;
  (e: "context", item: ResourceItem, event: MouseEvent): void;
}>();

const fileStore = useFileStore();
const yc = useYcStore();

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

const iconPx = computed(() => {
  if (yc.iconSize === "small") return 28;
  if (yc.iconSize === "large") return 48;
  return 36;
});

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
.yc-grids {
  --yc-grid-icon: 92px;
  --yc-grid-radius: 18px;
  --yc-grid-w: 164px;
  --yc-grid-h: 214px;
  --yc-grid-gap: 12px;
  --yc-grid-pad: 14px;
  --yc-card-pad: 13px;
  --yc-grid-name: 13px;
  padding: var(--yc-grid-pad);
}

.yc-grids.is-small {
  --yc-grid-icon: 64px;
  --yc-grid-radius: 14px;
  --yc-grid-w: 124px;
  --yc-grid-h: 166px;
  --yc-grid-gap: 8px;
  --yc-grid-pad: 12px;
  --yc-card-pad: 10px;
  --yc-grid-name: 12px;
}

.yc-grids.is-large {
  --yc-grid-icon: 128px;
  --yc-grid-radius: 24px;
  --yc-grid-w: 208px;
  --yc-grid-h: 270px;
  --yc-grid-gap: 14px;
  --yc-grid-pad: 18px;
  --yc-card-pad: 16px;
  --yc-grid-name: 13.5px;
}

.yc-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(var(--yc-grid-w), 1fr));
  justify-content: stretch;
  gap: var(--yc-grid-gap);
}

.yc-group__title {
  display: flex;
  align-items: center;
  gap: 7px;
  height: 32px;
  padding: 0 10px;
  margin: 8px 0 6px;
  color: var(--yc-text-2);
  font-size: 11.5px;
  font-weight: 600;
}
.yc-group__title:first-child {
  margin-top: 0;
}
.yc-group__title :deep(.yc-icon) {
  color: var(--yc-muted);
}
.yc-group__count {
  font-weight: 400;
  color: var(--yc-muted);
}

.yc-grid + .yc-grid {
  margin-top: 2px;
}

.yc-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  text-align: center;
  gap: 6px;
  width: 100%;
  min-height: var(--yc-grid-h);
  padding: var(--yc-card-pad);
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
  width: var(--yc-grid-icon);
  height: var(--yc-grid-icon);
  border-radius: var(--yc-grid-radius);
  display: grid;
  place-items: center;
  overflow: hidden;
  background: var(--yc-type-doc);
  color: var(--yc-type-doc-fg);
  margin: auto auto 6px;
  flex: none;
}
.yc-card__icon img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
/* 图片 / 视频缩略图占满卡片宽度，普通图标保持原尺寸 */
.yc-card__icon.has-thumb {
  width: 100%;
  height: auto;
  aspect-ratio: 1 / 1;
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
  font-size: var(--yc-grid-name);
  color: var(--yc-text);
  width: 100%;
  text-align: center;
  margin-top: auto;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.yc-card__meta {
  font-size: 11px;
  color: var(--yc-muted);
  text-align: center;
  width: 100%;
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

@media (max-width: 900px) {
  .yc-grids.is-large {
    --yc-grid-w: 160px;
    --yc-grid-h: 228px;
    --yc-grid-icon: 100px;
  }
}

@media (max-width: 620px) {
  .yc-grids {
    --yc-grid-pad: 8px;
    --yc-grid-gap: 6px;
    --yc-grid-h: 100px;
    --yc-grid-icon: 44px;
    --yc-grid-radius: 10px;
    --yc-grid-name: 10px;
    --yc-icon-px: 22px;
    --yc-card-pad: 6px;
    --yc-mobile-cols: 5;
  }

  .yc-grids.is-small {
    --yc-mobile-cols: 6;
    --yc-grid-pad: 8px;
    --yc-grid-gap: 6px;
    --yc-grid-h: 84px;
    --yc-grid-icon: 34px;
    --yc-grid-radius: 8px;
    --yc-grid-name: 9.5px;
    --yc-icon-px: 18px;
    --yc-card-pad: 5px;
  }

  .yc-grids.is-medium {
    --yc-mobile-cols: 5;
    --yc-grid-pad: 8px;
    --yc-grid-gap: 6px;
    --yc-grid-h: 100px;
    --yc-grid-icon: 44px;
    --yc-grid-radius: 10px;
    --yc-grid-name: 10px;
    --yc-icon-px: 22px;
    --yc-card-pad: 6px;
  }

  .yc-grids.is-large {
    --yc-mobile-cols: 4;
    --yc-grid-pad: 8px;
    --yc-grid-gap: 6px;
    --yc-grid-h: 124px;
    --yc-grid-icon: 56px;
    --yc-grid-radius: 12px;
    --yc-grid-name: 10.5px;
    --yc-icon-px: 26px;
    --yc-card-pad: 7px;
  }

  .yc-grid {
    grid-template-columns: repeat(var(--yc-mobile-cols), minmax(0, 1fr));
    gap: var(--yc-grid-gap);
  }

  .yc-card {
    width: 100%;
    min-height: var(--yc-grid-h);
    padding: var(--yc-card-pad);
    gap: 3px;
    justify-content: center;
  }

  .yc-card__icon {
    width: var(--yc-grid-icon);
    height: var(--yc-grid-icon);
    margin: 0 auto 4px;
  }

  .yc-card__icon.has-thumb {
    aspect-ratio: 4 / 5;
  }

  .yc-card__icon :deep(.yc-icon) {
    width: var(--yc-icon-px);
    height: var(--yc-icon-px);
  }

  .yc-card__name {
    font-size: var(--yc-grid-name);
    margin-top: 0;
  }

  .yc-card__meta {
    font-size: 8.5px;
  }

  .yc-card__more {
    top: 3px;
    right: 3px;
    width: 20px;
    height: 20px;
  }

  .yc-group__title {
    height: 28px;
    margin: 4px 0 4px;
    padding: 0 6px;
  }
}
</style>
