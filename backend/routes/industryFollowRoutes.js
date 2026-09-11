const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/industryFollowController");

router.post("/", ctrl.create);
router.get("/", ctrl.getAll);
router.get("/user/:userId", ctrl.getByUser);
router.delete("/:id", ctrl.remove);

module.exports = router;
