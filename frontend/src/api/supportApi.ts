import axiosClient from "./axiosClient";
import type { ApiResponse, SupportReason } from "../types";

export async function getSupportReasons() {
  const res = await axiosClient.get<ApiResponse<SupportReason[]>>("/support/reasons");
  return res.data;
}

export async function createSupportRequest(payload: {
  employeeId: string;
  reasonId: number;
  description: string;
}) {
  const res = await axiosClient.post("/support/requests", payload);
  return res.data;
}


export async function getNewRequestCount() {
  const res = await axiosClient.get("/support/new-count");
  return res.data;
}