const express = require("express");
const router = express.Router();
const { listForUser, acceptInvite, declineInvite } = require("../controllers/membershipController");

router.get("/user/:userId", listForUser);
router.put("/:id/accept", acceptInvite);
router.put("/:id/decline", declineInvite);

module.exports = router;
