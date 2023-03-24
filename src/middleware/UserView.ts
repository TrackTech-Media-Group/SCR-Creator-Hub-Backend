import type { Request, Response, NextFunction } from "express";
import { ApplyMiddlewareOptions } from "../lib/Middleware/decorators.js";
import { Middleware } from "../lib/Middleware/Middleware.js";
import jwt from "jsonwebtoken";
import type { User } from "@prisma/client";

@ApplyMiddlewareOptions({
	name: "user-view"
})
export default class extends Middleware {
	public override async run(req: UserApiRequest, res: Response, next: NextFunction): Promise<void> {
		const session = req.headers["x-user-token"];
		if (typeof session !== "string" || !session.length) {
			next();
			return;
		}

		const token = jwt.verify(session, this.server.config.config.encryptionKey);
		if (typeof token !== "object" || typeof token.session !== "string" || typeof token.userId !== "string") {
			next();
			return;
		}

		const sessionData = this.server.data.getSession(token.session, token.userId);
		if (!sessionData || sessionData.session.expirationDate.getTime() <= Date.now()) {
			next();
			return;
		}

		if (!req.params.id) return next();

		const footage = this.server.data.footage.find((f) => f.id === req.params.id);
		if (!footage) return next();

		await this.server.userManager.cache.handleView(sessionData.user.userId, footage.id);

		next();
	}
}

export interface UserApiRequest extends Request {
	locals: {
		user: User;
	};
}
