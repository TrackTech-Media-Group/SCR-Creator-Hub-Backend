import type { Response } from "express";
import { ApiRoute, ApplyOptions } from "../../lib/Api/index.js";
import type { UserApiRequest } from "../../middleware/UserAuth.js";

@ApplyOptions({
	methods: "GET",
	middleware: ["user-auth"]
})
export default class extends ApiRoute {
	public override run(req: UserApiRequest, res: Response) {
		res.send({
			name: req.locals.user.username,
			bookmarks: [],
			recent: [],
			dataRequest: null
		});
	}
}
