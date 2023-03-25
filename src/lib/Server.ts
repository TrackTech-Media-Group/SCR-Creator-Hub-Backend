import { PrismaClient } from "@prisma/client";
import { Logger, LogLevel } from "@snowcrystals/icicle";
import { bold } from "colorette";
import express, { Express } from "express";
import { ApiHandler } from "./Api/index.js";
import Config from "./config/index.js";
import { Jwt } from "./jwt/Jwt.js";
import { UserManager } from "./User/UserManager.js";
import cors from "cors";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";
import { MiddlewareHandler } from "./Middleware/Handler.js";
import { DataHandler } from "./Data/DataHandler.js";

export default class Server {
	public server: Express;
	public logger: Logger;
	public prisma: PrismaClient;

	public config: Config;
	public api: ApiHandler;
	public middleware: MiddlewareHandler;

	public data: DataHandler;

	public jwt: Jwt;
	public userManager: UserManager;

	public constructor() {
		this.server = express();
		this.logger = new Logger({ level: LogLevel.Debug });
		this.prisma = new PrismaClient({ log: ["error", "info", "warn"] });

		this.config = new Config(this);
		this.api = new ApiHandler(this);
		this.middleware = new MiddlewareHandler(this);

		this.data = new DataHandler(this);

		this.jwt = new Jwt(this);
		this.userManager = new UserManager(this);
	}

	public async start() {
		this.server.use(
			cors({ credentials: true, origin: ["http://localhost:3000", "https://beta.scrcreate.app", "https://scrcreate.app"] }),
			cookieParser(),
			bodyParser.json()
		);

		await this.config.start();
		await this.middleware.start();
		await this.api.start();
		await this.prisma.$connect();

		await this.data.start();

		this.jwt.load();
		this.userManager.start();

		this.server.listen(this.config.config.port, this.startup.bind(this));
	}

	private startup() {
		this.logger.info(`Server is running on port ${bold(this.config.config.port)}: http://localhost:${this.config.config.port}`);
	}
}
