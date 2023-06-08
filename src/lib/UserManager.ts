import type { CreatorHubServer } from "#lib/Server.js";
import { Content } from "#structures/Content.js";
import { Utils } from "#lib/utils.js";
import type { Session as iSession, User as iUser } from "@prisma/client";
import { Logger } from "@snowcrystals/icicle";
import { bold } from "colorette";
import MeasurePerformance from "./decorators/MeasurePerformance.js";
import { User } from "#structures/User.js";
import { Session } from "#structures/Session.js";
import DiscordOauth2 from "discord-oauth2";
import { CronJob } from "cron";

export class UserManager {
	/** A collection of all the registered users */
	public readonly users: Map<string, User> = new Map();

	/** A collection of all the registered sessions */
	public readonly sessions: Map<string, Session> = new Map();

	/** The server instance that is running the back-end api */
	public readonly server: CreatorHubServer;

	/** The logger instance for the Content Manager */
	public readonly logger = new Logger({ name: "User Manager", level: Utils.getLoggerLevel() });

	/** Cronjob responsible for sweeping expired sessions */
	public sweeper!: CronJob;

	/** Discord Oauth2 handler */
	public readonly discordOauth2 = new DiscordOauth2({
		clientId: process.env.DISCORD_CLIENT_ID,
		clientSecret: process.env.DISCORD_CLIENT_SECRET,
		redirectUri: process.env.DISCORD_CLIENT_REDIRECT_URL,
		credentials: Buffer.from(`${process.env.DISCORD_CLIENT_ID}:${process.env.DISCORD_CLIENT_SECRET}`).toString("base64")
	});

	public constructor(server: CreatorHubServer) {
		this.server = server;
	}

	public toString() {
		return "UserManager";
	}

	/** Loads all the data from the PostgreSQL database -> exists with code 1 if the process fails */
	@MeasurePerformance({ async: true })
	public async load() {
		const users = await this.getAllUsers();
		const sessions = await this.getAllSessions();

		this.sweeper = new CronJob("0 */6 * * *", this.sweepSessions.bind(this));
		this.sweeper.start();

		this.logger.debug(`Retrieved ${bold(users.length)} users and ${bold(sessions.length)} sessions`);

		for (const user of users) {
			const userSessions = sessions.filter((session) => session.userId === user.userId);
			const bookmarks = user.bookmarks.map((id) => this.server.contentManager.content.get(id)).filter(Boolean) as Content[];
			const recent = user.bookmarks.map((id) => this.server.contentManager.content.get(id)).filter(Boolean) as Content[];
			const instance = new User({ ...user, sessions: userSessions }, bookmarks, recent);

			this.users.set(instance.userId, instance);
			[...instance.sessions.values()].forEach((session) => this.sessions.set(session.token, session));
		}

		this.logger.info("Initiation complete.");
	}

	/**
	 * Handles the oauth2 and returns the authenticated Discord user
	 * @param code The code from the Discord oauth2 flow
	 */
	public async getUserFromOauth2(code: string) {
		const tokens = await this.discordOauth2.tokenRequest({ grantType: "authorization_code", scope: ["identify"], code });
		const user = await this.discordOauth2.getUser(tokens.access_token);
		await this.discordOauth2.revokeToken(tokens.access_token);

		return user;
	}

	/**
	 * Creates a new session for the authenticated user
	 * @param userId The userId of the authenticated user
	 * @param username The username of the authenticated user
	 * @returns
	 */
	public async authenticateUser(userId: string, username: string) {
		let user = this.users.get(userId);
		if (user && user.username !== username) await user.updateUsername(username, this.server.prisma);
		else if (!user) {
			const userData = await this.server.prisma.user.create({ data: { createdAt: new Date(), userId, username } });
			user = new User({ ...userData, sessions: [] }, [], []);

			this.users.set(user.userId, user);
		}

		const session = await user.createSession(this.server.prisma);
		const sessionInstance = new Session(session.session, user);
		this.sessions.set(session.session.token, sessionInstance);
		user.sessions.set(session.session.token, sessionInstance);

		return session.sessionCookie;
	}

	/**
	 * Destroys an user session
	 * @param sessionToken The session to destroy
	 */
	public async deleteSession(sessionToken: string) {
		const session = this.sessions.get(sessionToken);
		if (!session) return;

		session.user.sessions.delete(sessionToken);
		this.sessions.delete(sessionToken);

		await this.server.prisma.session.delete({ where: { token: sessionToken } });
	}

	/** Returns the list of available sessions -> exits with code 1 if the process fails */
	private async getAllSessions() {
		const onReject = (error: any) => {
			this.logger.fatal(`Unable to retrieve the list of sessions: `, error);
			process.exit(1);
		};

		return new Promise<iSession[]>((res) => this.server.prisma.session.findMany().then(res).catch(onReject));
	}

	/** Returns the list of available users -> exits with code 1 if the process fails */
	private async getAllUsers() {
		const onReject = (error: any) => {
			this.logger.fatal(`Unable to retrieve the list of users: `, error);
			process.exit(1);
		};

		return new Promise<iUser[]>((res) => this.server.prisma.user.findMany().then(res).catch(onReject));
	}

	/** Checks and sweeps expired sessions */
	private async sweepSessions() {
		const sessions = await this.server.prisma.session.findMany({ where: { expirationDate: { lte: new Date() } } });
		for await (const session of sessions) {
			this.sessions.delete(session.token);

			const user = this.users.get(session.userId ?? "");
			if (user) user.sessions.delete(session.token);
		}

		await this.server.prisma.session.deleteMany({ where: { token: { in: sessions.map((session) => session.token) } } });
	}
}
