import { Oauth2, Oauth2AccessTokenResponseBody } from "../discord/Oauth2.js";
import { Jwt } from "../jwt/index.js";
import type Server from "../Server.js";

export class UserCache {
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
	 * Handles the incoming access token data to return a valid session
	 * @param token The token data from the oauth2 flow
	 */
	public async handleToken(token: Oauth2AccessTokenResponseBody) {
		const expirationDate = new Date(Date.now() + 8.035e9);
		const refreshDate = new Date(Date.now() + token.expires_in - 5e3);

		const { id, username } = await this.oauth2.getUser(token.access_token);
		const session = await this.server.prisma.session.create({
			data: {
				token: Jwt.randomToken(),
				accessToken: this.server.jwt.encrypt(token.access_token),
				refreshToken: this.server.jwt.encrypt(token.refresh_token),
				refreshDate,
				expirationDate,
				User: { connectOrCreate: { where: { userId: id }, create: { createdAt: new Date(), userId: id, username } } }
			}
		});

		return this.server.jwt.sign({ session: session.token, userId: session.userId! }, 8.053e9);
	}
}
