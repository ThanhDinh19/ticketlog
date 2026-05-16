export type ApiResponse<T> = {
  success: boolean;
  message?: string;
  data: T;
  error?: string;
};

export type SupportReason = {
  id: number;
  name: string;
  category_id?: number;
  categoryId?: number;
  category_code?: string;
  category_name?: string;
  is_active?: boolean;
  isActive?: boolean;
};

export type SupportCategory = {
  id: number;
  code: string;
  name: string;
  is_active?: boolean;
};

export type RequestStatus = {
  id: number;
  name: string;
};

export type ReportSummary = {
  total_requests: number;
  total_new: number;
  total_in_progress: number;
  total_done: number;
  total_reject: number;
  total_minutes: number;
  avg_minutes: number;
  total_processing_minutes: number;
  avg_processing_minutes: number;
  total_receive_minutes: number;
  avg_receive_minutes: number;
  total_cost: number;
  cost_unit: string;
};

export type SupportRequestRow = {
  id: number;
  employee_id: string;
  request_date: string;
  reason_id: number;
  reason_name: string;
  category_code?: string;
  description?: string;
  status_id: number;
  status_name: string;
  started_date?: string;
  completed_date?: string;
  actual_issue?: string;
  solution?: string;
  reject_reason?: string;
  waiting_minutes?: number;
  processing_minutes?: number;
  receive_minutes?: number;
  
};

export type WorkdayConfig = {
  id: number;
  year: number;
  month: number;
  average_salary: number;
  standard_work_days: number;
  working_hours_per_day: number;
  cost_per_minute: number;
  is_active: boolean;
};