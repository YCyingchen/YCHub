<template>
  <div class="yc-search-overlay" @click.self="close">
    <div class="yc-search-panel" role="dialog" aria-label="搜索文件">
      <div class="yc-search-input">
        <YcIcon name="search" :size="18" />
        <input
          ref="inputEl"
          v-model="query"
          type="text"
          placeholder="搜索当前目录的文件…"
          autocomplete="off"
          spellcheck="false"
          @input="onInput"
          @keydown.esc="close"
        />
        <button class="yc-search-close" title="关闭" @click="close">
          <YcIcon name="x" :size="17" />
        </button>
      </div>

      <div class="yc-search-results">
        <p v-if="loading" class="yc-search-hint">搜索中…</p>
        <p v-else-if="query && results.length === 0" class="yc-search-hint">
          没有找到匹配的文件
        </p>
        <p v-else-if="!query" class="yc-search-hint">
          输入关键词，按文件名搜索当前目录
        </p>

        <button
          v-for="item in results"
          :key="item.url"
          class="yc-search-item"
          @click="open(item)"
        >
          <span class="yc-search-item__icon" :class="`is-${typeOf(item).kind}`">
            <YcIcon :name="typeOf(item).icon" :size="18" />
          </span>
          <span class="yc-search-item__main">
            <span class="yc-search-item__name">{{ itemName(item) }}</span>
            <span class="yc-search-item__path">{{ displayPath(item.path) }}</span>
          </span>
          <YcIcon name="chevron-right" :size="15" class="yc-search-item__arrow" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { search } from "@/api";
import { fileType, displayPath, baseName } from "@/utils/yc";
import YcIcon from "@/components/yc/YcIcon.vue";

const emit = defineEmits<{ (e: "close"): void }>();

const route = useRoute();
const router = useRouter();

const query = ref("");
const results = ref<ResourceItem[]>([]);
const loading = ref(false);
const inputEl = ref<HTMLInputElement | null>(null);

let timer: number | null = null;
let controller: AbortController | null = null;

const itemName = (item: ResourceItem) => item.name || baseName(item.path);
const typeOf = (item: ResourceItem) =>
  fileType({ ...item, name: itemName(item) });

const reset = () => {
  results.value = [];
  loading.value = false;
  controller?.abort();
  controller = null;
};

const runSearch = async () => {
  const value = query.value.trim();
  if (!value) {
    reset();
    return;
  }

  reset();
  loading.value = true;
  controller = new AbortController();

  try {
    await search(
      route.path.endsWith("/") ? route.path : route.path + "/",
      value,
      controller.signal,
      (item) => {
        if (results.value.length < 200) results.value.push(item);
      }
    );
  } catch {
    /* 取消或网络错误时保持当前结果 */
  } finally {
    loading.value = false;
  }
};

const onInput = () => {
  if (timer !== null) window.clearTimeout(timer);
  timer = window.setTimeout(runSearch, 280);
};

const open = (item: ResourceItem) => {
  router.push(item.url);
  close();
};

const close = () => emit("close");

const onKeydown = (event: KeyboardEvent) => {
  if (event.key === "Escape") close();
};

onMounted(() => {
  inputEl.value?.focus();
  window.addEventListener("keydown", onKeydown);
});

onBeforeUnmount(() => {
  if (timer !== null) window.clearTimeout(timer);
  controller?.abort();
  window.removeEventListener("keydown", onKeydown);
});
</script>

<style scoped>
.yc-search-overlay {
  position: fixed;
  inset: 0;
  z-index: 999;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 10vh 16px 20px;
  background: rgba(16, 24, 40, 0.38);
}

.yc-search-panel {
  width: 100%;
  max-width: 560px;
  max-height: 72vh;
  display: flex;
  flex-direction: column;
  background: var(--yc-surface);
  border: 1px solid var(--yc-border);
  border-radius: var(--yc-radius-lg);
  box-shadow: var(--yc-shadow-lg);
  overflow: hidden;
}

.yc-search-input {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 54px;
  padding: 0 16px;
  border-bottom: 1px solid var(--yc-border);
  color: var(--yc-muted);
  flex: none;
}
.yc-search-input input {
  flex: 1;
  min-width: 0;
  border: 0;
  background: transparent;
  color: var(--yc-text);
  font-family: inherit;
  font-size: 14px;
  outline: none;
}
.yc-search-input input::placeholder {
  color: var(--yc-muted);
}
.yc-search-close {
  width: 30px;
  height: 30px;
  display: grid;
  place-items: center;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: var(--yc-muted);
  cursor: pointer;
}
.yc-search-close:hover {
  background: var(--yc-surface-2);
  color: var(--yc-text);
}

.yc-search-results {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 8px;
}
.yc-search-hint {
  margin: 24px 12px;
  text-align: center;
  font-size: 12.5px;
  color: var(--yc-muted);
}

.yc-search-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 9px 10px;
  border: 0;
  border-radius: 9px;
  background: transparent;
  color: var(--yc-text-2);
  font-family: inherit;
  text-align: left;
  cursor: pointer;
}
.yc-search-item:hover {
  background: var(--yc-accent-soft);
  color: var(--yc-accent);
}
.yc-search-item__icon {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  display: grid;
  place-items: center;
  flex: none;
  background: var(--yc-type-doc);
  color: var(--yc-type-doc-fg);
}
.yc-search-item__icon.is-folder {
  background: var(--yc-type-folder);
  color: var(--yc-type-folder-fg);
}
.yc-search-item__icon.is-image {
  background: var(--yc-type-image);
  color: var(--yc-type-image-fg);
}
.yc-search-item__icon.is-video {
  background: var(--yc-type-video);
  color: var(--yc-type-video-fg);
}
.yc-search-item__icon.is-audio {
  background: var(--yc-type-audio);
  color: var(--yc-type-audio-fg);
}
.yc-search-item__icon.is-zip {
  background: var(--yc-type-zip);
  color: var(--yc-type-zip-fg);
}
.yc-search-item__main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.yc-search-item__name {
  font-size: 13px;
  color: var(--yc-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.yc-search-item__path {
  font-size: 11px;
  color: var(--yc-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.yc-search-item__arrow {
  color: var(--yc-muted);
  flex: none;
}

@media (max-width: 620px) {
  .yc-search-overlay {
    padding: 0;
    align-items: stretch;
  }
  .yc-search-panel {
    max-width: none;
    max-height: none;
    height: 100dvh;
    border-radius: 0;
    border: 0;
  }
}
</style>
