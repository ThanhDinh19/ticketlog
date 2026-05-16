import axiosClient from "./axiosClient";
import type { ApiResponse, SupportCategory, SupportReason } from "../types";

export async function getSupportReasonsManage() {
  const res = await axiosClient.get<ApiResponse<{
    categories: SupportCategory[];
    reasons: SupportReason[];
  }>>("/support-reasons");

  return res.data;
}

export async function createSupportReason(payload: {
  name: string;
  categoryId: number;
}) {
  const res = await axiosClient.post("/support-reasons", payload);
  return res.data;
}

export async function updateSupportReasons(payload: {
  reasons: {
    id: number;
    name: string;
    categoryId: number;
    isActive: boolean;
  }[];
}) {
  const res = await axiosClient.put("/support-reasons", payload);
  return res.data;
}