require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");

const supportRoutes = require("./src/routes/support.routes");
const reportRoutes = require("./src/routes/report.routes");
const workdayConfigRoutes = require("./src/routes/workdayConfig.routes");
const supportReasonRoutes = require("./src/routes/supportReason.routes");
const qrRoutes = require("./src/routes/qr.routes");
const authRoutes = require("./src/routes/auth.routes");

const app = express();

app.use(cors({ origin: "*" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Support Web API is running"
    });
});

app.use("/api/auth", authRoutes);
app.use("/api/support", supportRoutes);
app.use("/api/report", reportRoutes);
app.use("/api/workday-configs", workdayConfigRoutes);
app.use("/api/support-reasons", supportReasonRoutes);
app.use("/api/qr", qrRoutes);


// Serve frontend static files and handle client-side routing
const frontendDistPath = path.join(__dirname, "../frontend/dist");
app.use(express.static(frontendDistPath));
app.get(/^\/(?!api).*/, (req, res) => {
  res.sendFile(path.join(frontendDistPath, "index.html"));
});

const port = process.env.PORT || 8001;

app.listen(port, "0.0.0.0", () => {
    console.log(`Backend API running at http://${"0.0.0.0"}:${port}`);
});