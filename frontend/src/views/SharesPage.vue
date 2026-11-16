<template>
  <div class="yc-page">
    <div class="yc-page__bar">
      <button class="yc-iconbtn yc-page__menu" @click="openSidebar">
        <YcIcon name="menu" :size="19" />
      </button>
      <h1>分享管理</h1>
      <span class="yc-page__count" v-if="false" />
      <button class="yc-btn yc-btn--ghost" @click="goFiles">
        <YcIcon name="folder" :size="15" />
        去文件页新建分享
      </button>
    </div>
    <div class="yc-page__body">
      <Shares />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useLayoutStore } from "@/stores/layout";
import Shares from "@/views/settings/Shares.vue";
import YcIcon from "@/components/yc/YcIcon.vue";

const router = useRouter();
const layoutStore = useLayoutStore();

const openSidebar = () => layoutStore.showHover("sidebar");
const goFiles = () => router.push("/files/");

onMounted(() => document.body.classList.add("yc-shares-mode"));
onBeforeUnmount(() => document.body.classList.remove("yc-shares-mode"));
</script>

<style scoped>
.yc-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--yc-bg);
}
.yc-page__bar {
  flex: none;
  height: var(--yc-commandbar);
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 20px;
  background: var(--yc-surface);
  border-bottom: 1px solid var(--yc-border);
}
.yc-page__bar h1 {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: var(--yc-text);
}
.yc-page__bar .yc-btn {
  margin-left: auto;
}
.yc-page__body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 24px 40px 48px;
}
.yc-page__body > :deep(*) {
  max-width: 920px;
}
.yc-page__menu {
  display: none;
}
.yc-iconbtn {
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: var(--yc-text-2);
  cursor: pointer;
}
.yc-iconbtn:hover {
  background: var(--yc-surface-2);
}

@media (max-width: 900px) {
  .yc-page__bar {
    padding: 0 10px;
  }
  .yc-page__menu {
    display: grid;
  }
  .yc-page__bar .yc-btn span {
    display: none;
  }
  .yc-page__body {
    padding: 16px 14px 32px;
  }
}
</style>
