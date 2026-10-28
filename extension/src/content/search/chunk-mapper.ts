// Lưu trữ ánh xạ giữa chunkId (string) và DOM Element
export const chunkMap = new Map<string, HTMLElement>();

export function clearChunkMap() {
  chunkMap.clear();
}