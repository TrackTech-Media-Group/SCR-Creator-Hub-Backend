import type { Request, Response } from "express";
import { ApiRoute, ApplyOptions } from "../../lib/Api/index.js";

@ApplyOptions({
	methods: "POST",
	middleware: ["internal-api"]
})
export default class extends ApiRoute {
	public override run(req: Request, res: Response) {
		const token = this.server.jwt.generateState();
		res.status(200).send(token);
	}
}
