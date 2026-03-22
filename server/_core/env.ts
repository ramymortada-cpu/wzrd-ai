function requireEnv(name: string, value: string | undefined): string {
  if (!value || value.trim() === '') {
    console.warn(`[ENV] Warning: ${name} is not set`);
    return '';
  }
  return value;
}

export const ENV = {
  // App
  appId: process.env.VITE_APP_ID ?? "primo-command-center",
  isProduction: process.env.NODE_ENV === "production",
  port: parseInt(process.env.PORT || "3000"),

  // Auth
  cookieSecret: requireEnv('JWT_SECRET', process.env.JWT_SECRET),
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",

  // Database (Railway MySQL)
  databaseUrl: requireEnv('DATABASE_URL', process.env.DATABASE_URL),

  // ═══════════════════════════════════════
  // LLM — DUAL PROVIDER SETUP
  // ═══════════════════════════════════════
  
  // PRIMARY: Groq (free/cheap — used for 80% of calls)
  groqApiKey: process.env.GROQ_API_KEY ?? "",
  groqApiUrl: process.env.GROQ_API_URL ?? "https://api.groq.com/openai",
  groqModel: process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile",

  // PREMIUM: Anthropic Claude (smart — used for deliverables/proposals)
  claudeApiKey: process.env.ANTHROPIC_API_KEY ?? "",
  claudeApiUrl: process.env.CLAUDE_API_URL ?? "https://api.anthropic.com",
  claudeModel: process.env.CLAUDE_MODEL ?? "claude-sonnet-4-20250514",

  // Legacy compatibility
  llmApiKey: process.env.ANTHROPIC_API_KEY ?? process.env.GROQ_API_KEY ?? "",
  llmApiUrl: process.env.LLM_API_URL ?? "",
  llmModel: process.env.LLM_MODEL ?? "",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",

  // Email notifications (optional)
  emailProvider: process.env.EMAIL_PROVIDER ?? "none",
  emailApiKey: process.env.EMAIL_API_KEY ?? "",
  emailFrom: process.env.EMAIL_FROM ?? "Primo Marca <noreply@primomarca.com>",

  // WhatsApp/Telegram (optional)
  whatsappToken: process.env.WHATSAPP_TOKEN ?? "",
  whatsappPhoneId: process.env.WHATSAPP_PHONE_ID ?? "",
  whatsappVerifyToken: process.env.WHATSAPP_VERIFY_TOKEN ?? "",
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN ?? "",

  // S3 file uploads (optional)
  awsS3Bucket: process.env.AWS_S3_BUCKET ?? "",
  awsRegion: process.env.AWS_REGION ?? "me-south-1",

  // Frontend
  appUrl: process.env.APP_URL ?? "http://localhost:3000",
};
