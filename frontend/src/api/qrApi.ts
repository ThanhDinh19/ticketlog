import axiosClient from "./axiosClient";

export async function getQrInfo() {
  const res = await axiosClient.get("/qr");
  return res.data;
}

export function getQrImageUrl() {
  const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:8001/api";
  return `${baseUrl}/qr/image?v=${Date.now()}`;
}