const express = require("express");

const {
  getReportMeta,
  getSummary,
  getPending,
  searchRequests,
  getCharts,
  bulkUpdateStatus
} = require("../controllers/report.controller");

const router = express.Router();

router.get("/meta", getReportMeta);
router.get("/summary", getSummary);
router.get("/pending", getPending);
router.get("/search", searchRequests);
router.get("/charts", getCharts);
router.put("/bulk-status", bulkUpdateStatus);

module.exports = router;