const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/industryApplicationController");

router.post("/", ctrl.apply);
router.post("/proposal", ctrl.sendProposal);
router.get("/mine", ctrl.listMine);
router.get("/organisation", ctrl.listForOrganisation);
router.put("/:id/withdraw", ctrl.withdraw);
router.put("/:id/status", ctrl.updateForOrganisation);

module.exports = router;
