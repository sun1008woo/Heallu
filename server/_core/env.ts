const isProduction = process.env.NODE_ENV === "production";
const cookieSecret =
  process.env.JWT_SECRET ?? (isProduction ? "" : "heallu-dev-jwt-secret");

if (isProduction && !cookieSecret) {
  throw new Error("JWT_SECRET is required in production.");
}

export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret,
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction,
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  openAiApiKey: process.env.OPENAI_API_KEY ?? "",
  openAiModel: process.env.OPENAI_MODEL ?? "gpt-5-mini",
};
