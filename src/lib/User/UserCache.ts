import type { Oauth2AccessTokenResponseBody } from "../discord/Oauth2.js";
import { Jwt } from "../jwt/index.js";
import type { UserManager } from "./UserManager.js";

export class UserCache {
	public constructor(public userManager: UserManager) {}

	/**
	 * Handles the incoming access token data to return a valid session
	 * @param token The token data from the oauth2 flow
	 */
	public async handleToken(token: Oauth2AccessTokenResponseBody) {
		const expirationDate = new Date(Date.now() + 8.035e9);
		const refreshDate = new Date(Date.now() + token.expires_in - 5e3);

		const { id, username } = await this.userManager.oauth2.getUser(token.access_token);
		const session = await this.userManager.server.prisma.session.create({
			data: {
				token: Jwt.randomToken(),
				accessToken: this.userManager.server.jwt.encrypt(token.access_token),
				refreshToken: this.userManager.server.jwt.encrypt(token.refresh_token),
				refreshDate,
				expirationDate,
				User: { connectOrCreate: { where: { userId: id }, create: { createdAt: new Date(), userId: id, username } } }
			}
		});

		const user = await this.userManager.server.prisma.user.update({ where: { userId: id }, data: { username }, include: { sessions: true } });
		this.userManager.server.data.users.set(user.userId, user);

		return this.userManager.server.jwt.sign({ session: session.token, userId: session.userId! }, 8.053e9);
	}

	/**
	 * Adds the footageId to the recent list and makes sure it stays 100 in length
	 * @param userId The id of the user
	 * @param footageId The id of the footage you want to add
	 */
	public async handleView(userId: string, footageId: string) {
		const user = await this.userManager.server.prisma.user.findFirst({ where: { userId } });
		if (!user) return;

		const newUser = await this.userManager.server.prisma.user.update({
			where: { userId },
			data: { recent: { set: [footageId, ...(user.recent ?? [])].slice(0, 100) } },
			include: { sessions: true }
		});
		this.userManager.server.data.users.set(newUser.userId, newUser);
	}

	/**
	 * Deletes footageId from views and bookmarks list
	 * @param footageId The id of the footage you want to remove
	 */
	public async handleDeleteFootage(footageId: string) {
		const users = await this.userManager.server.prisma.user.findMany();
		const requests = [];

		for (const user of users) {
			const req = this.userManager.server.prisma.user.update({
				where: { userId: user.userId },
				data: { bookmarks: user.bookmarks.filter((b) => b !== footageId), recent: user.recent.filter((r) => r !== footageId) }
			});

			requests.push(req);
		}

		await this.userManager.server.prisma.$transaction(requests);
		const updatedUsers = await this.userManager.server.prisma.user.findMany({ include: { sessions: true } });
		updatedUsers.forEach((u) => this.userManager.server.data.users.set(u.userId, u));
	}
}
