import type { CreatorHubServer } from "#lib/Server.js";
import { ApiError } from "#lib/errors/ApiError.js";
import { ApplyOptions, Route, methods } from "@snowcrystals/highway";
import { HttpStatusCode } from "axios";
import type { NextFunction, Request, Response } from "express";
import { ZodError, z } from "zod";

@ApplyOptions<Route.Options>({
	middleware: [
		[methods.PUT, "csrf-token-verification", "admin-authentication"],
		[methods.DELETE, "csrf-token-verification", "admin-authentication"]
	]
})
export default class extends Route<CreatorHubServer> {
	public async [methods.PUT](req: Request, res: Response, next: NextFunction) {
		const { id } = req.params;

		const zod = z.object({
			name: z.string().optional(),
			type: z.union([z.literal("image"), z.literal("video"), z.literal("music")]).optional(),
			useCases: z.array(z.string()).optional(),
			tags: z.array(z.object({ id: z.string(), name: z.string() })).optional(),
			downloads: z.array(z.object({ name: z.string(), url: z.string().url(), isPreview: z.boolean() })).optional()
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

		await this.server.contentManager.updateContent(id, parsed);
		res.sendStatus(204);
	}

	public async [methods.DELETE](req: Request, res: Response, next: NextFunction) {
		const { id } = req.params;

		if (!this.server.contentManager.content.has(id)) {
			const unknownTag = new ApiError(HttpStatusCode.NotFound, { id: "Unknown content item" });
			return next(unknownTag);
		}

		await this.server.contentManager.deleteContent(id);
		res.sendStatus(204);
	}
}
