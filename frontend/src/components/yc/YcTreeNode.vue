<template>
  <div class="yc-tree__node">
    <div
      class="yc-tree__row"
      :class="{ 'is-mount': node.mount, 'is-active': isActive }"
      :style="{ paddingLeft: 8 + depth * 14 + 'px' }"
      :title="node.path"
      role="treeitem"
      @click="openPath"
    >
      <span class="yc-tree__main">
        <YcIcon
          :name="node.mount ? 'hard-drive' : 'folder'"
          :size="16"
          class="yc-tree__icon"
        />
        <span class="yc-tree__label">{{ node.name }}</span>
        <span v-if="node.mount && node.total" class="yc-tree__usage">{{
          usageText
        }}</span>
        <button
          class="yc-tree__chevron"
          :title="expanded ? '收起' : '展开'"
          @click.stop="toggle"
        >
          <YcIcon
            :name="
              loading ? 'refresh' : expanded ? 'chevron-down' : 'chevron-right'
            "
            :size="13"
            :class="{ 'is-spin': loading }"
          />
        </button>
      </span>

      <span
        v-if="node.mount && node.total"
        class="yc-tree__capacity"
      >
        <span class="yc-tree__bar">
          <span :style="{ width: percent + '%' }" />
        </span>
        <span class="yc-tree__capText"
          >已用 {{ usedText }} · 剩余 {{ freeText }}</span
        >
      </span>
    </div>

    <div v-if="expanded" class="yc-tree__children">
      <p
        v-if="loading"
        class="yc-tree__hint"
        :style="{ paddingLeft: 30 + depth * 14 + 'px' }"
      >
        加载中…
      </p>
      <p
        v-else-if="children.length === 0"
        class="yc-tree__hint"
        :style="{ paddingLeft: 30 + depth * 14 + 'px' }"
      >
        没有子文件夹
      </p>
      <YcTreeNode
        v-for="child in children"
        :key="child.path"
        :node="child"
        :depth="depth + 1"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useLayoutStore } from "@/stores/layout";
import { files as api } from "@/api";
import YcIcon from "@/components/yc/YcIcon.vue";
import prettyBytes from "pretty-bytes";

defineOptions({ name: "YcTreeNode" });

interface TreeNode {
  name: string;
  path: string;
  mount?: boolean;
  total?: number;
  used?: number;
}

const props = defineProps<{
  node: TreeNode;
  depth: number;
}>();

const router = useRouter();
const route = useRoute();
const layoutStore = useLayoutStore();

const expanded = ref(false);
const loading = ref(false);
const loaded = ref(false);
const children = ref<TreeNode[]>([]);

const isActive = computed(() => {
  const current = route.path.replace(/\/+$/, "");
  const target = ("/files" + props.node.path).replace(/\/+$/, "");
  return current === target;
});

const percent = computed(() => {
  if (!props.node.total) return 0;
  return Math.min(
    100,
    Math.round(((props.node.used ?? 0) / props.node.total) * 100)
  );
});

const usageText = computed(() =>
  props.node.total ? `${percent.value}%` : ""
);

const usedText = computed(() =>
  prettyBytes(props.node.used ?? 0, { binary: true })
);

const freeText = computed(() =>
  prettyBytes(
    Math.max(0, (props.node.total ?? 0) - (props.node.used ?? 0)),
    { binary: true }
  )
);

const load = async () => {
  if (loaded.value || loading.value) return;
  loading.value = true;
  try {
    const res = await api.fetch(
      "/files" + props.node.path.replace(/\/+$/, "") + "/"
    );
    children.value = (res.items ?? [])
      .filter((item) => item.isDir)
      .map((item) => ({
        name: item.name,
        path: props.node.path.replace(/\/+$/, "") + "/" + item.name,
        mount: false,
      }))
      .sort((a, b) => a.name.localeCompare(b.name, "zh-CN"));
    loaded.value = true;
  } catch {
    children.value = [];
  } finally {
    loading.value = false;
  }
};

const toggle = async () => {
  if (!expanded.value) await load();
  expanded.value = !expanded.value;
};

const openPath = () => {
  router.push("/files" + props.node.path + "/");
  layoutStore.closeHovers();
};
</script>

<style scoped>
.yc-tree__node {
  min-width: 0;
}
.yc-tree__row {
  display: flex;
  align-items: center;
  gap: 7px;
  height: 30px;
  padding-right: 6px;
  border-radius: 7px;
  color: var(--yc-text-2);
  font-size: 12.5px;
  cursor: pointer;
  user-select: none;
}
.yc-tree__row:hover {
  background: var(--yc-surface-2);
  color: var(--yc-text);
}
.yc-tree__row.is-active {
  background: var(--yc-accent-soft);
  color: var(--yc-accent);
  font-weight: 600;
}

.yc-tree__main {
  display: flex;
  align-items: center;
  gap: 7px;
  flex: 1;
  min-width: 0;
}

/* 存储空间：整块外框，名称、百分比与容量信息一起高亮 */
.yc-tree__row.is-mount {
  flex-direction: column;
  align-items: stretch;
  height: auto;
  padding-top: 5px;
  padding-bottom: 5px;
  margin: 4px 4px 4px 0;
  border: 1px solid var(--yc-border);
  border-radius: 10px;
  background: var(--yc-surface);
}
.yc-tree__row.is-mount .yc-tree__main {
  flex: none;
}
.yc-tree__row.is-mount:hover {
  background: var(--yc-surface-2);
  border-color: var(--yc-border-strong);
}
.yc-tree__row.is-mount.is-active {
  background: var(--yc-accent-soft);
  border-color: var(--yc-accent);
  color: var(--yc-accent);
}

.yc-tree__icon {
  color: var(--yc-muted);
  flex: none;
}
.yc-tree__row.is-active .yc-tree__icon {
  color: var(--yc-accent);
}
.yc-tree__label {
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.yc-tree__usage {
  margin-left: auto;
  font-size: 10px;
  color: var(--yc-muted);
  flex: none;
  font-weight: 400;
}
.yc-tree__chevron {
  width: 18px;
  height: 18px;
  display: grid;
  place-items: center;
  border: 0;
  border-radius: 5px;
  background: transparent;
  color: var(--yc-muted);
  cursor: pointer;
  flex: none;
}
.yc-tree__chevron:hover {
  background: var(--yc-surface);
  color: var(--yc-text);
}

.yc-tree__capacity {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 2px 0 0 23px;
}
.yc-tree__bar {
  flex: 1;
  height: 4px;
  min-width: 24px;
  border-radius: 2px;
  background: var(--yc-border);
  overflow: hidden;
}
.yc-tree__bar > span {
  display: block;
  height: 100%;
  border-radius: 2px;
  background: var(--yc-accent);
}
.yc-tree__capText {
  flex: none;
  font-size: 9.5px;
  color: var(--yc-muted);
  white-space: nowrap;
  font-weight: 400;
}

.yc-tree__hint {
  margin: 2px 0 4px;
  font-size: 11px;
  color: var(--yc-muted);
}
.is-spin {
  animation: yc-tree-spin 0.9s linear infinite;
}
@keyframes yc-tree-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
