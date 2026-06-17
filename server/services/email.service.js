import sendEmail from "../utils/sendEmail.js";
import { prisma } from "../config/db.js";
import { getStoreConfig } from "../utils/storeConfig.js";

const BASE_STYLES = `
  body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.6; color: #1e293b; background-color: #f8fafc; margin: 0; padding: 0; }
  .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 40px rgba(3, 95, 150, 0.06); border: 1px solid #e2e8f0; }
  .header { background: linear-gradient(135deg, #035F96, #024d79); color: #ffffff; text-align: center; padding: 40px 30px; }
  .header-accent { display: inline-block; background: rgba(234, 244, 251, 0.2); color: #eaf4fb; font-size: 11px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; padding: 6px 14px; border-radius: 20px; margin-bottom: 12px; }
  .content { padding: 40px 30px; }
  h1 { margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.02em; }
  h2 { color: #0f172a; font-size: 20px; margin-top: 0; font-weight: 700; }
  p { margin-bottom: 20px; font-size: 15px; color: #475569; line-height: 1.7; }
  .button-container { text-align: center; margin: 30px 0; }
  .button { display: inline-block; padding: 14px 36px; background: #035F96; color: #ffffff !important; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 15px; letter-spacing: 0.03em; box-shadow: 0 4px 14px rgba(3, 95, 150, 0.2); }
  .info-box { background: #f8fafc; border: 1px solid #e2e8f0; padding: 20px; border-radius: 12px; margin: 24px 0; }
  .info-box h3 { margin-top: 0; color: #035F96; font-size: 13px; text-transform: uppercase; letter-spacing: 0.1em; }
  .otp-code { font-size: 36px; font-weight: 800; color: #035F96; letter-spacing: 8px; text-align: center; padding: 15px; background: #eaf4fb; border-radius: 12px; border: 1px dashed #035F96; margin: 20px 0; }
  .footer { text-align: center; padding: 24px; font-size: 12px; color: #64748b; background: #f8fafc; border-top: 1px solid #e2e8f0; }
  .footer a { color: #035F96; text-decoration: none; }
`;

const getFooter = () => `
  <div class="footer">
    © ${new Date().getFullYear()} Radiant Rays | Cleanroom Equipment Manufacturer<br>
    <a href="mailto:info@radiantraysindia.com">info@radiantraysindia.com</a> &nbsp;·&nbsp; +91 731 815 8417<br>
    This is an automated message. Please do not reply directly.
  </div>
`;

