<template>
  <footer class="yc-statusbar">
    <div class="yc-statusbar__left">
      <span>{{ total }} 项</span>
      <span class="yc-dot">·</span>
      <span>{{ dirs }} 个文件夹</span>
      <span class="yc-dot">·</span>
      <span>{{ files }} 个文件</span>
      <template v-if="selected > 0">
        <span class="yc-dot">·</span>
        <span class="yc-statusbar__selected">已选 {{ selected }} 项</span>
      </template>
    </div>
    <div class="yc-statusbar__right">
      <span v-if="totalSize">共 {{ totalSize }}</span>
      <span class="yc-statusbar__view">
        <YcIcon
          :name="viewMode === 'grid' ? 'grid' : 'list'"
          :size="13"
        />
        {{ viewMode === "grid" ? "图标" : "列表" }}
      </span>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { storeToRefs } from "pinia";
import { useFileStore } from "@/stores/file";
import { useYcStore } from "@/stores/yc";
import { filesize } from "@/utils";
import YcIcon from "@/components/yc/YcIcon.vue";

const fileStore = useFileStore();
const yc = useYcStore();
const { req } = storeToRefs(fileStore);

const dirs = computed(() => req.value?.numDirs ?? 0);
const files = computed(() => req.value?.numFiles ?? 0);
const total = computed(() => dirs.value + files.value);
const selected = computed(() => fileStore.selectedCount);
const viewMode = computed(() => yc.viewMode);
const totalSize = computed(() => {
  if (!req.value) return "";
  const bytes = req.value.items
    .filter((i) => !i.isDir)
    .reduce((sum, i) => sum + (i.size || 0), 0);
  return bytes > 0 ? filesize(bytes) : "";
});
</script>

<style scoped>
.yc-statusbar {
  height: var(--yc-statusbar);
  flex: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  border-top: 1px solid var(--yc-border);
  background: var(--yc-surface);
  color: var(--yc-muted);
  font-size: 11.5px;
  user-select: none;
}
.yc-statusbar__left,
.yc-statusbar__right {
  display: flex;
  align-items: center;
  gap: 6px;
}
.yc-dot {
  opacity: 0.6;
}
.yc-statusbar__selected {
  color: var(--yc-accent);
}
.yc-statusbar__right {
  gap: 14px;
}
.yc-statusbar__view {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
@media (max-width: 620px) {
  .yc-statusbar {
    padding: 0 10px;
  }
  .yc-statusbar__right > span:first-child {
    display: none;
  }
}
</style>
