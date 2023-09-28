import { FastifyReply, FastifyRequest } from "fastify";
import {
  CreateUserBody,
  LoginBody,
  assignRoleToUserBody,
} from "./users.schemas";
import { SYSTEM_ROLES } from "../../config/permissions";
import { getRoleByName } from "../roles/roles.services";
import {
  assignRoleToUser,
  createUser,
  getUserByEmail,
  getUsersByApplication,
} from "./users.services";
import { users } from "../../db/schema";
import Jwt from "jsonwebtoken";
import { logger } from "../../utils/logger";

export async function createUserHandler(
  request: FastifyRequest<{ Body: CreateUserBody }>,
  reply: FastifyReply
) {
  const { initialUser, ...data } = request.body;

  console.log(initialUser);

  const rolesName = initialUser
    ? SYSTEM_ROLES.SUPER_ADMIN
    : SYSTEM_ROLES.APPLICATION_USER;

  console.log(rolesName);

  if (rolesName === SYSTEM_ROLES.SUPER_ADMIN) {
    const appUsers = await getUsersByApplication(data.applicationId);
    if (appUsers.length > 0) {
      return reply.code(400).send({
        message: "Application already has super Admin user",
        extensions: {
          code: "APPLICATION_ALREADY_SUPER_USER",
          applicationId: data.applicationId,
        },
      });
    }
  }

  const role = await getRoleByName({
    name: rolesName,
    applicationId: data.applicationId,
  });

  console.log(role);

  if (!role) {
    return reply.code(404).send({
      message: "Role not found",
    });
  }

  try {
    const user = await createUser(data);
    //assign role
    await assignRoleToUser({
      userId: user.id,
      roleId: role.id,
      applicationId: data.applicationId,
    });
    return user;
  } catch (e) {}
}

export async function loginHandler(
  request: FastifyRequest<{
    Body: LoginBody;
  }>,
  reply: FastifyReply
) {
  const { applicationId, email, password } = request.body;

  const user = await getUserByEmail({
    applicationId,
    email,
  });

  if (!user) {
    return reply.code(400).send({
      message: "invalid email or password",
    });
  }
  // return user;

  const token = Jwt.sign(
    {
      id: user.id,
      email,
      applicationId,
      scopes: user.permissions,
    },
    "secret"
  );
  return { token };
}

export async function assignRoleToUserHandler(
  request: FastifyRequest<{
    Body: assignRoleToUserBody;
  }>,
  reply: FastifyReply
) {
  const applicationId = request.user.applicationId;
  const { userId, roleId } = request.body;

  try {
    const result = await assignRoleToUser({
      userId,
      applicationId,
      roleId,
    });
    return result;
  } catch (e) {
    logger.error(e, `error assigning role to user`);
    return reply.code(400).send({
      message: "could not assign role to user",
    });
  }

  // const result = await assignRoleToUser({
  //   userId,
  //   applicationId,
  //   roleId,
  // });
  // return result;
}
