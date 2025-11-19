export function normalizeTag(tag: string) {
  return tag.startsWith("#") ? tag.slice(1).toLowerCase() : tag.toLowerCase()
}

export function toTagHref(tag: string) {
  return `/search?q=%23${encodeURIComponent(normalizeTag(tag))}&type=all`
}
