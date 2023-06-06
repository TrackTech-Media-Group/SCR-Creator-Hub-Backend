import { Server } from "@snowcrystals/highway";
import { ContentManager } from "./ContentManager.js";
import { PrismaClient } from "@prisma/client";
import type { NextFunction, Request, Response } from "express";
import { ApiError } from "#errors/ApiError.js";
import { Logger } from "@snowcrystals/icicle";
import { HttpStatusCode } from "axios";
import { bold } from "colorette";

export class CreatorHubServer extends Server {
	/** The manager responsible for all the content on Creator Hub */
	public readonly contentManager: ContentManager = new ContentManager(this);

	/** The bridge between the application and the PostgreSQL database */
	public readonly prisma = new PrismaClient();

	/** Private logger instance for error handling */
	private logger = new Logger({ name: "Error Handler" });

	public async start() {
		await this.contentManager.load();
		await this.prisma.$connect();

		await this.listen(3000, () => new Logger({ name: "Server" }).info(`Running on port ${bold(3000)}: http://localhost:${3000}`));
	}

	public override async listen(port: number, cb?: () => void) {
		await this.middlewareHandler.loadAll(this);
		await this.routeHandler.loadAll(this);

		this.express.use(this.handleApiError.bind(this));
		return this.express.listen(port, cb);
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
