import type { User as iUser, Session as iSession, PrismaClient } from "@prisma/client";
import type { Content } from "./Content.js";
import { Session } from "./Session.js";
import { Utils } from "#lib/utils.js";

export class User implements Omit<iUser, "bookmarks" | "recent"> {
	/** The unique identifier for this user */
	public readonly userId: string;

	/** The username of this user */
	public username: string;

	/** The recently viewed content */
	public recent: Content[];

	/** The bookmarked content */
	public bookmarks: Content[];

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

	public toJSON() {
		return {
			userId: this.userId,
			username: this.username,
			createdAt: this.createdAt,
			bookmarks: this.bookmarks.map((bookmark) => bookmark.toJSON()),
			recent: this.recent.map((recent) => recent.toJSON())
		};
	}

	/**
	 * Creates a new session
	 * @param prisma The prisma client instance
	 */
	public async createSession(prisma: PrismaClient) {
		const expirationDate = new Date(Date.now() + 8.053e9);
		const token = Utils.generateSessionToken(this.userId, 8.053e9);

		const session = await prisma.session.create({
			data: { userId: this.userId, token: token.token, expirationDate }
		});

		return {
			sessionCookie: token.session,
			session
		};
	}

	/**
	 * Updates the username
	 * @param username The new username
	 * @param prisma The prisma client instance
	 */
	public async updateUsername(username: string, prisma: PrismaClient) {
		await prisma.user.update({ where: { userId: this.userId }, data: { username } });
		this.username = username;
	}

	/**
	 * (Un)bookmarks a content item
	 * @param item The item to (un)bookmark
	 * @param prisma The prisma client instance
	 */
	public async toggleBookmark(item: Content, prisma: PrismaClient) {
		const bookmarks = this.bookmarks.some((content) => content.id === item.id)
			? this.bookmarks.filter((content) => content.id !== item.id)
			: [...this.bookmarks, item];

		await prisma.user.update({
			where: { userId: this.userId },
			data: { bookmarks: bookmarks.map((content) => content.id) }
		});

		this.bookmarks = bookmarks;
		return bookmarks.includes(item);
	}
}
