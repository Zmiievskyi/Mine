import { registerAs } from '@nestjs/config';

export default registerAs('github', () => {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  const callbackUrl =
    process.env.GITHUB_CALLBACK_URL ||
    'http://localhost:3000/api/auth/github/callback';
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4200';
  const isProduction = process.env.NODE_ENV === 'production';

  if (isProduction && (!clientId || !clientSecret)) {
    console.warn(
      'GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET should be set for GitHub OAuth',
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
