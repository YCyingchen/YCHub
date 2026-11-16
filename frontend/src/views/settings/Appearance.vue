<template>
  <div class="yc-appearance">
    <section class="yc-panel">
      <div class="yc-panel__head">
        <h2>主题</h2>
        <p>选择界面的明暗外观</p>
      </div>
      <div class="yc-themes">
        <button
          v-for="theme in themes"
          :key="theme.id"
          class="yc-theme"
          :class="[`is-${theme.id}`, { 'is-active': currentTheme === theme.id }]"
          @click="selectTheme(theme.id)"
        >
          <span class="yc-theme__preview">
            <span class="yc-theme__side" />
            <span class="yc-theme__main">
              <span class="yc-theme__bar" />
              <span class="yc-theme__line" />
              <span class="yc-theme__line short" />
            </span>
          </span>
          <span class="yc-theme__label">{{ theme.label }}</span>
        </button>
      </div>
    </section>

    <section class="yc-panel">
      <div class="yc-panel__head">
        <h2>强调色</h2>
        <p>按钮、选中态与链接使用这个颜色</p>
      </div>
      <div class="yc-accents">
        <button
          v-for="color in accents"
          :key="color"
          class="yc-accent"
          :class="{ 'is-active': yc.accent === color }"
          :style="{ '--swatch': color }"
          :title="color"
          @click="yc.setAccent(color)"
        />
      </div>
    </section>

    <section class="yc-panel">
      <div class="yc-panel__head">
        <h2>显示密度</h2>
        <p>控制列表行的间距</p>
      </div>
      <div class="yc-segment">
        <button
          v-for="item in densities"
          :key="item.id"
          class="yc-segment__btn"
          :class="{ 'is-active': yc.density === item.id }"
          @click="yc.setDensity(item.id)"
        >
          {{ item.label }}
        </button>
      </div>
    </section>

    <section class="yc-panel">
      <div class="yc-panel__head">
        <h2>背景</h2>
        <p>上传一张图片作为内容区壁纸，支持 PNG / JPG / WebP</p>
      </div>
      <div class="yc-wallpaper">
        <div class="yc-wallpaper__thumb" :class="{ 'is-empty': !wallpaper }">
          <img v-if="wallpaper" :src="wallpaper" alt="当前壁纸" />
          <YcIcon v-else name="image" :size="26" />
        </div>
        <div class="yc-wallpaper__meta">
          <p class="yc-wallpaper__title">
            {{ wallpaper ? "自定义壁纸" : "还没有上传壁纸" }}
          </p>
          <p class="yc-wallpaper__hint">
            {{
              wallpaper
                ? "壁纸按屏幕尺寸压缩后保存在本机"
                : "PNG / JPG / WebP，单张不超过 10 MB"
            }}
          </p>
          <div class="yc-wallpaper__actions">
            <button class="yc-btn" @click="pickWallpaper">
              <YcIcon name="upload" :size="15" />
              选择图片
            </button>
            <button
              v-if="wallpaper"
              class="yc-btn yc-btn--ghost yc-btn--danger"
              @click="removeWallpaper"
            >
              移除
            </button>
          </div>
        </div>
      </div>

      <div class="yc-blur">
        <div class="yc-blur__row">
          <span>背景模糊</span>
          <span class="yc-muted">{{ blur }} px</span>
        </div>
        <input
          v-model.number="blur"
          type="range"
          min="0"
          max="24"
          step="1"
          :disabled="!wallpaper"
          @change="saveBlur"
        />
      </div>

      <input
        ref="fileInput"
        type="file"
        accept="image/png,image/jpeg,image/webp"
        class="yc-hidden-input"
        @change="onFile"
      />
    </section>

    <p class="yc-appearance__note">
      外观设置保存在这台设备上，不会同步到其他设备。
    </p>
  </div>
</template>

<script setup lang="ts">
import { getMediaPreference, setTheme } from "@/utils/theme";
import { useYcStore } from "@/stores/yc";
import { inject, ref } from "vue";
import YcIcon from "@/components/yc/YcIcon.vue";

const $showSuccess = inject<(message: string) => void>("$showSuccess")!;
const $showError = inject<(message: string) => void>("$showError")!;

const yc = useYcStore();

const themes = [
  { id: "light", label: "浅色" },
  { id: "dark", label: "深色" },
  { id: "system", label: "跟随系统" },
];
const accents = [
  "#4f6bff",
  "#12b886",
  "#8b5cf6",
  "#f59f00",
  "#e5484d",
  "#6b7280",
];
const densities = [
  { id: "compact", label: "紧凑" },
  { id: "cozy", label: "标准" },
  { id: "comfortable", label: "宽松" },
] as const;

const currentTheme = ref(localStorage.getItem("ychub.theme") || "light");
const wallpaper = ref(localStorage.getItem("ychub.wallpaper") || "");
const blur = ref(Number(localStorage.getItem("ychub.blur") ?? 12));
const fileInput = ref<HTMLInputElement | null>(null);

const applyWallpaper = () => {
  const root = document.documentElement;
  root.style.setProperty(
    "--yc-wallpaper",
    wallpaper.value ? `url("${wallpaper.value}")` : "none"
  );
  root.style.setProperty("--yc-wall-blur", `${blur.value}px`);
};

const selectTheme = (id: string) => {
  currentTheme.value = id;
  localStorage.setItem("ychub.theme", id);
  setTheme((id === "system" ? getMediaPreference() : id) as UserTheme);
};

