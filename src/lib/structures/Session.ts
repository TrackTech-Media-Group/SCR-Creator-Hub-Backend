import type { Session as iSession } from "@prisma/client";
import type { User } from "./User.js";

export class Session implements Omit<iSession, "userId"> {
	/** The expiration date of the session */
	public readonly expirationDate: Date;

	/** The token associated with this session */
	public readonly token: string;

	/** The user associated with this session */
	public readonly user: User;

	public constructor(data: iSession, user: User) {
		this.user = user;
		this.expirationDate = data.expirationDate;
		this.token = data.token;
	}

	public toJSON() {
		return {
			token: this.token,
			experirationDate: this.expirationDate
		};
	}
}
