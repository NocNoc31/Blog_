import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from './db';
import { account, session, user, verification } from './db/schema';
import { sendEmail } from './email';

const baseURL =
  import.meta.env.BETTER_AUTH_URL ||
  import.meta.env.PUBLIC_SITE_URL ||
  process.env.BETTER_AUTH_URL ||
  process.env.PUBLIC_SITE_URL ||
  'http://localhost:4321';

const secret = import.meta.env.BETTER_AUTH_SECRET || process.env.BETTER_AUTH_SECRET;

if (!secret) {
  throw new Error('BETTER_AUTH_SECRET is not configured');
}

const trustedOrigins = [
  baseURL,
  ...(import.meta.env.DEV ? ['http://localhost:4321', 'http://127.0.0.1:4321'] : []),
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
  process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : null,
].filter((origin): origin is string => Boolean(origin));

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: { user, session, account, verification },
  }),
  baseURL,
  secret,
  trustedOrigins,
  user: {
    additionalFields: {
      role: {
        type: 'string',
        required: false,
        defaultValue: 'reader',
        input: false,
      },
    },
  },
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    requireEmailVerification: false,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: 'Đặt lại mật khẩu cho nét mực.',
        heading: 'Đặt lại mật khẩu',
        body: `Chào ${user.name}, mình nhận được yêu cầu đặt lại mật khẩu cho tài khoản này. Liên kết chỉ dùng được một lần và sẽ hết hạn sau ít phút.`,
        actionLabel: 'Đặt lại mật khẩu',
        actionUrl: url,
        footnote:
          'Nếu bạn không yêu cầu thay đổi này, hãy bỏ qua email. Mật khẩu hiện tại vẫn an toàn.',
      });
    },
  },
  emailVerification: {
    sendOnSignUp: false,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: 'Xác thực email cho nét mực.',
        heading: 'Xác thực email',
        body: `Chào ${user.name}, xác thực email để hoàn tất tài khoản và nhận thông báo quan trọng từ nét mực.`,
        actionLabel: 'Xác thực email',
        actionUrl: url,
        footnote: 'Nếu bạn không tạo tài khoản này, hãy bỏ qua email.',
      });
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5,
    },
  },
  rateLimit: {
    enabled: true,
    window: 60,
    max: 60,
    customRules: {
      '/sign-in/email': { window: 60, max: 10 },
      '/sign-up/email': { window: 60, max: 6 },
      '/request-password-reset': { window: 60, max: 5 },
      '/send-verification-email': { window: 60, max: 3 },
    },
  },
});

export type AuthSession = typeof auth.$Infer.Session;
