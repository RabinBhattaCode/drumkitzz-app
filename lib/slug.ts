type Sluggable = {
  title?: string
  artist?: string
  embed_url?: string
  video_url?: string
}

const toSlugPart = (value?: string) =>
  (value ?? '')
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

export const slugForItem = (item: Sluggable): string => {
  const parts = [
    toSlugPart(item.title),
    toSlugPart(item.artist),
    toSlugPart(item.video_url || item.embed_url),
  ].filter(Boolean)

  const slug = parts.join('-').replace(/-+/g, '-')
  return slug || 'item'
}
