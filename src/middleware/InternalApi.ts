import type { Request, Response, NextFunction } from "express";
import { ApplyMiddlewareOptions } from "../lib/Middleware/decorators.js";
import { Middleware } from "../lib/Middleware/Middleware.js";

@ApplyMiddlewareOptions({
	name: "internal-api"
})
export default class extends Middleware {
	public override run(req: Request, res: Response, next: NextFunction): void {
		const { authorization } = req.headers;
		if (typeof authorization !== "string") {
			res.status(401).send({ message: "Unauthorized." });
			return;
		}

		const [type, token] = authorization.split(/ +/g);
		if (type !== "Bearer" || token !== this.server.config.config.internalApiKey) {
			res.status(401).send({ message: "Unauthorized." });
			return;
		}

		next();
	}
}
