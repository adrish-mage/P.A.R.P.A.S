const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/learningEnrollmentController");

router.post("/", ctrl.create);
router.get("/", ctrl.getAll);
router.get("/user/:userId", ctrl.getByUser);
router.put("/:id", ctrl.update);
router.delete("/:id", ctrl.remove);

module.exports = router;
