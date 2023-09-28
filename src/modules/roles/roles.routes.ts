import { PERMISSIONS } from "../../config/permissions";
import { createRoleHandler } from "./roles.controllers";
import { CreateRoleBody, createRoleJsonSchema } from "./roles.schemas";
import { FastifyInstance } from "fastify/types/instance";

export async function roleRoute(app: FastifyInstance) {
  app.post<{
    Body: CreateRoleBody;
  }>(
    "/",
    {
      schema: createRoleJsonSchema,
      preHandler: [app.guard.scope([PERMISSIONS["roles:write"]])],
    },
    createRoleHandler
  );
}
