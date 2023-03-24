import type { Download, Footage, Session, Tag, User } from "@prisma/client";
import type Server from "../Server.js";

export class DataHandler {
	public footage: (Footage & { downloads: Download[] })[] = [];
	public users = new Map<string, User & { sessions: Session[] }>();
	public tags: Tag[] = [];

	public constructor(public server: Server) {}

	public async start() {
		this.footage = await this.server.prisma.footage.findMany({ include: { downloads: true } });
		this.tags = await this.server.prisma.tag.findMany();

		const users = await this.server.prisma.user.findMany({ include: { sessions: true } });
		users.forEach((u) => this.users.set(u.userId, u));
	}

	/**
	 * Gets the session (if any) of the session token and userId from a JWT token
	 * @param token The session token from the JWT token
	 * @param userId The userId from the JWT token
	 */
	public getSession(token: string, userId: string) {
		const user = [...this.server.data.users.values()].find((u) => u.sessions.find((s) => s.token === token && s.userId === userId));
		if (!user) return null;

		const session = user.sessions.find((s) => s.token === token && s.userId === userId);
		if (!session) return null;
		return {
			user,
			session
		};
	}
}
