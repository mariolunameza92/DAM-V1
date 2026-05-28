// Shared registry so any section can feed items into the image-detail modal
export const _registry = new Map();

export function registerSection(key, items) {
  _registry.set(key, items);
}
