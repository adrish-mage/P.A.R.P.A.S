const express = require("express");
const router = express.Router();
const {
  digilockerLogin,
  customPipelineSignup,
  addAdminSubUser,
  getCurrentUser,
} = require("../controllers/authController");

router.post("/digilocker", digilockerLogin);
router.post("/custom-pipeline", customPipelineSignup);
router.post("/admin-sub-user", addAdminSubUser);
router.get("/me/:userId", getCurrentUser);

module.exports = router;
