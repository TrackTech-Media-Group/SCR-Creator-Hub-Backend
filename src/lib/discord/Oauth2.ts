import axios, { AxiosError } from "axios";

// TODO: Create and use RequestHandler
export class Oauth2 implements Oauth2Options {
	public API_ENDPOINT = "https://discord.com/api/v10";

	public clientId: string;
	public clientSecret: string;
	public redirectUrl: string;

	public constructor(options: Oauth2Options) {
		this.clientId = options.clientId;
		this.clientSecret = options.clientSecret;
		this.redirectUrl = options.redirectUrl;
	}

	/**
	 * Requests the accesstoken body from Discord using the authorization code
	 * @param code The authorization code received from the authentication request
	 * @throws DiscordApiError | *Error
	 */
	public async requestToken(code: string): Promise<Oauth2AccessTokenResponseBody> {
		try {
			const requestBody = this.getData("authorization_code", code);
			const res = await axios.post<Oauth2AccessTokenResponseBody>(this.getUrl("/oauth2/token"), requestBody, {
				headers: { "Content-Type": "application/x-www-form-urlencoded" }
			});

			return res.data;
		} catch (err) {
			if ("isAxiosError" in err) {
				const error: AxiosError<DiscordApiError> = err;
				if (error.response?.data) {
					const discordError = error.response.data;
					throw discordError as any;
				}
			}

			throw err;
		}
	}

	/**
	 * Revokes the provided access token
	 * @param code The access token to revoke
	 * @throws DiscordApiError | *Error
	 */
	public async revokeToken(token: string): Promise<void> {
		const credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString("base64");

		try {
			const requestBody = `token=${token}`;
			await axios.post(this.getUrl("/oauth2/token/revoke"), requestBody, {
				headers: { "Content-Type": "application/x-www-form-urlencoded", Authorization: `Basic ${credentials}` }
			});
		} catch (err) {
			if ("isAxiosError" in err) {
				const error: AxiosError<DiscordApiError> = err;
				if (error.response?.data) {
					const discordError = error.response.data;
					throw discordError as any;
				}
			}

			throw err;
		}
	}

	/**
	 * Retrieves the Discord user data
	 * @param accessToken The accesstoken of the requested user
	 * @throws DiscordApiError | *Error
	 */
	public async getUser(accessToken: string): Promise<DiscordAPIUser> {
		try {
			const res = await axios.get<DiscordAPIUser>(this.getUrl("/users/@me"), {
				headers: { Authorization: `Bearer ${accessToken}` }
			});

			return res.data;
		} catch (err) {
			if ("isAxiosError" in err) {
				const error: AxiosError<DiscordApiError> = err;
				if (error.response?.data) {
					const discordError = error.response.data;
					throw discordError as any;
				}
			}

			throw err;
		}
	}

	/**
	 * Returns the api url with a given path
	 * @param path The api path you want to call
	 */
	private getUrl(path: string): string {
		return `${this.API_ENDPOINT}${path}`;
	}

	/**
	 * Returns ready to use accessToken request body
	 * @param type The Oauth2 grant type
	 * @param value The refreshToken or oauth2 code needed to get the credentials
	 * @returns AccessToken request body
	 */
	private getData(type: Oauth2GrantType, value: string): Oauth2TokenBodyData {
		switch (type) {
			case "authorization_code":
				return {
					grant_type: "authorization_code",
					client_id: this.clientId,
					client_secret: this.clientSecret,
					redirect_uri: this.redirectUrl,
					code: value
				};
			case "refresh_token":
				return {
					grant_type: "refresh_token",
					client_id: this.clientId,
					client_secret: this.clientSecret,
					refresh_token: value
				};
		}
	}
}

export interface Oauth2Options {
	clientSecret: string;
	clientId: string;
	redirectUrl: string;
}

export interface Oauth2AccessTokenBodyData {
	client_id: string;
	client_secret: string;
	grant_type: "authorization_code";
	code: string;
	redirect_uri: string;
}

export interface Oauth2RefreshTokenBodyData {
	client_id: string;
	client_secret: string;
	grant_type: "refresh_token";
	refresh_token: string;
}

export interface Oauth2AccessTokenResponseBody {
	access_token: string;
	token_type: string;
	expires_in: number;
	refresh_token: string;
	scope: string;
}

export interface DiscordApiErrorEntry {
	_errors: {
		code: string;
		message: string;
	}[];
}

export interface DiscordAPIErrorArray {
	code: number;
	/** Object Key -> Entry number -> Field Type */
	errors: Record<string, Record<string, Record<string, DiscordApiErrorEntry>>>;
	message: string;
}

export interface DiscordAPIErrorObject {
	code: number;
	errors: Record<string, DiscordApiErrorEntry>;
	message: string;
}

export interface DiscordAPIErrorRequest {
	code: number;
	errors: DiscordApiErrorEntry;
	message: string;
}

export type DiscordApiError = DiscordAPIErrorArray | DiscordAPIErrorObject | DiscordAPIErrorRequest;

export type Oauth2GrantType = "authorization_code" | "refresh_token";

export type Oauth2TokenBodyData = Oauth2AccessTokenBodyData | Oauth2RefreshTokenBodyData;

export interface DiscordAPIUser {
	id: string;
	username: string;
	discriminator: string;
	avatar: string;
	flags: number;
	banner: string;
	accent_color: number;
	premium_type: number;
	public_flags: number;
}
