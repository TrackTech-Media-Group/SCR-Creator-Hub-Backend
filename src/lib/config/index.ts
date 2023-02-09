import type Server from "../Server.js";
import { ConfigReader } from "./ConfigReader.js";
import type { EnvConfig } from "./ConfigTypes.js";

export default class Config {
	public configReader: ConfigReader;
	public config!: EnvConfig;

	public constructor(public server: Server) {
		this.configReader = new ConfigReader(server);
	}

	public async start() {
		const data = await this.configReader.start();
		this.config = data;
	}
}
