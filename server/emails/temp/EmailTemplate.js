import { getStoreConfig } from "../../utils/storeConfig.js";

/* ─── Shared styles ──────────────────────────────────────────────────── */
const BASE_STYLES = `
  body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.6; color: #111827; background-color: #F7FAFC; margin: 0; padding: 0; }
  .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,94,184,0.08); border: 1px solid #DCE7F2; }
  .header { background: linear-gradient(135deg, #005EB8, #0074e4); color: #ffffff; text-align: center; padding: 48px 40px; }
  .header-accent { display: inline-block; background: rgba(22,199,217,0.2); color: #16C7D9; font-size: 11px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; padding: 6px 14px; border-radius: 20px; margin-bottom: 16px; border: 1px solid rgba(22,199,217,0.3); }
  .content { padding: 40px; }
  h1 { margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.02em; }
  h2 { color: #0A2540; font-size: 22px; margin-top: 0; font-weight: 700; }
  p { margin-bottom: 20px; font-size: 15px; color: #4b5563; line-height: 1.7; }
  .button-container { text-align: center; margin: 32px 0; }
  .button { display: inline-block; padding: 15px 40px; background: linear-gradient(135deg, #005EB8, #0074e4); color: #ffffff !important; text-decoration: none; border-radius: 12px; font-weight: 800; font-size: 15px; letter-spacing: 0.03em; box-shadow: 0 6px 20px rgba(0,94,184,0.35); }
  .info-box { background: rgba(0,94,184,0.04); border: 1px solid #DCE7F2; padding: 24px; border-radius: 14px; margin: 24px 0; }
  .info-box h3 { margin-top: 0; color: #005EB8; font-size: 13px; text-transform: uppercase; letter-spacing: 0.1em; }
  .feature-item { margin-bottom: 10px; padding-left: 26px; position: relative; color: #374151; font-weight: 500; font-size: 14px; }
  .feature-item:before { content: '✓'; position: absolute; left: 0; color: #16C7D9; font-weight: 900; }
  .footer { text-align: center; padding: 28px 30px; font-size: 12px; color: #9ca3af; background: #F7FAFC; border-top: 1px solid #DCE7F2; }
  .footer a { color: #005EB8; text-decoration: none; }
  .wa-cta { display: inline-block; margin-top: 10px; padding: 10px 24px; background: #25D366; color: white !important; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 13px; }
`;

const FOOTER_HTML = (store) => `
  <div class="footer">
    © ${new Date().getFullYear()} ${store.storeName} | ${store.storeTagline}<br>
    <a href="mailto:${store.storeEmail}">${store.storeEmail}</a> &nbsp;·&nbsp; ${store.storePhone}<br>
    <a href="https://wa.me/${store.socialWhatsapp}" class="wa-cta">Message us on WhatsApp</a><br><br>
    This is an automated message. Please do not reply directly.
  </div>
`;

/* ─── Verification Email ─────────────────────────────────────────────── */
export const getVerificationTemplate = (verificationLink, storeConfig = null) => {
    const store = storeConfig || getStoreConfig();
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your Email - ${store.storeName}</title>
    <style>${BASE_STYLES}</style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="header-accent">Trusted Healthcare Platform</div>
            <h1>Welcome to ${store.storeName}</h1>
        </div>
        <div class="content">
            <h2>Verify Your Email Address</h2>
            <p>Hi there,</p>
            <p>Thank you for registering with <strong>${store.storeName}</strong> — your trusted platform for genuine branded medicines and specialty healthcare products across India.</p>
            <p>Please verify your email address to complete your registration and start ordering:</p>
            <div class="button-container">
                <a href="${verificationLink}" class="button">Verify My Email</a>
            </div>
            <p style="font-size: 13px; color: #9ca3af;">If the button doesn't work, copy this link: ${verificationLink}</p>
            <div class="info-box">
                <h3>What we offer:</h3>
                <div class="feature-item">Genuine Branded Medicines — Verified Sources</div>
                <div class="feature-item">Specialty Care: IVF, Oncology, Transplants & More</div>
                <div class="feature-item">Cold Chain Delivery (2°C–8°C) Across India</div>
                <div class="feature-item">WhatsApp Support for Medicine Enquiries</div>
                <div class="feature-item">Affordable Pricing on Specialty Medicines</div>
            </div>
        </div>
        ${FOOTER_HTML(store)}
    </div>
</body>
</html>`;
};

/* ─── OTP Email ──────────────────────────────────────────────────────── */
export const getEmailOtpTemplate = (otp, expiresInMinutes = 10, storeConfig = null) => {
    const store = storeConfig || getStoreConfig();
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your OTP - ${store.storeName}</title>
    <style>
        ${BASE_STYLES}
        .otp { font-size: 42px; letter-spacing: 14px; font-weight: 900; color: #005EB8; background: rgba(0,94,184,0.06); padding: 22px; border-radius: 14px; display: inline-block; margin: 20px 0; border: 1px solid #DCE7F2; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="header-accent">Security Code</div>
            <h1>Verification Code</h1>
        </div>
        <div class="content" style="text-align: center;">
            <p>Use the code below to verify your account at <strong>${store.storeName}</strong>:</p>
            <div class="otp">${otp}</div>
            <p style="font-size: 14px; color: #ef4444; font-weight: 600;">This code expires in ${expiresInMinutes} minutes.</p>
            <p style="font-size: 13px; color: #9ca3af;">If you did not request this code, please ignore this email.</p>
        </div>
        ${FOOTER_HTML(store)}
    </div>
</body>
</html>`;
};

