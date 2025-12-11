import { registerAs } from '@nestjs/config';

export default registerAs('telegram', () => {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const botUsername = process.env.TELEGRAM_BOT_USERNAME;
  const botId = process.env.TELEGRAM_BOT_ID;
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4200';
  const isProduction = process.env.NODE_ENV === 'production';

  if (isProduction && !botToken) {
    console.warn('TELEGRAM_BOT_TOKEN should be set for Telegram OAuth');
  }

  return {
    botToken: botToken || '',
    botUsername: botUsername || '',
    botId: botId || '',
    frontendUrl,
    enabled: !!botToken,
  };
});
