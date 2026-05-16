import axiosClient from "./axiosClient";
import type {
  ApiResponse,
  ReportSummary,
  RequestStatus,
  SupportCategory,
  SupportReason,
  SupportRequestRow,
} from "../types";

export async function getReportMeta() {
  const res = await axiosClient.get<ApiResponse<{
    categories: SupportCategory[];
    reasons: SupportReason[];
    statuses: RequestStatus[];
  }>>("/report/meta");

  return res.data;
}

export async function getReportSummary(params: {
  fromDate: string;
  toDate: string;
  reasonIds?: string;
  categoryId?: string;
}) {
  const res = await axiosClient.get<ApiResponse<ReportSummary>>("/report/summary", {
    params,
  });

  return res.data;
}

export async function getPendingRequests(params: {
  fromDate: string;
  toDate: string;
  reasonIds?: string;
  categoryId?: string;
  employeeId?: string;
}) {
  const res = await axiosClient.get<ApiResponse<SupportRequestRow[]>>("/report/pending", {
    params,
  });

  return res.data;
}

export async function searchSupportRequests(params: {
  fromDate: string;
  toDate: string;
  reasonIds?: string;
  categoryId?: string;
  statusId?: string;
}) {
  const res = await axiosClient.get<ApiResponse<SupportRequestRow[]>>("/report/search", {
    params,
  });

  return res.data;
}

export async function getReportCharts(params: {
  fromDate: string;
  toDate: string;
  reasonIds?: string;
  categoryId?: string;
}) {
  const res = await axiosClient.get<ApiResponse<{
    requestByDay: { label: string; total: number }[];
    minutesByDay: { label: string; total: number }[];
    byReason: { label: string; total: number }[];
    byStatus: { label: string; total: number }[];
  }>>("/report/charts", {
    params,
  });

  return res.data;
}

export async function bulkUpdateStatus(payload: {
  ids: number[];
  action: "in_progress" | "complete" | "reject";
  actualIssue?: string;
  solution?: string;
  rejectReason?: string;
}) {
  const res = await axiosClient.put("/report/bulk-status", payload);
  return res.data;
}