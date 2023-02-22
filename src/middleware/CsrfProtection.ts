import type { Request, Response, NextFunction } from "express";
import { ApplyMiddlewareOptions } from "../lib/Middleware/decorators.js";
import { Middleware } from "../lib/Middleware/Middleware.js";

@ApplyMiddlewareOptions({
	name: "csrf-protection"
})
export default class extends Middleware {
	public override run(req: Request, res: Response, next: NextFunction): void {
		const cookie: string = req.cookies["XSRF-TOKEN"];
		if (!cookie || typeof cookie !== "string") {
			res.status(403).send({ message: "Invalid state cookie received." });
			return;
		}

		const header = req.headers["xsrf-token"];
		if (!header || typeof header !== "string") {
			res.status(403).send({ message: "Invalid state header received." });
			return;
		}

		const stateCheckRes = this.server.jwt.checkState(cookie, header);
		if (!stateCheckRes) {
			res.status(403).send({ message: "XSRF-TOKENS do not match." });
			return;
		}

		next();
	}
}
