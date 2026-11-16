<template>
  <div class="yc-pane">
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
      <span class="yc-pane__count">{{ items.length }}</span>
    </div>

    <div class="yc-pane__list">
      <p v-if="loading" class="yc-pane__hint">加载中…</p>
      <p v-else-if="items.length === 0" class="yc-pane__hint">空文件夹</p>
      <button
        v-for="item in items"
        :key="item.path"
        class="yc-pane__item"
        :class="{ 'is-dir': item.isDir, 'is-selected': selected === item.path }"
        @click="openItem(item)"
      >
        <YcIcon
          :name="fileType(item).icon"
          :size="16"
          :class="`is-${fileType(item).kind}`"
        />
        <span class="yc-pane__name">{{ item.name }}</span>
        <span v-if="!item.isDir" class="yc-pane__size">{{
          filesize(item.size)
        }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { useRouter } from "vue-router";
import { files as api } from "@/api";
import { filesize } from "@/utils";
import { displayPath, fileType } from "@/utils/yc";
import YcIcon from "@/components/yc/YcIcon.vue";

const props = defineProps<{ path: string }>();

const router = useRouter();
const currentPath = ref(props.path || "/");
const items = ref<ResourceItem[]>([]);
const loading = ref(false);
const selected = ref<string | null>(null);

const normalize = (path: string) => {
  let value = path || "/";
  if (!value.startsWith("/")) value = "/" + value;
  value = value.replace(/\/+$/, "");
  return value || "/";
};

const load = async () => {
  loading.value = true;
  try {
    const path = normalize(currentPath.value);
    const res = await api.fetch(
      "/files" + (path === "/" ? "/" : path + "/")
    );
    const all = res.items ?? [];
    items.value = [
      ...all.filter((item) => item.isDir),
      ...all.filter((item) => !item.isDir),
    ];
  } catch {
    items.value = [];
  } finally {
    loading.value = false;
  }
};

watch(
  () => props.path,
  (value) => {
    currentPath.value = normalize(value);
    load();
  }
);

watch(currentPath, load, { immediate: true });

const openItem = (item: ResourceItem) => {
  selected.value = item.path;
  if (item.isDir) {
    currentPath.value = normalize(item.path);
    return;
  }
  router.push(item.url);
};

const goUp = () => {
  const path = normalize(currentPath.value);
  if (path === "/") return;
  const parts = path.split("/").filter(Boolean);
  parts.pop();
  currentPath.value = "/" + parts.join("/");
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
.yc-pane__list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 4px;
}
.yc-pane__hint {
  margin: 20px 10px;
  text-align: center;
  font-size: 12px;
  color: var(--yc-muted);
}
.yc-pane__item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 7px 8px;
  border: 0;
  border-radius: 7px;
  background: transparent;
  color: var(--yc-text-2);
  font-family: inherit;
  font-size: 12.5px;
  text-align: left;
  cursor: pointer;
}
.yc-pane__item:hover {
  background: var(--yc-surface-2);
}
.yc-pane__item.is-selected {
  background: var(--yc-accent-soft);
  color: var(--yc-accent);
}
.yc-pane__item :deep(.yc-icon.is-folder) {
  color: var(--yc-type-folder-fg);
}
.yc-pane__name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.yc-pane__size {
  flex: none;
  font-size: 10.5px;
  color: var(--yc-muted);
}
</style>
