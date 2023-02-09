import { Logger, LogLevel } from "@snowcrystals/icicle";
import express, { Express } from "express";
import Config from "./config/index.js";

export default class Server {
	public server: Express;
	public logger: Logger;

	public config: Config;

	public constructor() {
		this.server = express();
		this.logger = new Logger({ level: LogLevel.Debug });

		this.config = new Config(this);
	}

	public async start() {
		await this.config.start();
		this.server.listen();
	}
}
