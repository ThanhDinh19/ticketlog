import axiosClient from "./axiosClient";
import type { ApiResponse, WorkdayConfig } from "../types";

export async function getWorkdayConfigs(year: number) {
  const res = await axiosClient.get<ApiResponse<WorkdayConfig[]>>("/workday-configs", {
    params: { year },
  });

  return res.data;
}

export async function updateWorkdayConfigs(payload: {
  year: number;
  configs: {
    month: number;
    averageSalary: number;
    standardWorkDays: number;
    workingHoursPerDay: number;
  }[];
}) {
  const res = await axiosClient.put("/workday-configs", payload);
  return res.data;
}