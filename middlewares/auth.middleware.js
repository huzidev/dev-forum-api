const { createClerkClient } = require("@clerk/backend");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// Map frontends to their respective Clerk credentials
const clerkEnvs = {
  "dev-forum-admin-c1ef577947a8.herokuapp.com": {
    secretKey: process.env.ADMIN_CLERK_SECRET_KEY,
    publishableKey: process.env.ADMIN_CLERK_PUBLISHABLE_KEY,
  },
  "dev-forum-main-9a195a790233.herokuapp.com": {
    secretKey: process.env.USER_CLERK_SECRET_KEY,
    publishableKey: process.env.USER_CLERK_PUBLISHABLE_KEY,
  },
};

function getClerkClientFromOrigin(origin) {
  const hostname = origin?.replace(/^https?:\/\//, "");
  const env = clerkEnvs[hostname];
  if (!env) return null;

  return createClerkClient({
    secretKey: env.secretKey,
    publishableKey: env.publishableKey,
  });
}

async function authenticate(req, res, next) {
  try {
    const origin = req.get("origin") || req.headers["x-forwarded-host"];
    const clerkClient = getClerkClientFromOrigin(origin);

    if (!clerkClient) {
      return res.status(403).json({ error: "Unrecognized frontend origin" });
    }

    const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;

    const result = await clerkClient.authenticateRequest({
      url: fullUrl,
      method: req.method,
      headers: req.headers,
    });

    if (!result.isAuthenticated) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { userId: clerkUserId } = result.toAuth();

    if (!clerkUserId) {
      return res.status(401).json({ error: "Unauthorized: No Clerk userId" });
    }

    const user = await prisma.user.findUnique({
      where: { userId: clerkUserId },
    });

    if (!user) {
      return res.status(404).json({ error: "User not registered in DB" });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error("Clerk auth error:", err);
    res.status(401).json({ error: "Unauthorized" });
  }
}

module.exports = { authenticate };
