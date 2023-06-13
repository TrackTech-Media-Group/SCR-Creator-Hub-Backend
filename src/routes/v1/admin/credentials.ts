import type { CreatorHubServer } from "#lib/Server.js";
import { ApplyOptions, Route, methods } from "@snowcrystals/highway";
import type { Request, Response } from "express";

@ApplyOptions<Route.Options>({ middleware: [[methods.GET, "admin-authentication"]] })
export default class extends Route<CreatorHubServer> {
	public [methods.GET](req: Request, res: Response) {
		const uploadApiEndpoint = process.env.UPLOAD_CHUNK_API_URL;
		const uploadApiKey = process.env.UPLOAD_API_KEY;

		res.json({ endpoint: uploadApiEndpoint, authorization: uploadApiKey });
	}
}
