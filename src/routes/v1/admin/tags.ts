import type { CreatorHubServer } from "#lib/Server.js";
import { ApiError } from "#lib/errors/ApiError.js";
import { ApplyOptions, Route, methods } from "@snowcrystals/highway";
import { HttpStatusCode } from "axios";
import type { NextFunction, Request, Response } from "express";
import z, { ZodError } from "zod";

@ApplyOptions<Route.Options>({
	middleware: [
		[methods.GET, "admin-authentication"],
		[methods.DELETE, "admin-authentication"]
	]
})
export default class extends Route<CreatorHubServer> {
	public [methods.GET](req: Request, res: Response) {
		const tags = [...this.server.contentManager.tags.values()].map((tag) => ({ stats: tag.getStats(), ...tag.toJSON() }));
		res.json(tags);
	}

	public async [methods.DELETE](req: Request, res: Response, next: NextFunction) {
		const { id } = req.body;
		if (!id || typeof id !== "string") {
			const invalidBodyError = new ApiError(HttpStatusCode.BadRequest, { id: "Missing in request body" });
			return next(invalidBodyError);
		}

		if (!this.server.contentManager.tags.has(id)) {
			const unknownTag = new ApiError(HttpStatusCode.NotFound, { id: "Unknown tag" });
			return next(unknownTag);
		}

		await this.server.contentManager.deleteTag(id);
		res.sendStatus(204);
	}

	public async [methods.POST](req: Request, res: Response, next: NextFunction) {
		const zod = z.object({
			id: z.string().regex(/^[a-zA-Z0-9_-]+$/g, { message: "Id can only contain a-z, A-Z, 0-9, _ or -" }),
			name: z.string()
		});

		let parsed: z.infer<typeof zod>;

		try {
			parsed = zod.parse(req.body);
		} catch (err) {
			if (!(err instanceof ZodError)) return next();
			const issues = err.issues.map((issue) => ({ [issue.path.join(".")]: issue.message })).reduce((a, b) => ({ ...a, ...b }));

			const apiError = new ApiError(HttpStatusCode.BadRequest, issues);
			return next(apiError);
		}

		await this.server.contentManager.addTag(parsed.id, parsed.name);
		res.sendStatus(204);
	}
}
