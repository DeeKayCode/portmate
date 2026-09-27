import { buildApp } from "./app.js";
import { loadConfig } from "./config.js";
import { createDatabase } from "./db.js";
import { migrate } from "./migrate.js";
import { processNotifications } from "./notification-service.js";

const config = loadConfig();

async function start() {
  if (!config.DATABASE_URL) throw new Error("DATABASE_URL is required to start PortMate");
  await migrate(config.DATABASE_URL);
  const db = createDatabase(config.DATABASE_URL);
  const app = buildApp(config, db);
  app.addHook("onClose", async () => db.end());
  await processNotifications(db, config);
  const notificationTimer = setInterval(() => void processNotifications(db, config).catch((error) => app.log.error(error)), 15 * 60_000);
  notificationTimer.unref();
  await app.listen({ host: "0.0.0.0", port: config.PORT });
}

start().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
