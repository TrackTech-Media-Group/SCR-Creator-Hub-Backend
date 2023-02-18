import { PrismaClient } from "@prisma/client";
import { Logger, LogLevel } from "@snowcrystals/icicle";
import { bold } from "colorette";
import express, { Express } from "express";
import { ApiHandler } from "./Api/index.js";
import Config from "./config/index.js";
import { Jwt } from "./jwt/Jwt.js";
import { UserCache } from "./User/UserCache.js";

export default class Server {
	public server: Express;
	public logger: Logger;
	public prisma: PrismaClient;

	public config: Config;
	public api: ApiHandler;

	public jwt: Jwt;
	public userCache: UserCache;

	public constructor() {
		this.server = express();
		this.logger = new Logger({ level: LogLevel.Debug });
		this.prisma = new PrismaClient();

		this.config = new Config(this);
		this.api = new ApiHandler(this);

		this.jwt = new Jwt(this);
		this.userCache = new UserCache(this);
	}

	public async start() {
		await this.config.start();
		await this.api.start();
		await this.prisma.$connect();

		this.jwt.load();
		this.userCache.start();

		this.server.listen(this.config.config.port, this.startup.bind(this));
	}

	private startup() {
		this.logger.info(`Server is running on port ${bold(this.config.config.port)}: http://localhost:${this.config.config.port}`);
	}
}
