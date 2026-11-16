<template>
  <div class="yc-storage">
    <section class="yc-panel">
      <div class="yc-panel__head">
        <h2>存储位置</h2>
        <p>当前账号可访问的目录</p>
      </div>
      <div class="yc-storage__row">
        <span class="yc-storage__path">/</span>
        <button class="yc-btn yc-btn--ghost" @click="refresh">
          <YcIcon name="refresh" :size="15" />
          刷新
        </button>
      </div>
    </section>

    <section class="yc-panel">
      <div class="yc-panel__head">
        <h2>容量</h2>
        <p>所在磁盘的使用情况</p>
      </div>
      <div v-if="loading" class="yc-storage__loading">正在读取用量…</div>
      <template v-else>
        <div class="yc-usage__bar">
          <span :style="{ width: percent + '%' }" />
        </div>
        <div class="yc-usage__labels">
          <span>已用 {{ usedText }}</span>
          <span>可用 {{ freeText }}</span>
          <span class="yc-muted">共 {{ totalText }}</span>
        </div>
        <p v-if="error" class="yc-storage__error">{{ error }}</p>
      </template>
    </section>

    <section class="yc-panel">
      <div class="yc-panel__head">
        <h2>预览缓存</h2>
        <p>缩略图与转码结果由服务端按需生成</p>
      </div>
      <div class="yc-storage__row">
        <span class="yc-muted">缓存目录由启动参数 <code>--cacheDir</code> 决定</span>
        <button class="yc-btn" disabled>清理缓存</button>
      </div>
    </section>

    <section class="yc-panel">
      <div class="yc-panel__head">
        <h2>维护</h2>
        <p>重建索引类操作</p>
      </div>
      <div class="yc-storage__row">
        <span class="yc-muted">重建缩略图</span>
        <button class="yc-btn" disabled>重建</button>
      </div>
      <div class="yc-storage__row">
        <span class="yc-muted">重建媒体索引</span>
        <button class="yc-btn" disabled>重建</button>
      </div>
      <p class="yc-storage__hint">这两个操作会在后端接入索引服务后开放。</p>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { files as api } from "@/api";
import prettyBytes from "pretty-bytes";
import YcIcon from "@/components/yc/YcIcon.vue";

const used = ref(0);
const total = ref(0);
const loading = ref(true);
const error = ref("");

const usedText = computed(() => prettyBytes(used.value, { binary: true }));
const totalText = computed(() => prettyBytes(total.value, { binary: true }));
const freeText = computed(() =>
  prettyBytes(Math.max(0, total.value - used.value), { binary: true })
);
const percent = computed(() =>
  total.value > 0
    ? Math.min(100, Math.round((used.value / total.value) * 100))
    : 0
);

let controller: AbortController | null = null;

const refresh = async () => {
  loading.value = true;
  error.value = "";
  controller?.abort();
  controller = new AbortController();
  try {
    const res = await api.usage("/files/", controller.signal);
    used.value = res.used;
    total.value = res.total;
  } catch {
    error.value = "读取磁盘用量失败";
  } finally {
    loading.value = false;
  }
};

onMounted(refresh);
</script>

<style scoped>
.yc-storage {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.yc-panel {
  padding: 18px;
  background: var(--yc-surface);
  border: 1px solid var(--yc-border);
  border-radius: 14px;
}
.yc-panel__head {
  margin-bottom: 14px;
}
.yc-panel__head h2 {
  margin: 0 0 4px;
  font-size: 14px;
  font-weight: 600;
  color: var(--yc-text);
}
.yc-panel__head p {
  margin: 0;
  font-size: 12px;
  color: var(--yc-muted);
}
.yc-storage__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 34px;
  font-size: 12.5px;
  color: var(--yc-text-2);
}
.yc-storage__path {
  font-size: 13px;
  color: var(--yc-text);
}
.yc-usage__bar {
  height: 8px;
  border-radius: 4px;
  background: var(--yc-surface-2);
  border: 1px solid var(--yc-border);
  overflow: hidden;
}
.yc-usage__bar span {
  display: block;
  height: 100%;
  background: var(--yc-accent);
  transition: width 0.3s ease;
}
.yc-usage__labels {
  display: flex;
  gap: 16px;
  margin-top: 10px;
  font-size: 12px;
  color: var(--yc-text-2);
  flex-wrap: wrap;
}
.yc-storage__loading {
  font-size: 12.5px;
  color: var(--yc-muted);
}
.yc-storage__error {
  margin: 10px 0 0;
  font-size: 12px;
  color: var(--yc-danger);
}
.yc-storage__hint {
  margin: 10px 0 0;
  font-size: 11.5px;
  color: var(--yc-muted);
}
code {
  padding: 1px 5px;
  border-radius: 5px;
  background: var(--yc-surface-2);
  font-size: 11.5px;
}
</style>
