import { z } from "zod";

const developmentSecret = "development-only-secret-change-before-production";
const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().url().optional(),
  JWT_SECRET: z.string().min(32).default(developmentSecret),
  APP_ORIGIN: z.string().url().default("http://localhost:5173"),
  GOOGLE_CLIENT_ID: z.string().optional(),
  SMTP_URL: z.preprocess(value => value === '' ? undefined : value, z.string().url().optional()),
  EMAIL_FROM: z.string().email().default("noreply@portmate.local"),
  CRUISE_PROVIDER: z.enum(["deterministic"]).default("deterministic"),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info"),
}).superRefine((value, context) => {
  if (value.NODE_ENV === "production" && !value.DATABASE_URL) context.addIssue({ code: "custom", path: ["DATABASE_URL"], message: "DATABASE_URL is required in production" });
  if (value.NODE_ENV === "production" && value.JWT_SECRET === developmentSecret) context.addIssue({ code: "custom", path: ["JWT_SECRET"], message: "Set a unique JWT_SECRET in production" });
});

export type AppConfig = z.infer<typeof schema>;

export function loadConfig(source: NodeJS.ProcessEnv = process.env): AppConfig {
  return schema.parse(source);
}
