export type YcKind =
  | "folder"
  | "image"
  | "video"
  | "audio"
  | "doc"
  | "zip"
  | "pdf"
  | "file";

export interface YcTypeInfo {
  kind: YcKind;
  icon: string;
  label: string;
}

const ARCHIVE = [
  "zip",
  "rar",
  "7z",
  "tar",
  "gz",
  "tgz",
  "bz2",
  "xz",
  "zst",
  "iso",
  "cab",
];
const IMAGE = [
  "png",
  "jpg",
  "jpeg",
  "gif",
  "webp",
  "svg",
  "bmp",
  "avif",
  "heic",
  "tif",
  "tiff",
  "ico",
];
const VIDEO = ["mp4", "mkv", "mov", "avi", "webm", "flv", "wmv", "m4v", "ts"];
const AUDIO = ["mp3", "flac", "wav", "m4a", "aac", "ogg", "opus", "wma", "ape"];
const DOC = [
  "md",
  "txt",
  "doc",
  "docx",
  "xls",
  "xlsx",
  "ppt",
  "pptx",
  "csv",
  "json",
  "yaml",
  "yml",
  "go",
  "js",
  "ts",
  "vue",
  "html",
  "css",
  "sh",
  "log",
];

export function extensionOf(name: string): string {
  const i = name.lastIndexOf(".");
  if (i <= 0 || i === name.length - 1) return "";
  return name.slice(i + 1).toLowerCase();
}

export function fileType(item: {
  isDir?: boolean;
  type?: string;
  extension?: string;
  name?: string;
}): YcTypeInfo {
  if (item.isDir) return { kind: "folder", icon: "folder", label: "文件夹" };

  const ext = (item.extension || extensionOf(item.name || ""))
    .replace(/^\./, "")
    .toLowerCase();
  const type = (item.type || "").toLowerCase();

  if (type === "image" || IMAGE.includes(ext))
    return { kind: "image", icon: "image", label: "图片" };
  if (type === "video" || VIDEO.includes(ext))
    return { kind: "video", icon: "video", label: "视频" };
  if (type === "audio" || AUDIO.includes(ext))
    return { kind: "audio", icon: "audio", label: "音频" };
  if (type === "pdf" || ext === "pdf")
    return { kind: "pdf", icon: "pdf", label: "PDF" };
  if (ARCHIVE.includes(ext))
    return { kind: "zip", icon: "archive", label: "压缩包" };
  if (DOC.includes(ext) || type === "text" || type === "textImmutable")
    return { kind: "doc", icon: "file-text", label: "文档" };

  return { kind: "file", icon: "file", label: ext ? ext.toUpperCase() : "文件" };
}

/** 路径末段名称，用于面包屑之外的展示 */
export function baseName(path: string): string {
  if (!path) return "";
  const clean = path.replace(/\/+$/, "");
  const i = clean.lastIndexOf("/");
  return i === -1 ? clean : clean.slice(i + 1);
}

/** 8 进制权限，如 644 */
export function modeString(mode?: number): string {
  if (typeof mode !== "number" || mode <= 0) return "—";
  return (mode & 0o777).toString(8).padStart(3, "0");
}

/** 路径解码并去掉 /files 前缀 */
export function displayPath(path?: string): string {
  if (!path) return "/";
  let p = path;
  try {
    p = decodeURIComponent(p);
  } catch {
    /* 保留原始值 */
  }
  p = p.replace(/^\/files/, "");
  return p || "/";
}

export type YcFilterKind =
  | "all"
  | "folder"
  | "image"
  | "video"
  | "audio"
  | "doc"
  | "archive";

export const filterOptions: { id: YcFilterKind; label: string }[] = [
  { id: "all", label: "全部" },
  { id: "folder", label: "文件夹" },
  { id: "image", label: "图片" },
  { id: "video", label: "视频" },
  { id: "audio", label: "音频" },
  { id: "doc", label: "文档" },
  { id: "archive", label: "压缩包" },
];

export function matchesFilter(
  item: { isDir?: boolean; type?: string; extension?: string; name?: string },
  kind: YcFilterKind
): boolean {
  if (kind === "all") return true;
  const t = fileType(item).kind;
  if (kind === "folder") return t === "folder";
  if (kind === "doc") return t === "doc" || t === "pdf";
  if (kind === "archive") return t === "zip";
  return t === kind;
}
