import type { Session as iSession } from "@prisma/client";
import type { User } from "./User.js";

export class Session implements Omit<iSession, "userId"> {
	public expirationDate: Date;
	public token: string;
	public user: User;

	public constructor(data: iSession, user: User) {
		this.user = user;
		this.expirationDate = data.expirationDate;
		this.token = data.token;
	}
}
