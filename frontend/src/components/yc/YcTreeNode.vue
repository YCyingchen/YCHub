<template>
  <div class="yc-tree__node">
    <div
      class="yc-tree__row"
      :class="{ 'is-active': isActive }"
      :style="{ paddingLeft: 8 + depth * 14 + 'px' }"
      :title="node.path"
      role="treeitem"
      @click="openPath"
    >
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

const usageText = computed(() => {
  if (!props.node.total) return "";
  return `${Math.round((props.node.used ?? 0) / props.node.total * 100)}%`;
});

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
