import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db } from "./db";
import { env } from "./config/env";
import { logger } from "./utils/logger";
import { buildServer } from "./utils/server";

async function gracefulShutdown({
  app,
}: {
  app: Awaited<ReturnType<typeof buildServer>>;
}) {
  await app.close();
}

async function main() {
  const app = await buildServer();

  await app.listen({
    port: env.PORT,
    host: env.HOST,
  });

  await migrate(db, {
    migrationsFolder: "./migration",
  });
  // console.log("server is running at port 3000");
  const signals = ["SIGINT", "SIGTERM"];

  logger.debug(env, "using env");

  for (const signal of signals) {
    process.on(signal, () => {
      console.log("got signal", signal);
      gracefulShutdown({
        app,
      });
    });
  }
}

main();
