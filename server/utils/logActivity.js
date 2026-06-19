import { prisma } from "../config/db.js";

/**
 * Log an admin activity. Fire-and-forget — never throws.
 * @param {object} opts
 * @param {"LOGIN"|"LOGOUT"|"CREATE"|"UPDATE"|"DELETE"|"SYSTEM"} opts.type
 * @param {string} opts.title  - e.g. "Product created: AED Box"
 * @param {string} [opts.description]
 * @param {string} [opts.entityType] - "product" | "category" | "role" | "user" | ...
 * @param {string} [opts.entityId]
 * @param {object} [opts.metadata]  - any extra JSON
 * @param {string} [opts.actorId]   - req.user.id
 */
export async function logActivity({ type, title, description, entityType, entityId, metadata, actorId }) {
  try {
    await prisma.activityLog.create({
      data: {
        type,
        title,
        description: description || null,
        entityType: entityType || null,
        entityId: entityId || null,
        metadata: metadata || undefined,
        actorId: actorId || null,
      },
    });
  } catch {
    // silent — never break the request
  }
}
