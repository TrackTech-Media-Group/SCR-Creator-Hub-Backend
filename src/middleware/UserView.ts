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
		const session = req.cookies["CH-SESSION"];
		if (typeof session !== "string") {
			next();
			return;
		}

		const token = jwt.verify(session, this.server.config.config.encryptionKey);
		if (typeof token !== "object" || typeof token.session !== "string" || typeof token.userId !== "string") {
			next();
			return;
		}

		const sessionData = await this.server.prisma.session.findFirst({
			where: { token: token.session, userId: token.userId },
			include: { User: true }
		});
		if (!sessionData || sessionData.expirationDate.getTime() <= Date.now() || !sessionData.User) {
			next();
			return;
		}

		if (!req.params.id) return next();

		const footage = await this.server.prisma.footage.findFirst({ where: { id: req.params.id } });
		if (!footage) return next();

		await this.server.userManager.cache.handleView(sessionData.User.userId, req.params.id);

		next();
	}
}

export interface UserApiRequest extends Request {
	locals: {
		user: User;
	};
}
