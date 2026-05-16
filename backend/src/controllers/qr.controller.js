const path = require("path");
const fs = require("fs");
const QRCode = require("qrcode");

function getSupportUrl() {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  return `${frontendUrl.replace(/\/$/, "")}/support`;
}

async function getQrInfo(req, res) {
  const supportUrl = getSupportUrl();

  return res.json({
    success: true,
    data: {
      supportUrl,
      qrImageUrl: "/api/qr/image"
    }
  });
}

async function getQrImage(req, res) {
  try {
    const supportUrl = getSupportUrl();

    const size = 700;

    let svg = await QRCode.toString(supportUrl, {
      type: "svg",
      errorCorrectionLevel: "H",
      margin: 2,
      width: size,
      color: {
        dark: "#000000",
        light: "#FFFFFF"
      }
    });

    const logoPath = path.join(
      process.cwd(),
      "public",
      "images",
      "logo-vietsun.jpg"
    );

    let logoBase64 = "";

    if (fs.existsSync(logoPath)) {
      logoBase64 = fs.readFileSync(logoPath).toString("base64");
    }

    // Thêm gradient giống QR cũ
    svg = svg.replace(
      "<svg ",
      `<svg `
    );

    svg = svg.replace(
      ">",
      `>
      <defs>
        <linearGradient id="qrGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#f59f28"/>
          <stop offset="100%" stop-color="#3f3f3f"/>
        </linearGradient>
      </defs>
      `
    );

    // QRCode package có thể dùng fill hoặc stroke tùy version
    svg = svg
      .replaceAll('fill="#000000"', 'fill="url(#qrGradient)"')
      .replaceAll('stroke="#000000"', 'stroke="url(#qrGradient)"');

    if (logoBase64) {
      const logoSvg = `
        <rect
          x="34%"
          y="42%"
          width="32%"
          height="16%"
          rx="3%"
          fill="#ffffff"
        />
        <image
          href="data:image/jpeg;base64,${logoBase64}"
          x="36%"
          y="44%"
          width="28%"
          height="12%"
          preserveAspectRatio="xMidYMid meet"
        />
      `;

      svg = svg.replace("</svg>", `${logoSvg}</svg>`);
    }

    res.setHeader("Content-Type", "image/svg+xml");
    res.setHeader("Cache-Control", "no-store");

    return res.send(svg);
  } catch (error) {
    console.error("getQrImage error:", error);

    return res.status(500).json({
      success: false,
      message: "Lỗi tạo QR code.",
      error: error.message
    });
  }
}

module.exports = {
  getQrInfo,
  getQrImage
};