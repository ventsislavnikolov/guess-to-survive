export function assertBearerToken(authorizationHeader, expectedToken) {
  if (!authorizationHeader) {
    throw new Error("Missing Authorization header");
  }

  if (!authorizationHeader.startsWith("Bearer ")) {
    throw new Error("Invalid Authorization header");
  }

  const token = authorizationHeader.slice("Bearer ".length).trim();
  if (!token) {
    throw new Error("Missing bearer token");
  }

  if (!expectedToken) {
    throw new Error("Missing required environment variable: CRON_TOKEN");
  }

  if (token !== expectedToken) {
    throw new Error("Unauthorized");
  }
}

export function isCronAuthError(error) {
  if (!(error instanceof Error)) {
    return false;
  }

  return (
    error.message === "Missing Authorization header" ||
    error.message === "Invalid Authorization header" ||
    error.message === "Missing bearer token" ||
    error.message === "Unauthorized"
  );
}

export function assertCronAuthRequest(request, expectedToken) {
  const authHeader = request.headers.get("Authorization");
  assertBearerToken(authHeader, expectedToken);
}
