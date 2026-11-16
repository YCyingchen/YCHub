import { fetchJSON } from "./utils";

export async function list(): Promise<VolumeInfo[]> {
  return fetchJSON<VolumeInfo[]>("/api/volumes");
}
