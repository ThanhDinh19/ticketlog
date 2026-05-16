import { useEffect, useState } from "react";
import { getQrImageUrl, getQrInfo } from "../api/qrApi";

export default function QrPage() {
  const [supportUrl, setSupportUrl] = useState("");

  useEffect(() => {
    getQrInfo().then((res) => {
      setSupportUrl(res.data?.supportUrl || "");
    });
  }, []);

  return (
    <div className="container py-4">
      <h3 className="mb-3">QR gọi hỗ trợ</h3>

      <div className="card shadow-sm border-0">
        <div className="card-body text-center">
          <img
            src={getQrImageUrl()}
            alt="QR gọi hỗ trợ"
            className="qr-image"
          />

          <div className="mt-3">
            <div className="text-muted mb-1">Đường dẫn:</div>
            <strong>{supportUrl}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}