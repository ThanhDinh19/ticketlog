const express = require("express");

const {
  getSupportReasons,
  createSupportReason,
  updateSupportReasons
} = require("../controllers/supportReason.controller");

const router = express.Router();

router.get("/", getSupportReasons);
router.post("/", createSupportReason);
router.put("/", updateSupportReasons);

module.exports = router;