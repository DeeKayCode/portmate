import Fastify from "fastify";
import helmet from "@fastify/helmet";
import sensible from "@fastify/sensible";
import type { AppConfig } from "./config.js";

export function buildApp(config: AppConfig) {
  const app = Fastify({
    logger: { level: config.LOG_LEVEL, redact: ["req.headers.authorization", "req.headers.cookie"] },
  });
  app.register(helmet);
  app.register(sensible);
  app.get("/api/v1/health", async () => ({ status: "ok" as const, database: "unknown" as const }));
  return app;
}
