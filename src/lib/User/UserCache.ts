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

		return this.userManager.server.jwt.sign({ session: session.token, userId: session.userId! }, 8.053e9);
	}
}
