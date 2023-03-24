import type { Request, Response } from "express";
import { ApiRoute, ApplyOptions } from "../../../lib/Api/index.js";

@ApplyOptions({
	methods: "GET",
	middleware: []
})
export default class extends ApiRoute {
	public override run(req: Request, res: Response) {
		res.send(this.server.data.tags);
	}
}
