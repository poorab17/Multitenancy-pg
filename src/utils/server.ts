import fastify from "fastify";
import { logger } from "./logger";
import gaurd from "fastify-guard";
import { applicationRoutes } from "../modules/applications/applications.routes";
import { userRoutes } from "../modules/users/users.routes";
import { roleRoute } from "../modules/roles/roles.routes";
import Jwt from "jsonwebtoken";

type User = {
  id: string;
  applicationId: string;
  scopes: Array<string>;
};

declare module "fastify" {
  interface FastifyRequest {
    user: User;
  }
}

export async function buildServer() {
  const app = fastify({
    logger,
  });

  app.decorateRequest("user", null);

  app.addHook("onRequest", async function (request, reply) {
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      return;
    }

    try {
      const token = authHeader.replace("Bearer ", "");
      const decoded = Jwt.verify(token, "secret") as User;
      request.user = decoded;
    } catch (error) {}
  });

  //register plugins
  app.register(gaurd, {
    requestProperty: "user",
    scopeProperty: "scopes",
    errorHandler: (result, request, reply) => {
      return reply.send("you can not do that");
    },
  });

  // register routes
  app.register(applicationRoutes, { prefix: "/api/applications" });
  app.register(userRoutes, { prefix: "/api/users" });
  app.register(roleRoute, { prefix: "/api/roles" });

  return app;
}
