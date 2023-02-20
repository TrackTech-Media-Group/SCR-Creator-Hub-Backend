import type { UserManager } from "./UserManager.js";

export class UserSessions {
	public constructor(public userManager: UserManager) {}

	/**
	 * The deletes all sessions of the specified user
	 * @param userId The user id of the user to delete the sessions from
	 */
	public async deleteSessions(userId: string): Promise<void> {
		const sessions = await this.userManager.server.prisma.session.findMany({ where: { userId } });
		for await (const session of sessions) {
			await this.userManager.oauth2.revokeToken(this.userManager.server.jwt.decrypt(session.accessToken));
		}

		await this.userManager.server.prisma.session.deleteMany({ where: { userId } });
	}
}
