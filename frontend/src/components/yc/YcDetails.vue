<template>
  <aside class="yc-details">
    <template v-if="item">
      <div class="yc-details__preview" :class="`is-${type.kind}`">
        <img v-if="previewSrc" :src="previewSrc" :alt="item.name" />
        <YcIcon v-else :name="type.icon" :size="44" />
      </div>

      <div class="yc-details__head">
        <p class="yc-details__name" :title="item.name">{{ item.name }}</p>
        <span class="yc-details__type">{{ type.label }}</span>
      </div>

      <div class="yc-details__actions">
        <button class="yc-btn yc-btn--primary yc-details__open" @click="open">
          <YcIcon name="arrow-right" :size="15" />
          打开
        </button>
        <button
          class="yc-btn yc-btn--icon"
          title="下载"
          :disabled="!canDownload"
          @click="download"
        >
          <YcIcon name="download" :size="16" />
        </button>
        <button
          class="yc-btn yc-btn--icon"
          title="收藏"
          :class="{ 'is-fav': isFav }"
          @click="toggleFav"
        >
          <YcIcon name="star" :size="16" />
        </button>
      </div>

      <dl class="yc-props">
        <div class="yc-props__row">
          <dt>类型</dt>
          <dd>{{ type.label }}</dd>
        </div>
        <div class="yc-props__row">
          <dt>大小</dt>
          <dd>{{ sizeText }}</dd>
        </div>
        <div class="yc-props__row">
          <dt>位置</dt>
          <dd :title="location" class="yc-props__path">{{ location }}</dd>
        </div>
        <div class="yc-props__row">
          <dt>修改时间</dt>
          <dd>{{ timeText }}</dd>
        </div>
        <div class="yc-props__row">
          <dt>权限</dt>
          <dd>{{ modeString(item.mode) }}</dd>
        </div>
        <div v-if="item.isSymlink" class="yc-props__row">
          <dt>符号链接</dt>
          <dd>是</dd>
        </div>
      </dl>

      <div class="yc-details__more">
        <button
          v-if="canShare"
          class="yc-btn yc-btn--ghost"
          @click="prompt('share')"
        >
          <YcIcon name="link" :size="15" />
          分享
        </button>
        <button
          v-if="canRename"
          class="yc-btn yc-btn--ghost"
          @click="prompt('rename')"
        >
          <YcIcon name="edit" :size="15" />
          重命名
        </button>
        <button
          v-if="canDelete"
          class="yc-btn yc-btn--ghost yc-btn--danger"
          @click="prompt('delete')"
        >
          <YcIcon name="trash" :size="15" />
          删除
        </button>
      </div>

      <p class="yc-details__hint">空格 预览 · F2 重命名 · Del 删除</p>
    </template>

    <template v-else>
      <div class="yc-details__preview is-folder">
        <YcIcon name="folder" :size="44" />
      </div>
      <div class="yc-details__head">
        <p class="yc-details__name">{{ folderName }}</p>
        <span class="yc-details__type">文件夹</span>
      </div>
      <dl class="yc-props">
        <div class="yc-props__row">
          <dt>项目</dt>
          <dd>{{ summary }}</dd>
        </div>
        <div class="yc-props__row">
          <dt>位置</dt>
          <dd :title="location" class="yc-props__path">{{ location }}</dd>
        </div>
      </dl>
      <button class="yc-btn yc-details__fav-folder" @click="toggleFolderFav">
        <YcIcon name="star" :size="15" />
        {{ folderFav ? "取消收藏此文件夹" : "收藏此文件夹" }}
      </button>
      <p class="yc-details__hint">选中文件后在这里查看详情与操作</p>
    </template>
  </aside>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { storeToRefs } from "pinia";
import { useFileStore } from "@/stores/file";
import { useLayoutStore } from "@/stores/layout";
import { useAuthStore } from "@/stores/auth";
import { useYcStore } from "@/stores/yc";
import { files as api } from "@/api";
import { filesize } from "@/utils";
import dayjs from "dayjs";
import { displayPath, fileType, modeString } from "@/utils/yc";
import YcIcon from "@/components/yc/YcIcon.vue";

const route = useRoute();
const router = useRouter();
const fileStore = useFileStore();
const layoutStore = useLayoutStore();
const authStore = useAuthStore();
const yc = useYcStore();
const { req } = storeToRefs(fileStore);

const item = computed<ResourceItem | null>(() => {
  if (!req.value || fileStore.selected.length !== 1) return null;
  return req.value.items[fileStore.selected[0]] ?? null;
});

