const express = require("express");

const {
  getWorkdayConfigs,
  updateWorkdayConfigs
} = require("../controllers/workdayConfig.controller");

const router = express.Router();

router.get("/", getWorkdayConfigs);
router.put("/", updateWorkdayConfigs);

module.exports = router;