const express = require("express");
const router = express.Router();
const { search, create } = require("../controllers/skillController");

router.get("/", search);
router.post("/", create);

module.exports = router;
