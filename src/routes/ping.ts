import type { CreatorHubServer } from "#lib/Server.js";
import { Route, methods } from "@snowcrystals/highway";
import type { Request, Response } from "express";

export default class extends Route<CreatorHubServer> {
	public [methods.GET](req: Request, res: Response) {
		res.send("pong");
	}
}
