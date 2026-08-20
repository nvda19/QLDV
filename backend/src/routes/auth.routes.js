const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const { authenticate } = require("../middlewares/auth.middleware");

router.post("/login", authController.login);
router.post("/refresh", authController.RefreshToken);
router.get("/me", authenticate, authController.getMe);
router.post("/logout", authenticate, authController.logout);
router.put("/change-password", authenticate, authController.changePassword);

module.exports = router;
