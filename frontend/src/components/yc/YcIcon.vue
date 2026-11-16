<template>
  <svg
    class="yc-icon"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    :stroke-width="strokeWidth"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    v-html="inner"
  />
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    name: string;
    size?: number | string;
    strokeWidth?: number | string;
  }>(),
  { size: 20, strokeWidth: 1.7 }
);

const P = (d: string) => `<path d="${d}"/>`;
const C = (cx: number, cy: number, r: number) =>
  `<circle cx="${cx}" cy="${cy}" r="${r}"/>`;
const R = (x: number, y: number, w: number, h: number, rx = 0) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}"/>`;
const L = (x1: number, y1: number, x2: number, y2: number) =>
  `<path d="M${x1} ${y1}L${x2} ${y2}"/>`;

const icons: Record<string, string> = {
  folder: P(
    "M3 7.5A2.5 2.5 0 0 1 5.5 5h3.2c.6 0 1.2.2 1.7.7L12 7.5h6.5A2.5 2.5 0 0 1 21 10v7.5a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 17.5z"
  ),
  home: P("M3.5 10.5 12 3.5l8.5 7M5.5 9.5V20h13V9.5"),
  clock: C(12, 12, 8.5) + P("M12 7.5V12l3 2"),
  star: P(
    "M12 3.6l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z"
  ),
  tag: P(
    "M20.4 13.4l-7 7a1.9 1.9 0 0 1-2.7 0L3.5 13.2V3.5h9.7l7.2 7.2a1.9 1.9 0 0 1 0 2.7z"
  ) + C(8, 8, 1.1),
  share: C(18, 5, 2.6) +
    C(6, 12, 2.6) +
    C(18, 19, 2.6) +
    P("M8.4 10.8l7.2-4.2M8.4 13.2l7.2 4.2"),
  transfer: P("M8 4v13m-3.2-3.2L8 17l3.2-3.2M16 20V7m-3.2 3.2L16 7l3.2 3.2"),
  trash: P(
    "M3.5 6.5h17M9.5 6.5V4h5v2.5M6.5 6.5l.9 12.4a1.6 1.6 0 0 0 1.6 1.6h6a1.6 1.6 0 0 0 1.6-1.6l.9-12.4"
  ),
  settings: C(12, 12, 3.2) +
    P(
      "M19.4 13.5a7.7 7.7 0 0 0 0-3l2-1.5-2-3.4-2.3 1a7.6 7.6 0 0 0-2.6-1.5L14.2 2h-4l-.3 2.5A7.6 7.6 0 0 0 7.3 6l-2.3-1-2 3.4 2 1.5a7.7 7.7 0 0 0 0 3l-2 1.5 2 3.4 2.3-1a7.6 7.6 0 0 0 2.6 1.5l.3 2.5h4l.3-2.5a7.6 7.6 0 0 0 2.6-1.5l2.3 1 2-3.4z"
    ),
  search: C(11, 11, 6.6) + P("M20 20l-4.4-4.4"),
  grid: R(4, 4, 6.6, 6.6, 1.6) +
    R(13.4, 4, 6.6, 6.6, 1.6) +
    R(4, 13.4, 6.6, 6.6, 1.6) +
    R(13.4, 13.4, 6.6, 6.6, 1.6),
  list: P("M4 6.5h16M4 12h16M4 17.5h16"),
  columns: R(3.5, 4.5, 17, 15, 2) + P("M9.2 4.5v15M14.8 4.5v15"),
  "chevron-right": P("M9.5 5.5 16 12l-6.5 6.5"),
  "chevron-left": P("M14.5 5.5 8 12l6.5 6.5"),
  "chevron-down": P("M6 9.5 12 15.5 18 9.5"),
  "chevron-up": P("M6 14.5 12 8.5 18 14.5"),
  "arrow-left": P("M20 12H4m6-6-6 6 6 6"),
  "arrow-right": P("M4 12h16m-6-6 6 6-6 6"),
  upload: P("M12 16V4m-4.5 4.5L12 4l4.5 4.5M4 20h16"),
  download: P("M12 4v12m-4.5-4.5L12 16l4.5-4.5M4 20h16"),
  plus: P("M12 5v14M5 12h14"),
  minus: P("M5 12h14"),
  more: C(5.5, 12, 1.15) + C(12, 12, 1.15) + C(18.5, 12, 1.15),
  edit: P("M4 20h4.2L20 8.2 15.8 4 4 15.8z") + P("M13.8 6l4.2 4.2"),
  x: P("M6 6l12 12M18 6 6 18"),
  info: C(12, 12, 8.6) + P("M12 11v5") + C(12, 8, 0.9),
  eye: P(
    "M2.8 12S6.2 5.8 12 5.8 21.2 12 21.2 12 17.8 18.2 12 18.2 2.8 12 2.8 12z"
  ) + C(12, 12, 3),
  image: R(3.5, 5, 17, 14, 2) +
    C(8.6, 10, 1.5) +
    P("M20.5 17.5 16 13l-3.6 3.6L10.5 15 3.5 19"),
  video: R(3.5, 5, 17, 14, 2) + P("M10.2 9.4v5.2l4.4-2.6z"),
  audio: P("M9 17.5V6.4l9-1.6v11") + C(6.6, 17.8, 2.4) + C(15.6, 15.8, 2.4),
  file: P(
    "M14 3.5H6.8A2.3 2.3 0 0 0 4.5 5.8v12.4a2.3 2.3 0 0 0 2.3 2.3h10.4a2.3 2.3 0 0 0 2.3-2.3V8.5z"
  ) + P("M14 3.5V8.5h5.5"),
  "file-text": P(
    "M14 3.5H6.8A2.3 2.3 0 0 0 4.5 5.8v12.4a2.3 2.3 0 0 0 2.3 2.3h10.4a2.3 2.3 0 0 0 2.3-2.3V8.5z"
  ) +
    P("M14 3.5V8.5h5.5M8 12.5h8M8 16h5.5"),
  archive: P("M3.8 4.5h16.4v4.2H3.8z") +
    R(5.4, 8.7, 13.2, 10.8, 1.4) +
    P("M10 12.4h4"),
  "hard-drive": R(3.2, 5, 17.6, 14, 2) +
    P("M3.2 12.5h17.6") +
    C(7.2, 15.6, 1) +
    C(7.2, 9.2, 1),
  pdf: P(
    "M14 3.5H6.8A2.3 2.3 0 0 0 4.5 5.8v12.4a2.3 2.3 0 0 0 2.3 2.3h10.4a2.3 2.3 0 0 0 2.3-2.3V8.5z"
  ) +
    P("M14 3.5V8.5h5.5") +
    P("M8.4 16.5c1.8-.4 2.4-3.4 1.6-4.2-.7-.7-1.3.6-.4 2.4.9 1.9 2.6 2.9 3.7 2"),
  user: C(12, 8.2, 3.6) + P("M4.8 20.5c.6-3.6 3.6-5.4 7.2-5.4s6.6 1.8 7.2 5.4"),
  logout: P("M9.5 21H5.6A2.1 2.1 0 0 1 3.5 18.9V5.1A2.1 2.1 0 0 1 5.6 3h3.9") +
    P("M16 16.8 20.8 12 16 7.2M20.5 12H9"),
  check: P("M5 12.5 9.6 17 19 7.5"),
  menu: P("M4 7h16M4 12h16M4 17h16"),
  refresh: P("M20 12a8 8 0 1 1-2.4-5.7M20 4.5V10h-5.4"),
  "folder-plus": P(
    "M3 7.5A2.5 2.5 0 0 1 5.5 5h3.2c.6 0 1.2.2 1.7.7L12 7.5h6.5A2.5 2.5 0 0 1 21 10v7.5a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 17.5z"
  ) + P("M12 11.5v5M9.5 14h5"),
  "file-plus": P(
    "M14 3.5H6.8A2.3 2.3 0 0 0 4.5 5.8v12.4a2.3 2.3 0 0 0 2.3 2.3h10.4a2.3 2.3 0 0 0 2.3-2.3V8.5z"
  ) +
    P("M14 3.5V8.5h5.5M12 11.5v5M9.5 14h5"),
  link: P("M10 13.8a3.6 3.6 0 0 0 5.1 0l3-3a3.6 3.6 0 0 0-5.1-5.1L11.6 7") +
    P("M14 10.2a3.6 3.6 0 0 0-5.1 0l-3 3a3.6 3.6 0 0 0 5.1 5.1L12.4 17"),
  star_filled: P("M12 3.6l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z"),
};

const inner = computed(() => icons[props.name] ?? icons.file);
</script>

<style scoped>
.yc-icon {
  display: inline-block;
  flex: none;
  vertical-align: middle;
}
</style>
