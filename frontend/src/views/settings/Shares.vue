<template>
  <errors v-if="error" :errorCode="error.status" />
  <div v-else class="yc-shares">
    <section class="yc-shares__stats">
      <button
        v-for="stat in stats"
        :key="stat.id"
        class="yc-stat"
        :class="{ 'is-active': filter === stat.id }"
        @click="filter = stat.id"
      >
        <span class="yc-stat__num">{{ stat.count }}</span>
        <span class="yc-stat__label">{{ stat.label }}</span>
      </button>
    </section>

    <section class="yc-shares__toolbar">
      <div class="yc-shares__filters">
        <button
          v-for="item in filters"
          :key="item.id"
          class="yc-chip"
          :class="{ 'is-active': filter === item.id }"
          @click="filter = item.id"
        >
          {{ item.label }}
        </button>
      </div>
      <label class="yc-shares__search">
        <YcIcon name="search" :size="15" />
        <input v-model="keyword" type="text" placeholder="搜索路径或链接" />
      </label>
    </section>

    <p class="yc-shares__domain">
      <YcIcon name="link" :size="14" />
      分享链接使用当前域名 <strong>{{ host }}</strong>
    </p>

    <div v-if="loading" class="yc-shares__state">正在读取分享…</div>
    <div v-else-if="filtered.length === 0" class="yc-shares__state">
      <span class="yc-state__icon">
        <YcIcon name="link" :size="30" />
      </span>
      <p>{{ links.length === 0 ? "还没有分享链接" : "没有匹配的分享" }}</p>
      <small>
        {{
          links.length === 0
            ? "在文件右键菜单里选择「分享链接」即可创建"
            : "换个关键词，或切换上方的筛选"
        }}
      </small>
    </div>

    <div v-else class="yc-shares__list">
      <article
        v-for="link in filtered"
        :key="link.hash"
        class="yc-share"
        :class="{ 'is-selected': selected.includes(link.hash) }"
      >
        <label class="yc-share__check">
          <input
            type="checkbox"
            :checked="selected.includes(link.hash)"
            @change="toggleSelect(link.hash)"
          />
        </label>

        <div class="yc-share__main">
          <div class="yc-share__top">
            <span class="yc-share__path" :title="link.path">{{
              link.path
            }}</span>
            <span class="yc-pill" :class="`is-${statusOf(link).id}`">
              {{ statusOf(link).label }}
            </span>
          </div>
          <a class="yc-share__link" :href="buildLink(link)" target="_blank">{{
            buildLink(link)
          }}</a>
          <div class="yc-share__meta">
            <span>{{ expireText(link) }}</span>
            <span v-if="link.username">创建者 {{ link.username }}</span>
            <span class="yc-share__hash">#{{ link.hash.slice(0, 8) }}</span>
          </div>
        </div>

        <div class="yc-share__actions">
          <button class="yc-btn yc-btn--sm" @click="copyLink(link)">
            <YcIcon name="file-text" :size="14" />
            复制
          </button>
          <button
            class="yc-btn yc-btn--sm yc-btn--ghost yc-btn--danger"
            @click="deleteLink($event, link)"
          >
            <YcIcon name="trash" :size="14" />
          </button>
        </div>
      </article>
    </div>

    <div v-if="selected.length > 0" class="yc-batch">
      <span>已选 {{ selected.length }} 条</span>
      <button class="yc-btn yc-btn--sm" @click="selected = []">取消</button>
      <button
        class="yc-btn yc-btn--sm"
        :class="confirmBatch ? 'yc-btn--danger' : 'yc-btn--primary'"
        @click="batchDelete"
      >
        {{ confirmBatch ? `确认删除 ${selected.length} 条` : "批量删除" }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, onMounted, ref } from "vue";
import { useAuthStore } from "@/stores/auth";
import { useLayoutStore } from "@/stores/layout";
import { share as api, users } from "@/api";
import dayjs from "dayjs";
import Errors from "@/views/Errors.vue";
import { StatusError } from "@/api/utils";
import { copy } from "@/utils/clipboard";
import YcIcon from "@/components/yc/YcIcon.vue";

const $showError = inject<IToastError>("$showError")!;
const $showSuccess = inject<IToastSuccess>("$showSuccess")!;

const authStore = useAuthStore();
const layoutStore = useLayoutStore();

const error = ref<StatusError | null>(null);
const links = ref<Share[]>([]);
const loading = ref(true);
const filter = ref("all");
const keyword = ref("");
const selected = ref<string[]>([]);
const confirmBatch = ref(false);

