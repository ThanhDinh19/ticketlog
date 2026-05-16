const express = require("express");
const {
  getReasons,
  createSupportRequest,
  getNewRequestCount
} = require("../controllers/support.controller");

const router = express.Router();

router.get("/reasons", getReasons);
router.post("/requests", createSupportRequest);
router.get("/new-count", getNewRequestCount);

module.exports = router;