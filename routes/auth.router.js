const express = require("express");
const crypto = require("crypto");
const userController = require("../controllers/user.controller");

const router = express.Router();

function verifyClerkWebhook(rawBody, signatureHeader, secret) {
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  return expectedSignature === signatureHeader;
}

router.post("/create-user", async (req, res) => {
  try {
    const rawBody = req.rawBody;
    const signature = req.headers["clerk-signature"];

    const origin = req.headers["x-clerk-origin"] || req.headers["origin"];

    console.log("SW what is origin", origin);
    
    const isAdmin = origin?.includes("admin");
    const secret = isAdmin
      ? process.env.ADMIN_CLERK_WEBHOOK_SECRET
      : process.env.USER_CLERK_WEBHOOK_SECRET;

    if (!verifyClerkWebhook(rawBody, signature, secret)) {
      return res.status(401).json({ error: "Invalid webhook signature" });
    }


    const result = await userController.createUserIfNotExists(
      JSON.parse(rawBody),
      isAdmin ? "ADMIN" : "USER"
    );

    if (result) {
      return res.status(200).json({
        success: true,
        data: result.user,
        created: result.created,
      });
    } else {
      return res.status(400).json({
        success: false,
        error: "Failed to create or retrieve user",
      });
    }
  } catch (error) {
    console.error("Webhook error:", error);
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
