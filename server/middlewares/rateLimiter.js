import rateLimit, { ipKeyGenerator } from "express-rate-limit";

// Rate limiter for OTP / register / resend (per email or IP — avoid blocking legitimate retries)
export const otpRateLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 8,
    message: {
        success: false,
        message: "Too many requests. Please try again after a minute.",
    },
    standardHeaders: true,
    legacyHeaders: false,

    keyGenerator: (req) => {
        // 1) If email is provided, use that
        try {
            const bodyEmail =
                req.body?.email || req.body?.data?.email;

            if (bodyEmail) return String(bodyEmail).toLowerCase();
        } catch (_) { }

        // 2) Otherwise use IPv6-safe builtin key generator
        return ipKeyGenerator(req);
    },
});


// Generic rate limiter (optional)
export const generalRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
});

export default otpRateLimiter;
