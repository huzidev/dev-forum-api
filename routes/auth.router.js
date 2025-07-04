const express = require("express");
const userController = require("../controllers/user.controller");
const router = express.Router();

router.post("/create-user", async (req, res) => {
  try {
    const response = await userController.createUserIfNotExists(req.body);

    if (response) {
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
