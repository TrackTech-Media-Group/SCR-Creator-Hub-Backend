export const DEFAULT_RAW_ENV = {
	PORT: "3000"
} as const;

export interface EnvConfig {
	port: number;
}
