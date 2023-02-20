import { CronJob } from "cron";
import type { UserManager } from "./UserManager.js";

export class UserSessions {
	public sweeper!: CronJob;

	public constructor(public userManager: UserManager) {}

	/**
	 * Starts the UserSessions handler
	 */
	public start() {
		this.sweeper = new CronJob("0 */6 * * *", this.sweepSessions.bind(this));
		this.sweeper.start();
	}

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

	/**
	 * Checks and sweeps expired sessions
	 * @private
	 */
	private async sweepSessions() {
		const sessions = await this.userManager.server.prisma.session.findMany({ where: { expirationDate: { lte: new Date() } } });
		for await (const session of sessions) {
			await this.userManager.oauth2.revokeToken(this.userManager.server.jwt.decrypt(session.accessToken));
		}

		await this.userManager.server.prisma.session.deleteMany({ where: { token: { in: sessions.map((session) => session.token) } } });
	}
}
