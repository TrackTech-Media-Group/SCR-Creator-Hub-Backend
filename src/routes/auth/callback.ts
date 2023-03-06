import { bold } from "colorette";
import type { Request, Response } from "express";
import { ApiRoute, ApplyOptions } from "../../lib/Api/index.js";
import { Oauth2, DiscordApiError } from "../../lib/discord/index.js";

@ApplyOptions({
	methods: "POST"
})
export default class extends ApiRoute {
	public oauth2 = new Oauth2({
		clientId: this.server.config.config.discord.id,
		clientSecret: this.server.config.config.discord.secret,
		redirectUrl: this.server.config.config.discord.callback
	});

	public override async run(req: Request, res: Response) {
		const query = this.parseQs(req, res);
		if (!query) return;
		if (!this.checkState(req, res, query.state)) return;

		try {
			const token = await this.oauth2.requestToken(query.code);
			const sessionJwt = await this.server.userManager.cache.handleToken(token);

			res.cookie("CH-SESSION", sessionJwt, {
				expires: new Date(Date.now() + 8.035e9),
				domain: process.env.NODE_ENV === "development" ? undefined : `.${req.hostname.split(".").reverse().slice(0, 2).reverse().join(".")}`
			}).sendStatus(204);
		} catch (err) {
			if ("errors" in err) {
				const error = err as DiscordApiError;
				this.server.logger.error(`[DISCORD OAUTH2]: Discord API returned an error: ${bold(error.message)} -> `, error.errors);
			} else this.server.logger.fatal(`[DISCORD OAUTH2]: Unknown error during callback `, err);

			res.status(500).send({ message: "Unable to process your request due to a server error, please try again later!" });
		}
	}

	private parseQs(req: Request, res: Response) {
		const { code, state } = req.query;
		if (typeof code !== "string" || typeof state !== "string") {
			res.status(500).send({ message: "Invalid code and/or state query param provided." });
			return null;
		}

		return {
			code: code as string,
			state: state as string
		};
	}

	private checkState(req: Request, res: Response, stateQuery: string) {
		const stateCookie: string = req.cookies["XSRF-STATE-TOKEN"];
		if (!stateCookie || typeof stateCookie !== "string") {
			res.status(403).send({ message: "Invalid state cookie received." });
			return false;
		}

		const stateCheckRes = this.server.jwt.checkState(stateCookie, stateQuery);
		if (!stateCheckRes) {
			res.status(403).send({ message: "State tokens do not match." });
			return false;
		}

		return true;
	}
}
