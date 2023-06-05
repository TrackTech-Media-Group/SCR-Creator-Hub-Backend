import "#lib/env.js";

import { CreatorHubServer } from "#lib/Server.js";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

void (async () => {
	const server = new CreatorHubServer({ middlewarePath: "", routePath: join(__dirname, "routes") });
	await server.start();
})();
