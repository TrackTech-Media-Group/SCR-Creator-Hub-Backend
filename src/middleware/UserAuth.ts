import type { Request, Response, NextFunction } from "express";
import { ApplyMiddlewareOptions } from "../lib/Middleware/decorators.js";
import { Middleware } from "../lib/Middleware/Middleware.js";
import jwt from "jsonwebtoken";
import type { User } from "@prisma/client";

@ApplyMiddlewareOptions({
	name: "user-auth"
})
export default class extends Middleware {
	public override run(req: UserApiRequest, res: Response, next: NextFunction): void {
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

		const sessionData = this.server.data.getSession(token.session, token.userId);
		if (!sessionData || sessionData.session.expirationDate.getTime() <= Date.now()) {
			res.status(401).send({ message: "Unauthorized." });
			return;
		}

		req.locals = { user: sessionData.user };

		next();
	}
}

export interface UserApiRequest extends Request {
	locals: {
		user: User;
	};
}
