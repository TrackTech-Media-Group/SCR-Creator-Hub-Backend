import type { CreatorHubServer } from "#lib/Server.js";
import { Content } from "#structures/Content.js";
import { Utils } from "#lib/utils.js";
import type { Session as iSession, User as iUser } from "@prisma/client";
import { Logger } from "@snowcrystals/icicle";
import { bold } from "colorette";
import MeasurePerformance from "./decorators/MeasurePerformance.js";
import { User } from "#structures/User.js";
import type { Session } from "#structures/Session.js";

export class UserManager {
	/** A collection of all the registered users */
	public readonly users: Map<string, User> = new Map();

	/** A collection of all the registered sessions */
	public readonly sessions: Map<string, Session> = new Map();

	/** The server instance that is running the back-end api */
	public readonly server: CreatorHubServer;

	/** The logger instance for the Content Manager */
	public readonly logger = new Logger({ name: "User Manager", level: Utils.getLoggerLevel() });

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
}