const host = window.location.host;

const filters = [
  { id: "all", label: "全部" },
  { id: "active", label: "有效" },
  { id: "soon", label: "即将到期" },
  { id: "expired", label: "已过期" },
  { id: "permanent", label: "永久" },
];

const statusOf = (link: Share) => {
  if (!link.expire) return { id: "permanent", label: "永久" };
  const time = link.expire * 1000;
  if (time < Date.now()) return { id: "expired", label: "已过期" };
  if (time - Date.now() <= 7 * 86400_000)
    return { id: "soon", label: "即将到期" };
  return { id: "active", label: "有效" };
};

const filtered = computed(() => {
  const kw = keyword.value.trim().toLowerCase();
  return links.value.filter((link) => {
    if (filter.value !== "all" && statusOf(link).id !== filter.value)
      return false;
    if (!kw) return true;
    return (
      link.path.toLowerCase().includes(kw) ||
      link.hash.toLowerCase().includes(kw) ||
      buildLink(link).toLowerCase().includes(kw)
    );
  });
});

const stats = computed(() => {
  const count = (id: string) =>
    id === "all"
      ? links.value.length
      : links.value.filter((link) => statusOf(link).id === id).length;
  return [
    { id: "all", label: "全部分享", count: count("all") },
    { id: "active", label: "有效", count: count("active") },
    { id: "soon", label: "即将到期", count: count("soon") },
    { id: "expired", label: "已过期", count: count("expired") },
  ];
});

onMounted(async () => {
  layoutStore.loading = true;
  try {
    const newLinks = await api.list();
    if (authStore.user?.perm.admin) {
      const userMap = new Map<number, string>();
      for (const user of await users.getAll())
        userMap.set(user.id, user.username);
      for (const link of newLinks) {
        if (link.userID && userMap.has(link.userID))
          link.username = userMap.get(link.userID);
      }
    }
    links.value = newLinks;
  } catch (err) {
    if (err instanceof Error) error.value = err as StatusError;
  } finally {
    loading.value = false;
    layoutStore.loading = false;
  }
});

const expireText = (link: Share) => {
  if (!link.expire) return "长期有效";
  const time = link.expire * 1000;
  if (time < Date.now()) return `${dayjs(time).format("YYYY-MM-DD")} 已过期`;
  return `${dayjs(time).format("YYYY-MM-DD")} 到期`;
};

const buildLink = (share: Share) => api.getShareURL(share);

const copyLink = (link: Share) => {
  const text = buildLink(link);
  const fallback = () =>
    copy({ text }, { permission: true }).then(
      () => $showSuccess("链接已复制"),
      (e) => $showError(e)
    );
  copy({ text }).then(() => $showSuccess("链接已复制"), fallback);
};

const toggleSelect = (hash: string) => {
  const i = selected.value.indexOf(hash);
  if (i === -1) selected.value.push(hash);
  else selected.value.splice(i, 1);
  confirmBatch.value = false;
};

const deleteLink = async (event: Event, link: Share) => {
  event.preventDefault();
  layoutStore.showHover({
    prompt: "share-delete",
    confirm: () => {
      layoutStore.closeHovers();
      try {
        api.remove(link.hash);
        links.value = links.value.filter((item) => item.hash !== link.hash);
        selected.value = selected.value.filter((h) => h !== link.hash);
        $showSuccess("分享已删除");
      } catch (err) {
        if (err instanceof Error) $showError(err);
      }
    },
  });
};

const batchDelete = async () => {
  if (!confirmBatch.value) {
    confirmBatch.value = true;
    setTimeout(() => (confirmBatch.value = false), 4000);
    return;
  }
  const hashes = [...selected.value];
  let done = 0;
  for (const hash of hashes) {
    try {
      await api.remove(hash);
      done++;
    } catch (err) {
      if (err instanceof Error) $showError(err);
    }
  }
  links.value = links.value.filter((l) => !hashes.includes(l.hash));
  selected.value = [];
  confirmBatch.value = false;
  $showSuccess(`已删除 ${done} 条分享`);
};
</script>

<style scoped>
.yc-shares {
  display: flex;
  flex-direction: column;
  gap: 14px;
  position: relative;
  padding-bottom: 12px;
}

