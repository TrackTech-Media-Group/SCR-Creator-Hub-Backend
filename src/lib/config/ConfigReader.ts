import { bold } from "colorette";
import { config } from "dotenv";
import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import type Server from "../Server.js";
import { DEFAULT_RAW_ENV, EnvConfig } from "./ConfigTypes.js";

export class ConfigReader {
	public dataDirectory = join(process.cwd(), "data");

	public constructor(public server: Server) {}

	public async start() {
		const { error } = config({ path: join(this.dataDirectory, ".env") });
		if (error) {
			switch ((error as NodeJS.ErrnoException).code) {
				case "ENOENT":
					{
						this.server.logger.error(`[CONFIG]: No ${bold(".env")} found, creating one with the default configuration`);

						const newConfig = this.generateDefaultConfig();
						await writeFile(join(this.dataDirectory, ".env"), newConfig);
						config({ path: join(this.dataDirectory, ".env") });
					}
					break;
				default:
					this.server.logger.fatal(`[CONFIG]: unexpected error occured while loading the ${bold(".env")} config.`, error);
			}
		}

		const parsedConfig = this.parseConfig();
		return parsedConfig;
	}

	private parseConfig() {
		const parsedItems: EnvConfig = {
			port: this.parseConfigItem("PORT")
		};

		return parsedItems;
	}

	private parseConfigItem<K extends keyof EnvConfig>(key: keyof typeof DEFAULT_RAW_ENV): EnvConfig[K] {
		const value = process.env[key] ?? "";
		switch (key) {
			case "PORT": {
				const _val = Number(value);
				if (isNaN(_val)) return 3000;

				return _val;
			}
		}
	}

	private generateDefaultConfig() {
		return Object.keys(DEFAULT_RAW_ENV).map((key) => `${key}="${DEFAULT_RAW_ENV[key as keyof typeof DEFAULT_RAW_ENV]}"`);
	}
}