const type = computed(() => fileType(item.value ?? { isDir: true }));
const previewSrc = computed(() => {
  if (!item.value || item.value.isDir) return null;
  if (type.value.kind !== "image") return null;
  return api.getPreviewURL(item.value, "big");
});
const sizeText = computed(() =>
  item.value?.isDir ? "—" : filesize(item.value?.size ?? 0)
);
const timeText = computed(() =>
  item.value?.modified ? dayjs(item.value.modified).format("YYYY-MM-DD HH:mm") : "—"
);
const location = computed(() => displayPath(req.value?.path));
const folderName = computed(() => req.value?.name || "我的文件");
const summary = computed(() => {
  if (!req.value) return "—";
  return `${req.value.numDirs ?? 0} 个文件夹 · ${req.value.numFiles ?? 0} 个文件`;
});

const isFav = computed(
  () => !!item.value && yc.isFavorite(item.value.path || "")
);
const folderFav = computed(() => yc.isFavorite(route.path));

const canDownload = computed(
  () => authStore.user?.perm?.download === true && !!item.value && !item.value.isDir
);
const canShare = computed(
  () =>
    authStore.user?.perm?.share === true &&
    authStore.user?.perm?.download === true &&
    fileStore.selected.length === 1
);
const canRename = computed(
  () => authStore.user?.perm?.rename === true && fileStore.selected.length === 1
);
const canDelete = computed(
  () => authStore.user?.perm?.delete === true && fileStore.selected.length > 0
);

const open = () => {
  if (!item.value) return;
  router.push(item.value.url);
};

const download = () => {
  if (!item.value) return;
  api.download(null, item.value.url);
};

const prompt = (name: string) => layoutStore.showHover(name);

const toggleFav = () => {
  if (!item.value) return;
  yc.toggleFavorite(item.value.path || item.value.url, item.value.name);
};
const toggleFolderFav = () => {
  yc.toggleFavorite(route.path, folderName.value);
};
</script>

<style scoped>
.yc-details {
  width: var(--yc-details);
  flex: none;
  border-left: 1px solid var(--yc-border);
  background: var(--yc-surface);
  padding: 18px 18px 16px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.yc-details__preview {
  height: 150px;
  border-radius: var(--yc-radius);
  display: grid;
  place-items: center;
  overflow: hidden;
  background: var(--yc-surface-2);
  color: var(--yc-type-doc-fg);
  border: 1px solid var(--yc-border);
}
.yc-details__preview img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  background: #000;
}
.yc-details__preview.is-folder {
  background: var(--yc-type-folder);
  color: var(--yc-type-folder-fg);
}
.yc-details__preview.is-image {
  background: var(--yc-type-image);
  color: var(--yc-type-image-fg);
}
.yc-details__preview.is-video {
  background: var(--yc-type-video);
  color: var(--yc-type-video-fg);
}
.yc-details__preview.is-audio {
  background: var(--yc-type-audio);
  color: var(--yc-type-audio-fg);
}
.yc-details__preview.is-zip {
  background: var(--yc-type-zip);
  color: var(--yc-type-zip-fg);
}

.yc-details__head {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}
.yc-details__name {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--yc-text);
  overflow-wrap: anywhere;
}
.yc-details__type {
  font-size: 11.5px;
  color: var(--yc-muted);
}

.yc-details__actions {
  display: flex;
  gap: 6px;
}
.yc-details__open {
  flex: 1;
}
.yc-btn.is-fav {
  color: var(--yc-warning);
  border-color: rgba(245, 165, 36, 0.4);
  background: rgba(245, 165, 36, 0.08);
}

.yc-props {
  margin: 0;
  border-top: 1px solid var(--yc-border);
  padding-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.yc-props__row {
  display: flex;
  align-items: baseline;
  gap: 10px;
  font-size: 12px;
}
.yc-props__row dt {
  width: 64px;
  flex: none;
  color: var(--yc-muted);
}
.yc-props__row dd {
  margin: 0;
  color: var(--yc-text-2);
  min-width: 0;
  overflow-wrap: anywhere;
}
.yc-props__path {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.yc-details__more {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding-top: 4px;
}
.yc-details__hint {
  margin: auto 0 0;
  padding-top: 14px;
  font-size: 11px;
  color: var(--yc-muted);
  border-top: 1px solid var(--yc-border);
}

.yc-details__fav-folder {
  width: 100%;
}

@media (max-width: 1180px) {
  .yc-details {
    width: 280px;
  }
}
@media (max-width: 900px) {
  .yc-details {
    display: none;
  }
}
</style>
