import Server from "./lib/Server.js";

void (async () => {
	const server = new Server();
	await server.start();
})();
