<template>
  <div>
    <h1 class="sr-only">{{ name }}</h1>
    <router-view></router-view>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import { useI18n } from "vue-i18n";
import { setHtmlLocale } from "./i18n";
import { getMediaPreference, getTheme, setTheme } from "./utils/theme";
import { name } from "./utils/constants";
import { useYcStore } from "./stores/yc";

const { locale } = useI18n();

const yc = useYcStore();

const storedTheme = localStorage.getItem("ychub.theme");
const userTheme = ref<UserTheme>(
  storedTheme === "dark" || storedTheme === "light"
    ? storedTheme
    : getTheme() || getMediaPreference()
);

onMounted(() => {
  setTheme(userTheme.value);
  yc.applyAppearance();

  const wall = localStorage.getItem("ychub.wallpaper");
  const blur = localStorage.getItem("ychub.blur") ?? "12";
  document.documentElement.style.setProperty(
    "--yc-wallpaper",
    wall ? `url("${wall}")` : "none"
  );
  document.documentElement.style.setProperty("--yc-wall-blur", `${blur}px`);
  setHtmlLocale(locale.value);
  // this might be null during HMR
  const loading = document.getElementById("loading");
  loading?.classList.add("done");

  setTimeout(function () {
    loading?.parentNode?.removeChild(loading);
  }, 200);
});

// handles ltr/rtl changes
watch(locale, (newValue) => {
  newValue && setHtmlLocale(newValue);
});
</script>

<style scoped>
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style>
