import "#lib/env.js";

import { RedisClient } from "#lib/constants.js";
import { CreatorHubServer } from "#lib/Server.js";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

void (async () => {
	await RedisClient.connect();

	const server = new CreatorHubServer({ middlewarePath: join(__dirname, "middleware"), routePath: join(__dirname, "routes") });
	await server.start();

	process.on("beforeExit", server.syncManager.syncAll.bind(server.syncManager));
	process.on("uncaughtException", server.unhandledException.bind(server));
})();
