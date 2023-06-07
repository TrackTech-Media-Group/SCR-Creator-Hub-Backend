import { createClient } from "redis";

export type ContentType = "image" | "music" | "video";
export type ContentTypeFilter = ContentType | "all";
export const CONTENT_TYPE_FILTER = ["image", "music", "video", "all"] as const;

export const RedisClient = createClient({
	password: process.env.REDIS_RATELIMIT_CACHE_PASSWORD,
	socket: {
		host: process.env.REDIS_RATELIMIT_CACHE_HOST,
		port: Number(process.env.REDIS_RATELIMIT_CACHE_PORT)
	}
});