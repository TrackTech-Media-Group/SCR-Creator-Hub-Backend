import type { Request, Response } from "express";
import { ApiRoute, ApplyOptions } from "../../lib/Api/index.js";

@ApplyOptions({
	methods: "GET"
})
export default class extends ApiRoute {
	public override run(req: Request, res: Response) {
		res.status(301).redirect("https://ijskoud.dev/");
	}
}
