import { Oauth2 } from "../discord/Oauth2.js";
import type Server from "../Server.js";
import { UserCache } from "./UserCache.js";
import { UserSessions } from "./UserSessions.js";

export class UserManager {
	public oauth2!: Oauth2;

	public sessions: UserSessions;
	public cache: UserCache;

	public constructor(public server: Server) {
		this.sessions = new UserSessions(this);
		this.cache = new UserCache(this);
	}

	/**
	 * Starts the UserManager
	 */
	public start() {
		const { callback, id, secret } = this.server.config.config.discord;
		this.oauth2 = new Oauth2({
			clientId: id,
			clientSecret: secret,
			redirectUrl: callback
		});
	}
}
