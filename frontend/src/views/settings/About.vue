<template>
  <div class="yc-about">
    <section class="yc-about__hero">
      <span class="yc-about__mark">YC</span>
      <div>
        <h2>YCHub</h2>
        <p>影尘 · 自托管文件管理</p>
      </div>
      <span class="yc-about__version">v{{ displayVersion }}</span>
    </section>

    <section class="yc-panel">
      <div class="yc-panel__head">
        <h2>构建信息</h2>
      </div>
      <dl class="yc-props">
        <div class="yc-props__row">
          <dt>版本</dt>
          <dd>v{{ displayVersion }}</dd>
        </div>
        <div class="yc-props__row">
          <dt>构建</dt>
          <dd>{{ buildLabel }}</dd>
        </div>
        <div class="yc-props__row">
          <dt>后端</dt>
          <dd>Go · File Browser v2 分支</dd>
        </div>
        <div class="yc-props__row">
          <dt>前端</dt>
          <dd>Vue 3 · Vite</dd>
        </div>
        <div class="yc-props__row">
          <dt>访问地址</dt>
          <dd class="yc-props__mono">{{ origin }}</dd>
        </div>
      </dl>
    </section>

    <section class="yc-panel">
      <div class="yc-panel__head">
        <h2>链接</h2>
      </div>
      <a
        class="yc-link"
        href="https://github.com/YCyingchen/YCHub"
        target="_blank"
        rel="noopener noreferrer"
      >
        <YcIcon name="link" :size="16" />
        <span>GitHub 仓库</span>
        <YcIcon name="chevron-right" :size="15" class="yc-link__arrow" />
      </a>
      <a
        class="yc-link"
        href="https://github.com/YCyingchen/YCHub/blob/master/LICENSE"
        target="_blank"
        rel="noopener noreferrer"
      >
        <YcIcon name="file-text" :size="16" />
        <span>开源许可证 Apache-2.0</span>
        <YcIcon name="chevron-right" :size="15" class="yc-link__arrow" />
      </a>
    </section>

    <section class="yc-panel">
      <div class="yc-panel__head">
        <h2>更新</h2>
        <p>检查是否有新版本</p>
      </div>
      <div class="yc-about__update">
        <span class="yc-muted">当前已是最新版本</span>
        <button class="yc-btn" disabled>
          <YcIcon name="refresh" :size="15" />
          检查更新
        </button>
      </div>
      <p class="yc-about__note">
        YCHub 基于 File Browser 的最后一个版本继续开发，前端界面与交互按 YC
        设计规范重做。
      </p>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { version } from "@/utils/constants";
import YcIcon from "@/components/yc/YcIcon.vue";

const displayVersion = computed(() =>
  /^\d/.test(version) ? version : "1.0.0"
);
const buildLabel = computed(() =>
  /^\d/.test(version) ? "发行构建" : "开发构建"
);
const origin = window.location.origin;
</script>

<style scoped>
.yc-about {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.yc-about__hero {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 22px;
  border-radius: 16px;
  background: linear-gradient(135deg, #4f6bff 0%, #7a5cff 100%);
  color: #fff;
}
.yc-about__mark {
  width: 46px;
  height: 46px;
  border-radius: 13px;
  display: grid;
  place-items: center;
  font-size: 15px;
  font-weight: 700;
  color: var(--yc-accent);
  background: #fff;
}
.yc-about__hero h2 {
  margin: 0;
  font-size: 19px;
  font-weight: 700;
}
.yc-about__hero p {
  margin: 3px 0 0;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
}
.yc-about__version {
  margin-left: auto;
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.18);
}

.yc-panel {
  padding: 18px;
  background: var(--yc-surface);
  border: 1px solid var(--yc-border);
  border-radius: 14px;
}
.yc-panel__head {
  margin-bottom: 12px;
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

.yc-props {
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 9px;
}
.yc-props__row {
  display: flex;
  align-items: baseline;
  gap: 10px;
  font-size: 12.5px;
}
.yc-props__row dt {
  width: 72px;
  flex: none;
  color: var(--yc-muted);
}
.yc-props__row dd {
  margin: 0;
  color: var(--yc-text-2);
  overflow-wrap: anywhere;
}
.yc-props__mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 11.5px;
}

.yc-link {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 4px;
  border-bottom: 1px solid var(--yc-border);
  color: var(--yc-text-2);
  font-size: 13px;
  text-decoration: none;
}
.yc-link:last-child {
  border-bottom: 0;
}
.yc-link:hover {
  color: var(--yc-accent);
}
.yc-link__arrow {
  margin-left: auto;
  color: var(--yc-muted);
}

.yc-about__update {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.yc-about__note {
  margin: 14px 0 0;
  padding-top: 14px;
  border-top: 1px solid var(--yc-border);
  font-size: 11.5px;
  line-height: 1.7;
  color: var(--yc-muted);
}
</style>