/* ─── Account Deletion ───────────────────────────────────────────────── */
export const getDeleteTemplate = (deletionLink, storeConfig = null) => {
    const store = storeConfig || getStoreConfig();
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Account Deletion - ${store.storeName}</title>
    <style>
        ${BASE_STYLES}
        .danger-header { background: linear-gradient(135deg, #dc2626, #b91c1c); }
        .danger-btn { background: #dc2626; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header danger-header">
            <h1>Account Deletion Request</h1>
        </div>
        <div class="content">
            <p>Hi,</p>
            <p>We received a request to permanently delete your <strong>${store.storeName}</strong> account. This action will remove all your order history and personal data.</p>
            <p>If you wish to proceed, click the button below:</p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="${deletionLink}" style="display:inline-block;padding:15px 35px;background:#dc2626;color:#fff!important;text-decoration:none;border-radius:12px;font-weight:700;">Confirm Account Deletion</a>
            </div>
            <p style="color: #ef4444; font-size: 14px;"><strong>Warning:</strong> This action cannot be undone.</p>
        </div>
        ${FOOTER_HTML(store)}
    </div>
</body>
</html>`;
};

/* ─── Reset Password ─────────────────────────────────────────────────── */
export const getResetTemplate = (resetLink, storeConfig = null) => {
    const store = storeConfig || getStoreConfig();
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Password - ${store.storeName}</title>
    <style>${BASE_STYLES}</style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="header-accent">Account Security</div>
            <h1>Reset Your Password</h1>
        </div>
        <div class="content" style="text-align: center;">
            <p>Forgot your password? Click the button below to set a new one for your <strong>${store.storeName}</strong> account:</p>
            <div class="button-container">
                <a href="${resetLink}" class="button">Reset My Password</a>
            </div>
            <p style="font-size: 13px; color: #9ca3af;">Link expires in 15 minutes. If you didn't request this, please ignore this email.</p>
        </div>
        ${FOOTER_HTML(store)}
    </div>
</body>
</html>`;
};

/* ─── Partner Reset Password ─────────────────────────────────────────── */
export const getPartnerResetTemplate = (resetLink, storeConfig = null) => {
    const store = storeConfig || getStoreConfig();
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Partner Password - ${store.storeName}</title>
    <style>
        ${BASE_STYLES}
        .security-note { background: #fffbeb; border: 1px solid #fde68a; color: #92400e; padding: 14px 18px; border-radius: 10px; margin-top: 20px; font-size: 13px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="header-accent">Partner Portal</div>
            <h1>Reset Partner Password</h1>
        </div>
        <div class="content">
            <h2>Password Reset Request</h2>
            <p>Dear Partner,</p>
            <p>We received a request to reset the password for your <strong>${store.storeName}</strong> Partner account. Click below to create a new password:</p>
            <div class="button-container">
                <a href="${resetLink}" class="button">Reset Partner Password</a>
            </div>
            <p style="font-size: 13px; color: #9ca3af;">If you can't click the button, paste this link in your browser: <br><strong>${resetLink}</strong></p>
            <div class="security-note">
                <strong>Security Note:</strong> This link expires in 1 hour. If you didn't request this reset, contact our support team immediately.
            </div>
        </div>
        ${FOOTER_HTML(store)}
    </div>
</body>
</html>`;
};

/* ─── Order Confirmation ─────────────────────────────────────────────── */
export const getOrderConfirmationTemplate = (data, storeConfig = null) => {
    const store = storeConfig || getStoreConfig();
    const hasDiscount = data.discount && parseFloat(data.discount) > 0;
    const hasCoupon = data.couponCode && data.couponCode.trim() !== "";

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Order Confirmation - ${store.storeName}</title>
    <style>
        ${BASE_STYLES}
        .order-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .order-table th { background: #005EB8; color: #fff; padding: 12px 10px; text-align: left; font-size: 13px; }
        .order-table td { padding: 12px 10px; border-bottom: 1px solid #DCE7F2; font-size: 14px; }
        .product-name { font-weight: 600; color: #0A2540; }
        .product-variant { font-size: 12px; color: #666; margin-top: 4px; }
        .original-price { text-decoration: line-through; color: #999; font-size: 12px; }
        .sale-price { color: #005EB8; font-weight: 600; }
        .summary-row { display: flex; justify-content: space-between; padding: 9px 0; border-bottom: 1px solid #DCE7F2; }
        .summary-row:last-child { border-bottom: none; }
        .total-row { font-size: 18px; font-weight: bold; padding-top: 14px; margin-top: 8px; border-top: 2px solid #0A2540; }
        .total-row .summary-value { color: #005EB8; }
        .discount-row { color: #16C7D9; }
        .savings-box { background: rgba(22,199,217,0.08); border: 1px solid rgba(22,199,217,0.3); border-radius: 10px; padding: 14px; margin: 14px 0; text-align: center; }
        .savings-text { color: #005EB8; font-weight: 600; font-size: 15px; }
        .coupon-badge { display: inline-block; background: rgba(0,94,184,0.1); color: #005EB8; padding: 3px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; margin-left: 8px; }
        .detail-label { font-weight: bold; display: inline-block; width: 150px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="header-accent">Order Confirmed</div>
            <h1>Thank You For Your Order!</h1>
        </div>
        <div class="content">
            <h2>Order Summary</h2>
            <p>Dear ${data.userName},</p>
            <p>We've received your order and our team is now processing it. Here's a summary:</p>

            <div class="info-box">
                <div style="margin-bottom:8px;"><span class="detail-label">Order Number:</span> <strong>${data.orderNumber}</strong></div>
                <div style="margin-bottom:8px;"><span class="detail-label">Order Date:</span> ${new Date(data.orderDate).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}</div>
                <div style="margin-bottom:8px;"><span class="detail-label">Payment Method:</span> ${data.paymentMethod}</div>
                ${hasCoupon ? `<div><span class="detail-label">Coupon Applied:</span> <span class="coupon-badge">🎉 ${data.couponCode}</span></div>` : ""}
            </div>

            <table class="order-table">
                <thead>
                    <tr>
                        <th>Product</th>
                        <th style="text-align:center;">Qty</th>
                        <th style="text-align:right;">Price</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.items.map((item) => `
                    <tr>
                        <td>
                            <div class="product-name">${item.name}</div>
                            ${item.variant ? `<div class="product-variant">${item.variant}</div>` : ""}
                        </td>
                        <td style="text-align:center;">${item.quantity}</td>
                        <td style="text-align:right;">
                            ${item.originalPrice && parseFloat(item.originalPrice) > parseFloat(item.price)
                                ? `<div class="original-price">₹${parseFloat(item.originalPrice).toFixed(2)}</div>` : ""}
                            <div class="sale-price">₹${parseFloat(item.price).toFixed(2)}</div>
                        </td>
                    </tr>`).join("")}
                </tbody>
            </table>

            <div class="info-box">
                <div class="summary-row"><span style="color:#666;">Subtotal</span><span>₹${parseFloat(data.subtotal).toFixed(2)}</span></div>
                ${hasDiscount ? `<div class="summary-row discount-row"><span>Discount ${hasCoupon ? `(${data.couponCode})` : ""}</span><span>-₹${parseFloat(data.discount).toFixed(2)}</span></div>` : ""}
                <div class="summary-row"><span style="color:#666;">Shipping</span><span>${parseFloat(data.shipping) > 0 ? `₹${parseFloat(data.shipping).toFixed(2)}` : "FREE"}</span></div>
                <div class="summary-row"><span style="color:#666;">Tax</span><span>₹${parseFloat(data.tax).toFixed(2)}</span></div>
                ${parseFloat(data.codCharge) > 0 ? `<div class="summary-row"><span style="color:#666;">COD Surcharge</span><span>₹${parseFloat(data.codCharge).toFixed(2)}</span></div>` : ""}
                <div class="summary-row total-row"><span>Total</span><span class="summary-value">₹${parseFloat(data.total).toFixed(2)}</span></div>
            </div>

            ${hasDiscount ? `<div class="savings-box"><span class="savings-text">🎉 You saved ₹${parseFloat(data.discount).toFixed(2)} on this order!</span></div>` : ""}

            <div class="info-box">
                <h3>Shipping Address</h3>
                <p style="margin-bottom:0;">
                    <strong>${data.shippingAddress.name}</strong><br>
                    ${data.shippingAddress.street}<br>
                    ${data.shippingAddress.city}, ${data.shippingAddress.state} ${data.shippingAddress.postalCode}<br>
                    ${data.shippingAddress.country}
                    ${data.shippingAddress.phone ? `<br>📞 ${data.shippingAddress.phone}` : ""}
                </p>
            </div>

            <p>Track your order status in your account dashboard:</p>
            <div class="button-container">
                <a href="${process.env.FRONTEND_URL}/account/orders" class="button">Track Your Order</a>
            </div>
            <p style="font-size:12px;color:#999;">If you can't click the button: ${process.env.FRONTEND_URL}/account/orders</p>
        </div>
        ${FOOTER_HTML(store)}
    </div>
</body>
</html>`;
};

/* ─── Payment Receipt ────────────────────────────────────────────────── */
export const getFeeReceiptTemplate = (data) => {
    const store = getStoreConfig();
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Payment Receipt - ${store.storeName}</title>
    <style>${BASE_STYLES}</style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="header-accent">Payment Confirmed</div>
            <h1>Payment Receipt</h1>
        </div>
        <div class="content">
            <p>Hi ${data.userName},</p>
            <p>Your payment has been received successfully.</p>
            <div class="info-box">
                <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #DCE7F2;"><strong>Amount:</strong> <span>₹${data.amount}</span></div>
                <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #DCE7F2;"><strong>Transaction ID:</strong> <span>${data.paymentId}</span></div>
                <div style="display:flex;justify-content:space-between;padding:8px 0;"><strong>Date:</strong> <span>${new Date(data.date).toLocaleDateString()}</span></div>
            </div>
            <p>Your order is now being processed. We'll notify you once it's dispatched!</p>
        </div>
        ${FOOTER_HTML(store)}
    </div>
</body>
</html>`;
};

/* ─── Order Notification ─────────────────────────────────────────────── */
export const getFeeNotificationTemplate = (data) => {
    const store = getStoreConfig();
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Order Update - ${store.storeName}</title>
    <style>${BASE_STYLES}</style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="header-accent">Order Update</div>
            <h1>Order Notification</h1>
        </div>
        <div class="content">
            <h2>${data.title}</h2>
            <p>${data.description || `You have a new update regarding your recent order at ${store.storeName}.`}</p>
            <div class="info-box">
                <p><strong>Amount:</strong> ₹${data.amount}</p>
                <p><strong>Due Date:</strong> ${new Date(data.dueDate).toLocaleDateString()}</p>
            </div>
            <p>Please check your dashboard for more details.</p>
        </div>
        ${FOOTER_HTML(store)}
    </div>
</body>
</html>`;
};

/* ─── Payment Success ────────────────────────────────────────────────── */
export const getPaymentSuccessTemplate = (data) => {
    const store = getStoreConfig();
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Order Successful - ${store.storeName}</title>
    <style>${BASE_STYLES}</style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="header-accent">Payment Successful</div>
            <h1>Order Confirmed!</h1>
        </div>
        <div class="content">
            <p>Hi ${data.userName},</p>
            <p>Your order has been confirmed and payment processed successfully.</p>
            <div class="info-box">
                <p><strong>Amount:</strong> ₹${data.amount}</p>
                <p><strong>Order ID:</strong> ${data.paymentId}</p>
                <p><strong>Date:</strong> ${new Date(data.date).toLocaleString()}</p>
            </div>
            <p>Thank you for choosing <strong>${store.storeName}</strong> for your healthcare needs!</p>
        </div>
        ${FOOTER_HTML(store)}
    </div>
</body>
</html>`;
};

/* ─── Payment Failure ────────────────────────────────────────────────── */
export const getPaymentFailureTemplate = (data) => {
    const store = getStoreConfig();
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Payment Failed - ${store.storeName}</title>
    <style>
        ${BASE_STYLES}
        .fail-header { background: linear-gradient(135deg, #dc2626, #b91c1c); }
    </style>
</head>
<body>
    <div class="container">
        <div class="header fail-header">
            <h1>Payment Failed</h1>
        </div>
        <div class="content">
            <p>Unfortunately your payment could not be processed.</p>
            <div class="info-box">
                <p><strong>Order:</strong> ${data.feeTitle}</p>
                <p><strong>Error:</strong> ${data.error || "Transaction could not be completed"}</p>
            </div>
            <p>Possible reasons: insufficient funds, bank server issues, network connectivity, or transaction timeout.</p>
            <p>Please try again or contact your bank. You can also reach us on WhatsApp for assistance.</p>
            <div class="button-container">
                <a href="${process.env.FRONTEND_URL}/account/orders" class="button">Try Again</a>
            </div>
        </div>
        ${FOOTER_HTML(store)}
    </div>
</body>
</html>`;
};

/* ─── Fee Update ─────────────────────────────────────────────────────── */
export const getFeeUpdateTemplate = ({ name, feeTitle, oldAmount, newAmount, oldDate, newDate, reason }) => {
    const store = getStoreConfig();
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Order Update - ${store.storeName}</title>
    <style>${BASE_STYLES}</style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="header-accent">Order Update</div>
            <h1>Fee Update Notification</h1>
        </div>
        <div class="content">
            <p>Dear ${name},</p>
            <p>There has been an update to your order fee: <strong>${feeTitle}</strong></p>
            <div class="info-box">
                <h3>Update Details</h3>
                <p><strong>Amount:</strong> ₹${oldAmount} → ₹${newAmount}</p>
                <p><strong>Due Date:</strong> ${oldDate} → ${newDate}</p>
                <p><strong>Reason:</strong> ${reason}</p>
            </div>
            <p>If you have any questions, please contact our support team via WhatsApp.</p>
        </div>
        ${FOOTER_HTML(store)}
    </div>
</body>
</html>`;
};

/* ─── Contact Form ───────────────────────────────────────────────────── */
export const getContactFormTemplate = (data) => {
    const store = getStoreConfig();
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>New Inquiry - ${store.storeName}</title>
    <style>${BASE_STYLES}</style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="header-accent">Customer Inquiry</div>
            <h1>New Contact Inquiry</h1>
        </div>
        <div class="content">
            <h2>${data.subject || "Medicine Enquiry"}</h2>
            <div class="info-box">
                <p>${data.message}</p>
            </div>
            <div class="info-box">
                <h3>Contact Details</h3>
                <p><strong>Name:</strong> ${data.name}</p>
                <p><strong>Email:</strong> ${data.email}</p>
                <p><strong>Phone:</strong> ${data.phone || "Not provided"}</p>
            </div>
            <p>Please respond to this inquiry at your earliest convenience.</p>
        </div>
        ${FOOTER_HTML(store)}
    </div>
</body>
</html>`;
};

/* ─── Certificate Generated (kept for compatibility) ─────────────────── */
export const getCertificateGeneratedTemplate = (data) => {
    const store = getStoreConfig();
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Notification - ${store.storeName}</title>
    <style>${BASE_STYLES}</style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="header-accent">Notification</div>
            <h1>Account Update</h1>
        </div>
        <div class="content">
            <p>Dear ${data.userName},</p>
            <p>You have a new update on your ${store.storeName} account.</p>
            <div class="button-container">
                <a href="${process.env.FRONTEND_URL}/account" class="button">View Account</a>
            </div>
        </div>
        ${FOOTER_HTML(store)}
    </div>
</body>
</html>`;
};
