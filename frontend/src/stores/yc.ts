import { defineStore } from "pinia";

const KEY = "ychub.ui.v1";

type YcViewMode = "list" | "grid";

interface YcEntry {
  path: string;
  name: string;
}

interface Persisted {
  favorites: YcEntry[];
  recent: YcEntry[];
  viewMode: YcViewMode;
  detailsOpen: boolean;
}

function load(): Persisted {
  const fallback: Persisted = {
    favorites: [],
    recent: [],
    viewMode: "list",
    detailsOpen: true,
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
    };
  } catch {
    return fallback;
  }
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
      };
      try {
        localStorage.setItem(KEY, JSON.stringify(data));
      } catch {
        /* 存储满或被禁用时静默失败 */
      }
    },
    setViewMode(mode: YcViewMode) {
      this.viewMode = mode;
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
