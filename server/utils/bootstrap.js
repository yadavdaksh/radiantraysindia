import bcrypt from "bcryptjs";
import { prisma } from "../config/db.js";
import { PERMISSIONS, ROLE_DEFINITIONS } from "./permissions.js";
import { validatePassword } from "../helpers/validatePassword.js";

export const ensureSecurityBootstrap = async () => {
  const permissions = await Promise.all(
    PERMISSIONS.map(([resource, action]) =>
      prisma.permission.upsert({
        where: {
          resource_action: {
            resource,
            action,
          },
        },
        update: {},
        create: {
          resource,
          action,
          description: `${resource}:${action}`,
        },
      })
    )
  );

  const permissionMap = new Map(
    permissions.map((permission) => [`${permission.resource}:${permission.action}`, permission])
  );

  const roles = [];

  for (const roleDefinition of ROLE_DEFINITIONS) {
    const role = await prisma.role.upsert({
      where: { name: roleDefinition.name },
      update: {
        label: roleDefinition.label,
        isActive: true,
      },
      create: {
        name: roleDefinition.name,
        label: roleDefinition.label,
      },
    });

    roles.push(role);

    if (roleDefinition.permissions === "*") {
      const existing = await prisma.rolePermission.findMany({
        where: { roleId: role.id },
      });
      if (!existing.length) {
        await prisma.rolePermission.createMany({
          data: permissions.map((permission) => ({
            roleId: role.id,
            permissionId: permission.id,
          })),
          skipDuplicates: true,
        });
      }
      continue;
    }

    const rolePermissions = roleDefinition.permissions
      .map(([resource, action]) => permissionMap.get(`${resource}:${action}`))
      .filter(Boolean);

    const existing = await prisma.rolePermission.findMany({
      where: { roleId: role.id },
    });

    if (!existing.length) {
      await prisma.rolePermission.createMany({
        data: rolePermissions.map((permission) => ({
          roleId: role.id,
          permissionId: permission.id,
        })),
        skipDuplicates: true,
      });
    }
  }

  if (process.env.SEED_ADMIN_EMAIL && process.env.SEED_ADMIN_PASSWORD) {
    validatePassword(process.env.SEED_ADMIN_PASSWORD);

    const role = roles.find((item) => item.name === "SUPER_ADMIN");
    const existingUser = await prisma.user.findUnique({
      where: { email: process.env.SEED_ADMIN_EMAIL.toLowerCase() },
    });

    if (!existingUser && role) {
      const password = await bcrypt.hash(process.env.SEED_ADMIN_PASSWORD, 12);
      await prisma.user.create({
        data: {
          name: process.env.SEED_ADMIN_NAME || "Super Admin",
          email: process.env.SEED_ADMIN_EMAIL.toLowerCase(),
          password,
          roleId: role.id,
          isActive: true,
        },
      });
    }
  }
};

