const express = require("express");

const {
  getQrInfo,
  getQrImage
} = require("../controllers/qr.controller");

const router = express.Router();

router.get("/", getQrInfo);
router.get("/image", getQrImage);

module.exports = router;