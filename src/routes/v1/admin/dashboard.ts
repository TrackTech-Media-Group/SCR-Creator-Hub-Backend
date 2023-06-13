import type { CreatorHubServer } from "#lib/Server.js";
import { ApplyOptions, Route, methods } from "@snowcrystals/highway";
import type { Request, Response } from "express";
import pidUsage from "pidusage";
import osUtils from "node-os-utils";

@ApplyOptions<Route.Options>({ middleware: [[methods.GET, "admin-authentication"]] })
export default class extends Route<CreatorHubServer> {
	public async [methods.GET](req: Request, res: Response) {
		const pid = await pidUsage(process.pid);
		const totalMemory = osUtils.mem.totalMem();

		const stats = {
			uptime: process.uptime(),
			cpu: pid.cpu,
			memory: {
				usage: pid.memory,
				total: totalMemory
			}
		};

		res.json(stats);
	}
}
