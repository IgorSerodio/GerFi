import { vi } from "vitest";

// Interpolar a URL original do .env
let defaultUrl = process.env.DATABASE_URL || "";
defaultUrl = defaultUrl
  .replace("${POSTGRES_USER}", process.env.POSTGRES_USER || "postgres")
  .replace("${POSTGRES_PASSWORD}", process.env.POSTGRES_PASSWORD || "postgres")
  .replace("${POSTGRES_HOST}", process.env.POSTGRES_HOST || "localhost")
  .replace("${POSTGRES_PORT}", process.env.POSTGRES_PORT || "5432")
  .replace("${POSTGRES_DB}", process.env.POSTGRES_DB || "postgres");

if (defaultUrl) {
  const testUrl = new URL(defaultUrl);
  testUrl.pathname = "/gerfi_test";
  process.env.DATABASE_URL = testUrl.toString();
}

import { mockUserSession } from "./tests/utils/auth.mock";

// Mock global para a função getServerSession do next-auth
mockUserSession("Admin");
