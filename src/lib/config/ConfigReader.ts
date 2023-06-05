import { SnowflakeRegex } from "@sapphire/discord-utilities";
import { bold } from "colorette";
import { config } from "dotenv";
import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import type Server from "../Server.js";
import { DEFAULT_RAW_ENV, type EnvConfig } from "./ConfigTypes.js";

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
			port: this.parseConfigItem("PORT"),
			internalApiKey: this.parseConfigItem("INTERNAL_API_KEY"),
			encryptionKey: this.parseConfigItem("ENCRYPTION_KEY"),
			discord: {
				id: this.parseConfigItem("DISCORD_CLIENT_ID"),
				secret: this.parseConfigItem("DISCORD_CLIENT_SECRET"),
				callback: this.parseConfigItem("DISCORD_CALLBACK_URL")
			},
			upload: {
				api: this.parseConfigItem("UPLOAD_API"),
				key: this.parseConfigItem("UPLOAD_API_KEY")
			}
		};

		return parsedItems;
	}

	private parseConfigItem(key: keyof typeof DEFAULT_RAW_ENV): any {
		const value = process.env[key] ?? "";
		switch (key) {
			case "PORT": {
				const _val = Number(value);
				if (isNaN(_val)) return 3000;

				return _val;
			}
			case "INTERNAL_API_KEY":
			case "ENCRYPTION_KEY":
			case "DISCORD_CLIENT_SECRET":
			case "UPLOAD_API_KEY":
				if (typeof value !== "string" || !value.length) throw new Error(`Invalid ${key} provided in .env file`);
				return value;
			case "DISCORD_CLIENT_ID": {
				const match = value.match(SnowflakeRegex);
				if (!match || !match.groups?.id) throw new Error("Invalid Discord Client Id provided!");

				return match.groups.id;
			}
			case "DISCORD_CALLBACK_URL": {
				const urlRegex = /^(https?|ftp):\/\/(-\.)?([^\s/?.#-]+\.?)+(\/[^\s]*)?$/;
				if (urlRegex.test(value)) return value;

				return "http://localhost:3001/auth/callback";
			}
			case "UPLOAD_API": {
				const urlRegex = /^(https?|ftp):\/\/(-\.)?([^\s/?.#-]+\.?)+(\/[^\s]*)?$/;
				if (urlRegex.test(value)) return value;

				return "https://creatorhub-cdn-dev.dnkl.xyz";
			}
			default:
				return "";
		}
	}

	private generateDefaultConfig() {
		return Object.keys(DEFAULT_RAW_ENV)
			.map((key) => {
				const _res = DEFAULT_RAW_ENV[key as keyof typeof DEFAULT_RAW_ENV];

				let res: string = _res as any;
				if (typeof _res === "function") res = _res();

				return `${key}="${res}"`;
			})
			.join("\n");
	}
}