const pickWallpaper = () => fileInput.value?.click();

const removeWallpaper = () => {
  wallpaper.value = "";
  localStorage.removeItem("ychub.wallpaper");
  applyWallpaper();
  $showSuccess("已移除背景壁纸");
};

const saveBlur = () => {
  localStorage.setItem("ychub.blur", String(blur.value));
  applyWallpaper();
};

const onFile = (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = "";
  if (!file) return;

  if (file.size > 10 * 1024 * 1024) {
    $showError("图片超过 10 MB，请先压缩后再上传");
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      const maxWidth = 1600;
      const scale = Math.min(1, maxWidth / img.width);
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const data = canvas.toDataURL("image/jpeg", 0.82);
      if (data.length > 2_400_000) {
        $showError("图片压缩后仍然过大，请换一张更小的图片");
        return;
      }
      wallpaper.value = data;
      try {
        localStorage.setItem("ychub.wallpaper", data);
        applyWallpaper();
        $showSuccess("壁纸已保存到本机");
      } catch {
        $showError("浏览器存储空间不足，壁纸未能保存");
      }
    };
    img.src = reader.result as string;
  };
  reader.readAsDataURL(file);
};
</script>

<style scoped>
.yc-appearance {
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

.yc-themes {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}
.yc-theme {
  border: 1px solid var(--yc-border);
  border-radius: 12px;
  background: var(--yc-surface);
  padding: 8px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 150px;
  font-family: inherit;
}
.yc-theme.is-active {
  border-color: var(--yc-accent);
  box-shadow: 0 0 0 3px var(--yc-accent-soft);
}
.yc-theme__preview {
  display: flex;
  height: 72px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--yc-border);
  background: #f5f6f8;
}
.yc-theme__side {
  width: 34%;
  background: #ffffff;
  border-right: 1px solid #e6e8ec;
}
.yc-theme__main {
  flex: 1;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.yc-theme__bar {
  height: 6px;
  border-radius: 3px;
  background: #e6e8ec;
}
.yc-theme__line {
  height: 5px;
  border-radius: 3px;
  background: #eef0f3;
}
.yc-theme__line.short {
  width: 60%;
}
.yc-theme.is-dark .yc-theme__preview {
  background: #111318;
  border-color: #2a2f3a;
}
.yc-theme.is-dark .yc-theme__side {
  background: #191c22;
  border-color: #2a2f3a;
}
.yc-theme.is-dark .yc-theme__bar {
  background: #363c49;
}
.yc-theme.is-dark .yc-theme__line {
  background: #2a2f3a;
}
.yc-theme.is-system .yc-theme__preview {
  background: linear-gradient(90deg, #f5f6f8 50%, #111318 50%);
}
.yc-theme.is-system .yc-theme__side {
  background: linear-gradient(90deg, #fff 50%, #191c22 50%);
}
.yc-theme__label {
  font-size: 12.5px;
  color: var(--yc-text-2);
  text-align: center;
}

.yc-accents {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}
.yc-accent {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: 0;
  background: var(--swatch);
  cursor: pointer;
  position: relative;
  transition: transform 0.15s ease;
}
.yc-accent:hover {
  transform: scale(1.06);
}
.yc-accent.is-active::after {
  content: "";
  position: absolute;
  inset: -5px;
  border-radius: 50%;
  border: 2px solid var(--swatch);
}

.yc-segment {
  display: inline-flex;
  padding: 3px;
  gap: 3px;
  border: 1px solid var(--yc-border);
  border-radius: 10px;
  background: var(--yc-surface-2);
}
.yc-segment__btn {
  min-width: 76px;
  height: 32px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: var(--yc-text-2);
  font-family: inherit;
  font-size: 12.5px;
  cursor: pointer;
}
.yc-segment__btn.is-active {
  background: var(--yc-surface);
  color: var(--yc-accent);
  font-weight: 600;
  box-shadow: var(--yc-shadow-sm);
}

.yc-wallpaper {
  display: flex;
  gap: 14px;
  align-items: center;
}
.yc-wallpaper__thumb {
  width: 120px;
  height: 68px;
  border-radius: 10px;
  overflow: hidden;
  background: var(--yc-type-image);
  color: var(--yc-type-image-fg);
  display: grid;
  place-items: center;
  flex: none;
  border: 1px solid var(--yc-border);
}
.yc-wallpaper__thumb.is-empty {
  background: var(--yc-surface-2);
  color: var(--yc-muted);
}
.yc-wallpaper__thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.yc-wallpaper__meta {
  min-width: 0;
}
.yc-wallpaper__title {
  margin: 0 0 4px;
  font-size: 13px;
  color: var(--yc-text);
}
.yc-wallpaper__hint {
  margin: 0 0 10px;
  font-size: 11.5px;
  color: var(--yc-muted);
}
.yc-wallpaper__actions {
  display: flex;
  gap: 8px;
}

.yc-blur {
  margin-top: 18px;
  padding-top: 16px;
  border-top: 1px solid var(--yc-border);
}
.yc-blur__row {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: var(--yc-text-2);
  margin-bottom: 8px;
}
.yc-blur input[type="range"] {
  width: 100%;
  accent-color: var(--yc-accent);
}
.yc-hidden-input {
  display: none;
}

.yc-appearance__note {
  margin: 4px 0 0;
  font-size: 11.5px;
  color: var(--yc-muted);
}

@media (max-width: 620px) {
  .yc-theme {
    width: calc(50% - 6px);
  }
  .yc-wallpaper {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
