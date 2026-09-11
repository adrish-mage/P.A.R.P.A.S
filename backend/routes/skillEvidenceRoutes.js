const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/skillEvidenceController");

router.post("/", ctrl.create);
router.get("/", ctrl.getAll);
router.get("/user/:userId", ctrl.getByUser);
router.get("/:id", ctrl.getById);
router.put("/:id", ctrl.update);
router.delete("/:id", ctrl.remove);

module.exports = router;
