import { registerAs } from '@nestjs/config';

export default registerAs('google', () => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const callbackUrl =
    process.env.GOOGLE_CALLBACK_URL ||
    'http://localhost:3000/api/auth/google/callback';
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4200';
  const isProduction = process.env.NODE_ENV === 'production';

  if (isProduction && (!clientId || !clientSecret)) {
    console.warn(
      'GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET should be set for Google OAuth',
    );
  }

  return {
    clientId: clientId || '',
    clientSecret: clientSecret || '',
    callbackUrl,
    frontendUrl,
    enabled: !!(clientId && clientSecret),
  };
});
