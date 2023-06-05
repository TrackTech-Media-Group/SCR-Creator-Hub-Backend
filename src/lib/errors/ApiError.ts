import type { HttpStatusCode } from "axios";

export class ApiError extends Error {
	/** The status code */
	public readonly status: HttpStatusCode;

	/** The errors that arose during the API call */
	public readonly errors: Record<string, unknown>;

	public constructor(statusCode: HttpStatusCode, errors: Record<string, unknown>) {
		super();

		this.status = statusCode;
		this.errors = errors;
	}
}
