import { prisma } from "../config/db.js";
import { ApiError } from "../utils/ApiError.js";
import { emailService } from "./email.service.js";
import { getPaginationParams, formatPaginatedResponse } from "../helpers/pagination.js";

export const leadService = {
  list: async (query, customerId = null) => {
    const { page, limit, skip } = getPaginationParams(query);
    const status = query.status;
    const search = String(query.search || "").trim();

    const source = query.source;
    const where = {
      ...(customerId ? { customerId } : {}),
      ...(status ? { status } : {}),
      ...(source ? { source: { contains: source, mode: "insensitive" } } : {}),
      ...(search
        ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
            { company: { contains: search, mode: "insensitive" } },
          ],
        }
        : {}),
    };

    const [items, total] = await prisma.$transaction([
      prisma.lead.findMany({
        where,
        include: {
          product: true,
          variant: true,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.lead.count({ where }),
    ]);

    return formatPaginatedResponse(items, page, limit, total);
  },

  getById: async (id) => {
    const lead = await prisma.lead.findUnique({
      where: { id },
      include: {
        product: true,
        variant: true,
      },
    });
    if (!lead) throw new ApiError(404, "Lead not found");
    return lead;
  },

  create: async (body) => {
    if (!body.name) {
      throw new ApiError(400, "Name is required");
    }

    const lead = await prisma.lead.create({
      data: {
        customerId: body.customerId || null,
        name: body.name,
        phone: body.phone,
        email: body.email || null,
        company: body.company || null,
        message: body.message,
        productId: body.productId || null,
        variantId: body.variantId || null,
        status: body.status || "NEW",
        adminNotes: body.adminNotes || null,
        source: body.source || null,
      },
      include: {
        product: true,
        variant: true,
      },
    });

    // Handle email notifications
    if (lead.email) {
      const emailDetails = {
        message: lead.message,
        productName: lead.product?.name || null,
        variantName: lead.variant?.name || null,
        sku: lead.variant?.sku || lead.product?.sku || null,
        company: lead.company,
      };

      if (body.source === "QUOTE") {
        await emailService.sendQuoteRequest(lead.email, lead.name, emailDetails);
      } else {
        await emailService.sendLeadReceived(lead.email, lead.name, emailDetails);
      }
    }

    // Notify Admins
    try {
      const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || process.env.ADMIN_EMAIL || "info@radiantraysindia.com";
      await emailService.sendAdminNotification(
        adminEmail,
        `New B2B Lead Received from ${lead.name}`,
        `You have received a new B2B inquiry from ${lead.name} (${lead.phone}, ${lead.email || "No email"}).\nSource: ${lead.source}\nMessage: ${lead.message}`
      );
    } catch (adminErr) {
      console.warn("Failed to notify admins of new lead:", adminErr.message);
    }

    return lead;
  },

  updateStatus: async (id, status, adminNotes) => {
    const existing = await prisma.lead.findUnique({ where: { id } });
    if (!existing) throw new ApiError(404, "Lead not found");

    const validStatuses = [
      "NEW", "CONTACTED", "QUALIFIED", "QUOTED", "APPROVED",
      "DESIGNING", "CUTTING", "FABRICATION", "PACKAGING",
      "READY_TO_SHIP", "DISPATCHED", "DELIVERED",
      "WON", "LOST", "CLOSED",
    ];
    if (status && !validStatuses.includes(status)) {
      throw new ApiError(400, "Invalid lead status");
    }

    return prisma.lead.update({
      where: { id },
      data: {
        ...(status ? { status } : {}),
        ...(adminNotes !== undefined ? { adminNotes } : {}),
      },
    });
  },

  delete: async (id) => {
    const existing = await prisma.lead.findUnique({ where: { id } });
    if (!existing) throw new ApiError(404, "Lead not found");

    await prisma.lead.delete({ where: { id } });
    return { success: true };
  },

  // Contact Submissions
  submitContactForm: async (body) => {
    if (!body.name || !body.email || !body.message) {
      throw new ApiError(400, "Name, email, and message are required");
    }

    const contact = await prisma.contactSubmission.create({
      data: {
        name: body.name,
        email: body.email,
        phone: body.phone || null,
        subject: body.subject || "General Inquiry",
        message: body.message,
        status: "NEW",
      },
    });

    // Send customer confirmation
    await emailService.sendContactForm(contact.email, contact.name, {
      subject: contact.subject,
      message: contact.message,
    });

    return contact;
  },

  listContactSubmissions: async () => {
    return prisma.contactSubmission.findMany({
      orderBy: { createdAt: "desc" },
    });
  },

  updateContactSubmission: async (id, body) => {
    const existing = await prisma.contactSubmission.findUnique({ where: { id } });
    if (!existing) throw new ApiError(404, "Contact submission not found");
    return prisma.contactSubmission.update({
      where: { id },
      data: {
        status: body.status ?? existing.status,
        adminNotes: body.adminNotes ?? existing.adminNotes,
      },
    });
  },

  deleteContactSubmission: async (id) => {
    const existing = await prisma.contactSubmission.findUnique({ where: { id } });
    if (!existing) throw new ApiError(404, "Contact submission not found");
    await prisma.contactSubmission.delete({ where: { id } });
    return { success: true };
  },

  // Newsletter Subscriptions
  subscribeNewsletter: async (email) => {
    if (!email) throw new ApiError(400, "Email is required");

    const existing = await prisma.newsletterSubscriber.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existing) {
      if (existing.isActive) {
        return { message: "Already subscribed", subscriber: existing };
      } else {
        const reactivated = await prisma.newsletterSubscriber.update({
          where: { email: email.toLowerCase() },
          data: { isActive: true },
        });
        return { message: "Subscription reactivated", subscriber: reactivated };
      }
    }

    const subscriber = await prisma.newsletterSubscriber.create({
      data: {
        email: email.toLowerCase(),
        isActive: true,
      },
    });

    return { message: "Subscribed successfully", subscriber };
  },

  unsubscribeNewsletter: async (email) => {
    if (!email) throw new ApiError(400, "Email is required");
    const subscriber = await prisma.newsletterSubscriber.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!subscriber) throw new ApiError(404, "Subscriber not found");

    return prisma.newsletterSubscriber.update({
      where: { email: email.toLowerCase() },
      data: { isActive: false },
    });
  },
};
