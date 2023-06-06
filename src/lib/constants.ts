export type ContentType = "image" | "music" | "video";
export type ContentTypeFilter = ContentType | "all";
export const CONTENT_TYPE_FILTER = ["image", "music", "video", "all"] as const;
