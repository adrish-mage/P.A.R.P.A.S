const express = require("express");
const router = express.Router();
const {
  createAcademicRecord,
  getAcademicRecordsByUser,
  getAcademicRecordById,
  updateAcademicRecord,
  deleteAcademicRecord,
} = require("../controllers/academicRecordController");

router.post("/", createAcademicRecord);
router.get("/user/:userId", getAcademicRecordsByUser);
router.get("/:id", getAcademicRecordById);
router.put("/:id", updateAcademicRecord);
router.delete("/:id", deleteAcademicRecord);

module.exports = router;
