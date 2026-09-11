const express = require("express");
const router = express.Router();
const { getByUser, updateProfile } = require("../controllers/professionalProfileController");

router.get("/:userId", getByUser);
router.put("/:userId", updateProfile);

module.exports = router;
