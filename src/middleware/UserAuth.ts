import type { Request, Response, NextFunction } from "express";
import { ApplyMiddlewareOptions } from "../lib/Middleware/decorators.js";
import { Middleware } from "../lib/Middleware/Middleware.js";
import jwt from "jsonwebtoken";
import type { User } from "@prisma/client";

@ApplyMiddlewareOptions({
	name: "user-auth"
})
export default class extends Middleware {
	public override async run(req: UserApiRequest, res: Response, next: NextFunction): Promise<void> {
		const session = req.cookies["CH-SESSION"];
		if (typeof session !== "string") {
			res.status(401).send({ message: "Unauthorized." });
			return;
		}

		const token = jwt.verify(session, this.server.config.config.encryptionKey);
		if (typeof token !== "object" || typeof token.session !== "string" || typeof token.userId !== "string") {
			res.status(401).send({ message: "Unauthorized." });
			return;
		}

		const sessionData = await this.server.prisma.session.findFirst({
			where: { token: token.session, userId: token.userId },
			include: { User: true }
		});
		if (!sessionData || sessionData.expirationDate.getTime() <= Date.now() || !sessionData.User) {
			res.status(401).send({ message: "Unauthorized." });
			return;
		}

		req.locals = { user: sessionData.User };

		next();
	}
}

export interface UserApiRequest extends Request {
	locals: {
		user: User;
	};
}