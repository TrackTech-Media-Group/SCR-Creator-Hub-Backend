import type { User as iUser, Session as iSession } from "@prisma/client";
import type { Content } from "./Content.js";
import { Session } from "./Session.js";

export class User implements Omit<iUser, "bookmarks" | "recent"> {
	/** The unique identifier for this user */
	public readonly userId: string;

	/** The username of this user */
	public username: string;

	/** The recently viewed content */
	public readonly recent: Content[];

	/** The bookmarked content */
	public readonly bookmarks: Content[];

	/** The date the account was created */
	public readonly createdAt: Date;

	/** The valid login sessions */
	public readonly sessions = new Map<string, Session>();

	public constructor(data: iUser & { sessions: iSession[] }, bookmarks: Content[], recent: Content[]) {
		this.userId = data.userId;
		this.username = data.username;
		this.createdAt = data.createdAt;
		this.recent = recent;
		this.bookmarks = bookmarks;

		data.sessions.forEach((session) => this.sessions.set(session.token, new Session(session, this)));
	}
}
