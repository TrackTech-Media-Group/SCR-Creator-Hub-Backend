import { Server } from "@snowcrystals/highway";
import { ContentManager } from "./ContentManager.js";
import { PrismaClient } from "@prisma/client";
import type { NextFunction, Request, Response } from "express";
import { ApiError } from "#errors/ApiError.js";
import { Logger } from "@snowcrystals/icicle";
import { HttpStatusCode } from "axios";
import { bold } from "colorette";
import cors from "cors";
import { Utils } from "./utils.js";
import { UserManager } from "./UserManager.js";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import { SyncManager } from "./SyncManager.js";

export class CreatorHubServer extends Server {
	/** The manager responsible for all the content on Creator Hub */
	public readonly contentManager: ContentManager = new ContentManager(this);

	/** The manager responsible for all the content on Creator Hub */
	public readonly userManager: UserManager = new UserManager(this);

	/** The manager responsible for syncing the data between the server and database */
	public readonly syncManager: SyncManager = new SyncManager(this);

	/** The bridge between the application and the PostgreSQL database */
	public readonly prisma = new PrismaClient();

	/** The cors instance handling all Cross-Origin headers */
	public readonly cors = cors({ credentials: true, origin: Utils.getCorsOrigins() });

	/** Private logger instance for error handling */
	private logger = new Logger({ name: "Error Handler" });

	public async start() {
		await this.contentManager.load();
		await this.userManager.load();
		await this.prisma.$connect();

		const port = Number(process.env.PORT);
		await this.listen(port, () => new Logger({ name: "Server" }).info(`Running on port ${bold(port)}: http://localhost:${port}`));
	}

	public override async listen(port: number, cb?: () => void) {
		this.express.use(this.cors, bodyParser.json(), cookieParser());

		await this.middlewareHandler.loadAll(this);
		await this.routeHandler.loadAll(this);

		this.express.use(this.handleApiError.bind(this));
		return this.express.listen(port, cb);
	}

	/**
	 * Handles unhandled exceptions
	 * @param error The error that was thrown
	 * @param origin The origin of the error
	 */
	public async unhandledException(error: Error, origin: NodeJS.UncaughtExceptionOrigin) {
		this.logger.error(`${bold(origin)} => `, error);
		await this.syncManager.syncAll();
	}

	private handleApiError(error: any, req: Request, res: Response, next: NextFunction) {
		// Plain call to avoid "un-used" variable ts error -> cannot remove from list due to express error handling requirements
		next;

		if (error instanceof ApiError) {
			if (error.status >= 500) {
				this.logger.error(`${req.method} ${bold(req.path)} => code: ${bold(error.status)} - `, error.errors);
				res.status(error.status).send({ "*": "Internal server error, please try again later." });

				return;
			}

			res.status(error.status).send(error.errors);
			return;
		}

		this.logger.error(`${req.method} ${bold(req.path)} => Unknown error while processing API request: `, error);
		res.status(HttpStatusCode.InternalServerError).send({ "*": "Internal server error, please try again later." });
	}
}