.yc-shares__stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}
.yc-stat {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  padding: 14px 16px;
  border: 1px solid var(--yc-border);
  border-radius: 12px;
  background: var(--yc-surface);
  cursor: pointer;
  font-family: inherit;
  text-align: left;
}
.yc-stat.is-active {
  border-color: var(--yc-accent);
  box-shadow: 0 0 0 3px var(--yc-accent-soft);
}
.yc-stat__num {
  font-size: 20px;
  font-weight: 700;
  color: var(--yc-text);
}
.yc-stat__label {
  font-size: 11.5px;
  color: var(--yc-muted);
}

.yc-shares__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}
.yc-shares__filters {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.yc-chip {
  height: 30px;
  padding: 0 12px;
  border: 1px solid var(--yc-border);
  border-radius: var(--yc-radius-pill);
  background: var(--yc-surface);
  color: var(--yc-text-2);
  font-family: inherit;
  font-size: 12px;
  cursor: pointer;
}
.yc-chip.is-active {
  background: var(--yc-accent-soft);
  border-color: transparent;
  color: var(--yc-accent);
  font-weight: 600;
}
.yc-shares__search {
  display: flex;
  align-items: center;
  gap: 7px;
  height: 32px;
  padding: 0 11px;
  border: 1px solid var(--yc-border);
  border-radius: 9px;
  background: var(--yc-surface);
  color: var(--yc-muted);
}
.yc-shares__search input {
  border: 0;
  background: transparent;
  color: var(--yc-text);
  font-family: inherit;
  font-size: 12.5px;
  outline: none;
  width: 170px;
}

.yc-shares__domain {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0;
  font-size: 11.5px;
  color: var(--yc-muted);
}
.yc-shares__domain strong {
  color: var(--yc-text-2);
  font-weight: 500;
}

.yc-shares__state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 48px 20px;
  border: 1px dashed var(--yc-border);
  border-radius: 14px;
  background: var(--yc-surface);
  color: var(--yc-muted);
  font-size: 12.5px;
}
.yc-shares__state p {
  margin: 0;
  font-size: 13.5px;
  font-weight: 600;
  color: var(--yc-text);
}
.yc-shares__state small {
  font-size: 11.5px;
}
.yc-state__icon {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  display: grid;
  place-items: center;
  background: var(--yc-accent-soft);
  color: var(--yc-accent);
  margin-bottom: 4px;
}

.yc-shares__list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.yc-share {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 16px;
  border: 1px solid var(--yc-border);
  border-radius: 12px;
  background: var(--yc-surface);
}
.yc-share.is-selected {
  border-color: var(--yc-accent);
  background: var(--yc-accent-soft);
}
.yc-share__check {
  padding-top: 2px;
}
.yc-share__check input {
  accent-color: var(--yc-accent);
  width: 15px;
  height: 15px;
}
.yc-share__main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.yc-share__top {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}
.yc-share__path {
  font-size: 13px;
  font-weight: 600;
  color: var(--yc-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.yc-pill.is-active {
  background: rgba(70, 167, 88, 0.12);
  color: var(--yc-success);
  border-color: transparent;
}
.yc-pill.is-soon {
  background: rgba(245, 165, 36, 0.14);
  color: var(--yc-warning);
  border-color: transparent;
}
.yc-pill.is-expired {
  background: var(--yc-danger-soft);
  color: var(--yc-danger);
  border-color: transparent;
}
.yc-pill.is-permanent {
  background: var(--yc-accent-soft);
  color: var(--yc-accent);
  border-color: transparent;
}
.yc-share__link {
  font-size: 11.5px;
  color: var(--yc-accent);
  text-decoration: none;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.yc-share__link:hover {
  text-decoration: underline;
}
.yc-share__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  font-size: 11px;
  color: var(--yc-muted);
}
.yc-share__hash {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
}
.yc-share__actions {
  display: flex;
  gap: 6px;
  flex: none;
}
.yc-btn--sm {
  height: 30px;
  padding: 0 10px;
  font-size: 12px;
}

.yc-batch {
  position: sticky;
  bottom: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border: 1px solid var(--yc-border);
  border-radius: 12px;
  background: var(--yc-surface);
  box-shadow: var(--yc-shadow);
  font-size: 12.5px;
  color: var(--yc-text-2);
}
.yc-batch span {
  margin-right: auto;
}

@media (max-width: 760px) {
  .yc-shares__stats {
    grid-template-columns: repeat(2, 1fr);
  }
  .yc-share {
    flex-wrap: wrap;
  }
  .yc-share__actions {
    width: 100%;
    justify-content: flex-end;
  }
  .yc-shares__search input {
    width: 120px;
  }
}
</style>
