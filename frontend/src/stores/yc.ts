import { defineStore } from "pinia";

const KEY = "ychub.ui.v1";

type YcViewMode = "list" | "grid" | "dual" | "columns";
type YcDensity = "compact" | "cozy" | "comfortable";
type YcIconSize = "small" | "medium" | "large";
type YcFilterKind =
  | "all"
  | "folder"
  | "image"
  | "video"
  | "audio"
  | "doc"
  | "archive";

interface YcEntry {
  path: string;
  name: string;
}

interface Persisted {
  favorites: YcEntry[];
  recent: YcEntry[];
  viewMode: YcViewMode;
  detailsOpen: boolean;
  accent: string;
  density: YcDensity;
  iconSize: YcIconSize;
  grouped: boolean;
  filterKind: YcFilterKind;
  orders: Record<string, string[]>;
}

const DEFAULT_ACCENT = "#4f6bff";

function load(): Persisted {
  const fallback: Persisted = {
    favorites: [],
    recent: [],
    viewMode: "list",
    detailsOpen: true,
    accent: DEFAULT_ACCENT,
    density: "cozy",
    iconSize: "medium",
    grouped: true,
    filterKind: "all",
    orders: {},
  };
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return fallback;
    const data = JSON.parse(raw) as Partial<Persisted>;
    return {
      favorites: Array.isArray(data.favorites) ? data.favorites : [],
      recent: Array.isArray(data.recent) ? data.recent : [],
      viewMode: data.viewMode === "grid" ? "grid" : "list",
      detailsOpen: data.detailsOpen !== false,
      accent: typeof data.accent === "string" ? data.accent : DEFAULT_ACCENT,
      density:
        data.density === "compact" || data.density === "comfortable"
          ? data.density
          : "cozy",
      iconSize:
        data.iconSize === "small" || data.iconSize === "large"
          ? data.iconSize
          : "medium",
      grouped: data.grouped !== false,
      filterKind: data.filterKind ?? "all",
      orders:
        data.orders && typeof data.orders === "object" ? data.orders : {},
    };
  } catch {
    return fallback;
  }
}

/** 把强调色与密度写到根元素，CSS 变量统一生效 */
export function applyYcAppearance(accent: string, density: YcDensity) {
  const root = document.documentElement;
  root.style.setProperty("--yc-accent", accent);
  root.style.setProperty("--yc-accent-hover", accent);
  root.style.setProperty("--blue", accent);
  root.dataset.ycDensity = density;
}

export const useYcStore = defineStore("yc", {
  state: () => load(),
  getters: {
    isFavorite: (state) => (path: string) =>
      state.favorites.some((f) => f.path === path),
  },
  actions: {
    persist() {
      const data: Persisted = {
        favorites: this.favorites,
        recent: this.recent,
        viewMode: this.viewMode,
        detailsOpen: this.detailsOpen,
        accent: this.accent,
        density: this.density,
        iconSize: this.iconSize,
        grouped: this.grouped,
        filterKind: this.filterKind,
        orders: this.orders,
      };
      try {
        localStorage.setItem(KEY, JSON.stringify(data));
      } catch {
        /* 存储满或被禁用时静默失败 */
      }
    },
    applyAppearance() {
      applyYcAppearance(this.accent, this.density);
    },
    setAccent(accent: string) {
      this.accent = accent;
      applyYcAppearance(this.accent, this.density);
      this.persist();
    },
    setDensity(density: YcDensity) {
      this.density = density;
      applyYcAppearance(this.accent, this.density);
      this.persist();
    },
    setViewMode(mode: YcViewMode) {
      this.viewMode = mode;
      this.persist();
    },
    setIconSize(size: YcIconSize) {
      this.iconSize = size;
      this.persist();
    },
    setGrouped(grouped: boolean) {
      this.grouped = grouped;
      this.persist();
    },
    toggleGrouped() {
      this.grouped = !this.grouped;
      this.persist();
    },
    setFilterKind(kind: YcFilterKind) {
      this.filterKind = kind;
      this.persist();
    },
    setOrder(path: string, names: string[]) {
      this.orders = { ...this.orders, [path]: names };
      this.persist();
    },
    clearOrder(path: string) {
      const next = { ...this.orders };
      delete next[path];
      this.orders = next;
      this.persist();
    },
    toggleDetails() {
      this.detailsOpen = !this.detailsOpen;
      this.persist();
    },
    pushRecent(path: string, name: string) {
      if (!path) return;
      const entry = { path, name: name || path };
      this.recent = [
        entry,
        ...this.recent.filter((r) => r.path !== path),
      ].slice(0, 8);
      this.persist();
    },
    toggleFavorite(path: string, name: string) {
      if (!path) return;
      const index = this.favorites.findIndex((f) => f.path === path);
      if (index === -1) {
        this.favorites = [{ path, name: name || path }, ...this.favorites];
      } else {
        this.favorites.splice(index, 1);
      }
      this.persist();
    },
  },
});