const dispatchAndLog = async (to, subject, templateName, html) => {
  let status = "SENT";
  let errorMessage = null;

  try {
    await sendEmail({
      email: to,
      subject,
      html,
    });
  } catch (error) {
    status = "FAILED";
    errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Failed to send email to ${to}:`, error);
  }

  // Log to database
  try {
    await prisma.emailLog.create({
      data: {
        to,
        subject,
        template: templateName,
        status,
        errorMessage,
      },
    });
  } catch (logError) {
    console.error("Failed to write email log to database:", logError);
  }

  // In development, do not crash the request flow if email delivery fails
  if (status === "FAILED" && process.env.NODE_ENV === "production") {
    throw new Error(errorMessage || "Failed to dispatch email");
  }
};

export const emailService = {
  sendWelcome: async (email, name) => {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>${BASE_STYLES}</style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="header-accent">Account Active</div>
            <h1>Welcome to Radiant Rays</h1>
          </div>
          <div class="content">
            <h2>Hello ${name},</h2>
            <p>Thank you for creating an account with Radiant Rays.</p>
            <p>Your B2C customer portal is now active. You can browse our cleanroom furniture catalog, manage your saved shipping addresses, build wishlists, and track orders directly online.</p>
            <div class="button-container">
              <a href="${process.env.FRONTEND_URL || "http://localhost:3000"}" class="button">Visit Portal</a>
            </div>
          </div>
          ${getFooter()}
        </div>
      </body>
      </html>
    `;
    await dispatchAndLog(email, "Welcome to Radiant Rays", "welcome", html);
  },

  sendVerificationOtp: async (email, name, otp) => {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>${BASE_STYLES}</style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="header-accent">Email Verification</div>
            <h1>Verify Your Account</h1>
          </div>
          <div class="content">
            <h2>Hello ${name},</h2>
            <p>Use the OTP code below to verify your email address and activate your customer account:</p>
            <div class="otp-code">${otp}</div>
            <p>This verification code is valid for 15 minutes. If you did not request this code, please disregard this email.</p>
          </div>
          ${getFooter()}
        </div>
      </body>
      </html>
    `;
    await dispatchAndLog(email, "Verify Your Account - OTP Code", "verify-email-otp", html);
  },

  sendForgotPasswordOtp: async (email, name, otp) => {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>${BASE_STYLES}</style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="header-accent">Security Request</div>
            <h1>Reset Your Password</h1>
          </div>
          <div class="content">
            <h2>Hello ${name},</h2>
            <p>We received a request to reset your password. Use the verification OTP code below to proceed:</p>
            <div class="otp-code">${otp}</div>
            <p>This security code is valid for 15 minutes. If you did not make this request, please change your password or contact support immediately to safeguard your account.</p>
          </div>
          ${getFooter()}
        </div>
      </body>
      </html>
    `;
    await dispatchAndLog(email, "Reset Password OTP", "forgot-password-otp", html);
  },

  sendPasswordChanged: async (email, name) => {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>${BASE_STYLES}</style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="header-accent">Account Security</div>
            <h1>Password Successfully Reset</h1>
          </div>
          <div class="content">
            <h2>Hello ${name},</h2>
            <p>The password for your customer account at Radiant Rays was successfully changed.</p>
            <p>If you did not authorize this change, please contact our support department immediately at info@radiantraysindia.com.</p>
          </div>
          ${getFooter()}
        </div>
      </body>
      </html>
    `;
    await dispatchAndLog(email, "Password Changed Successfully", "password-changed", html);
  },

  sendLeadReceived: async (email, name, details) => {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>${BASE_STYLES}</style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="header-accent">Inquiry Received</div>
            <h1>Thank You for Contacting Us</h1>
          </div>
          <div class="content">
            <h2>Dear ${name},</h2>
            <p>We have successfully received your sales request. One of our cleanroom experts will review your request and get back to you within 24 business hours.</p>
            <div class="info-box">
              <h3>Details Submitted:</h3>
              <p><strong>Message:</strong> ${details.message}</p>
              ${details.productName ? `<p><strong>Product:</strong> ${details.productName}</p>` : ""}
              ${details.company ? `<p><strong>Company:</strong> ${details.company}</p>` : ""}
            </div>
            <p>For immediate assistance, feel free to contact us via WhatsApp on +91 731 815 8417.</p>
          </div>
          ${getFooter()}
        </div>
      </body>
      </html>
    `;
    await dispatchAndLog(email, "Inquiry Received - Radiant Rays", "lead-received", html);
  },

  sendQuoteRequest: async (email, name, details) => {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>${BASE_STYLES}</style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="header-accent">Quote Request</div>
            <h1>Technical Specifications Requested</h1>
          </div>
          <div class="content">
            <h2>Dear ${name},</h2>
            <p>Thank you for requesting a technical quotation. Our engineering team is preparing the detailed product specs sheet for you.</p>
            <div class="info-box">
              <h3>Item Details:</h3>
              <p><strong>Product Name:</strong> ${details.productName}</p>
              ${details.variantName ? `<p><strong>Configuration/Variant:</strong> ${details.variantName}</p>` : ""}
              ${details.sku ? `<p><strong>SKU:</strong> ${details.sku}</p>` : ""}
              <p><strong>Message/Notes:</strong> ${details.message}</p>
            </div>
            <p>Our sales desk will dispatch the official commercial quote PDF to you shortly.</p>
          </div>
          ${getFooter()}
        </div>
      </body>
      </html>
    `;
    await dispatchAndLog(email, "Quote Request Received", "quote-request", html);
  },

  sendContactForm: async (email, name, details) => {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>${BASE_STYLES}</style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="header-accent">Contact Request</div>
            <h1>Inquiry Confirmed</h1>
          </div>
          <div class="content">
            <h2>Hello ${name},</h2>
            <p>Thank you for reaching out via our contact page. We have logged your request:</p>
            <div class="info-box">
              <p><strong>Subject:</strong> ${details.subject || "General Inquiry"}</p>
              <p><strong>Message:</strong> ${details.message}</p>
            </div>
          </div>
          ${getFooter()}
        </div>
      </body>
      </html>
    `;
    await dispatchAndLog(email, `Contact Submission Confirmed: ${details.subject || "General Inquiry"}`, "contact-form", html);
  },

  sendOrderConfirmation: async (email, name, order) => {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          ${BASE_STYLES}
          .item-row { border-bottom: 1px solid #e2e8f0; padding: 10px 0; }
          .item-row:last-child { border-bottom: none; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="header-accent">Order Confirmed</div>
            <h1>Your Order Has Been Confirmed!</h1>
          </div>
          <div class="content">
            <h2>Dear ${name},</h2>
            <p>Thank you for shopping with us. We have received your payment and are preparing your shipment. Order number is <strong>${order.orderNumber}</strong>.</p>
            
            <div class="info-box">
              <h3>Items Purchased:</h3>
              ${order.items.map((item) => `
                <div class="item-row">
                  <strong>${item.productName}</strong> ${item.variantName ? `(${item.variantName})` : ""}<br>
                  Qty: ${item.quantity} · Price: ₹${parseFloat(item.unitPrice).toFixed(2)}
                </div>
              `).join("")}
            </div>

            <div class="info-box">
              <h3>Pricing Summary:</h3>
              <p>Subtotal: ₹${parseFloat(order.subtotal).toFixed(2)}</p>
              ${parseFloat(order.discount) > 0 ? `<p>Discount: -₹${parseFloat(order.discount).toFixed(2)}</p>` : ""}
              <p>Tax: ₹${parseFloat(order.tax).toFixed(2)}</p>
              <p>Shipping: ₹${parseFloat(order.shipping).toFixed(2)}</p>
              <p><strong>Total Paid: ₹${parseFloat(order.total).toFixed(2)}</strong></p>
            </div>
          </div>
          ${getFooter()}
        </div>
      </body>
      </html>
    `;
    await dispatchAndLog(email, `Order Confirmation - #${order.orderNumber}`, "order-confirmation", html);
  },

  sendOrderSuccess: async (email, name, order) => {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>${BASE_STYLES}</style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="header-accent">Processing Order</div>
            <h1>Order Success Notification</h1>
          </div>
          <div class="content">
            <h2>Hello ${name},</h2>
            <p>Your order #${order.orderNumber} has entered the packaging phase. You will receive tracking coordinates once dispatched via Shiprocket.</p>
          </div>
          ${getFooter()}
        </div>
      </body>
      </html>
    `;
    await dispatchAndLog(email, `Order In Production - #${order.orderNumber}`, "order-success", html);
  },

  sendPaymentSuccess: async (email, name, payment) => {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>${BASE_STYLES}</style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="header-accent">Transaction Success</div>
            <h1>Razorpay Payment Captured</h1>
          </div>
          <div class="content">
            <h2>Hello ${name},</h2>
            <p>Your online payment transaction was successful.</p>
            <div class="info-box">
              <p><strong>Amount:</strong> ₹${parseFloat(payment.amount).toFixed(2)}</p>
              <p><strong>Razorpay Payment ID:</strong> ${payment.razorpayPaymentId}</p>
              <p><strong>Razorpay Order ID:</strong> ${payment.razorpayOrderId}</p>
            </div>
          </div>
          ${getFooter()}
        </div>
      </body>
      </html>
    `;
    await dispatchAndLog(email, "Payment Receipt - Radiant Rays", "payment-success", html);
  },

  sendRefund: async (email, name, details) => {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>${BASE_STYLES}</style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="header-accent">Refund Processed</div>
            <h1>Your Refund Has Been Issued</h1>
          </div>
          <div class="content">
            <h2>Hello ${name},</h2>
            <p>We have successfully processed your refund for order <strong>${details.orderNumber}</strong>.</p>
            <div class="info-box">
              <h3>Refund Details:</h3>
              <p><strong>Refund Amount:</strong> ₹${parseFloat(details.amount).toFixed(2)}</p>
              <p><strong>Refund ID:</strong> ${details.refundId || "N/A"}</p>
              <p><strong>Expected Credit:</strong> 5–7 business days to your original payment method.</p>
            </div>
            <p>If you have any questions about your refund, please contact us at info@radiantraysindia.com.</p>
          </div>
          ${getFooter()}
        </div>
      </body>
      </html>
    `;
    await dispatchAndLog(email, `Refund Processed - Order #${details.orderNumber}`, "refund-processed", html);
  },

  sendLowStockAlert: async (adminEmail, productName, variantName, sku, stock) => {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>${BASE_STYLES}
          .warning-box { background: #fff7ed; border: 1px solid #fed7aa; padding: 20px; border-radius: 12px; margin: 24px 0; }
          .warning-box h3 { margin-top: 0; color: #c2410c; font-size: 13px; text-transform: uppercase; letter-spacing: 0.1em; }
          .stock-badge { display: inline-block; background: #fef2f2; color: #dc2626; font-size: 20px; font-weight: 800; padding: 8px 20px; border-radius: 10px; border: 1px solid #fca5a5; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="header-accent">⚠ Stock Alert</div>
            <h1>Low Inventory Warning</h1>
          </div>
          <div class="content">
            <h2>Inventory below threshold!</h2>
            <p>A product variant has fallen to <strong>5 or fewer units</strong> in stock and requires immediate attention.</p>
            <div class="warning-box">
              <h3>Product Details</h3>
              <p><strong>Product:</strong> ${productName}</p>
              <p><strong>Variant:</strong> ${variantName}</p>
              <p><strong>SKU:</strong> <code>${sku}</code></p>
              <p><strong>Current Stock:</strong> <span class="stock-badge">${stock} units</span></p>
            </div>
            <p>Please restock this item as soon as possible to avoid stockouts.</p>
          </div>
          ${getFooter()}
        </div>
      </body>
      </html>
    `;
    await dispatchAndLog(adminEmail, `⚠ Low Stock Alert — ${productName} (${variantName}) — ${stock} units left`, "low-stock-alert", html);
  },

  sendAdminNotification: async (email, subject, message) => {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>${BASE_STYLES}</style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="header-accent">Alert Notification</div>
            <h1>System Alert Details</h1>
          </div>
          <div class="content">
            <h2>Admin Security alert:</h2>
            <p>${message}</p>
          </div>
          ${getFooter()}
        </div>
      </body>
      </html>
    `;
    await dispatchAndLog(email, `[ADMIN SYSTEM] ${subject}`, "admin-notification", html);
  },

  sendNewsletterWelcome: async (email) => {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>${BASE_STYLES}</style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="header-accent">Subscribed</div>
            <h1>Newsletter Subscription Confirmed</h1>
          </div>
          <div class="content">
            <h2>Hello!</h2>
            <p>Thank you for subscribing to Radiant Rays updates.</p>
            <p>You will now receive our cleanroom technical bulletins, specification sheets, and compliance guides directly in your inbox.</p>
          </div>
          ${getFooter()}
        </div>
      </body>
      </html>
    `;
    await dispatchAndLog(email, "Subscribed to Radiant Rays Updates", "newsletter-welcome", html);
  },
};
