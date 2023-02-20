import { Oauth2 } from "../discord/Oauth2.js";
import type Server from "../Server.js";

export class UserSessions {
	public oauth2!: Oauth2;

	public constructor(public server: Server) {}

	public start() {
		this.oauth2 = new Oauth2({
			clientId: this.server.config.config.discord.id,
			clientSecret: this.server.config.config.discord.secret,
			redirectUrl: this.server.config.config.discord.callback
		});
	}

	/**
	 * The deletes all sessions of the specified user
	 * @param userId The user id of the user to delete the sessions from
	 */
	public async deleteSessions(userId: string): Promise<void> {
		const sessions = await this.server.prisma.session.findMany({ where: { userId } });
		for await (const session of sessions) {
			await this.oauth2.revokeToken(this.server.jwt.decrypt(session.accessToken));
		}

		await this.server.prisma.session.deleteMany({ where: { userId } });
	}
}
