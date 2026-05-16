import { useEffect, useState } from "react";
import { getWorkdayConfigs, updateWorkdayConfigs } from "../api/workdayConfigApi";
import type { WorkdayConfig } from "../types";

export default function WorkdayConfigPage() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [configs, setConfigs] = useState<WorkdayConfig[]>([]);
  const [message, setMessage] = useState("");

  async function loadData() {
    const res = await getWorkdayConfigs(year);
    setConfigs(res.data || []);
  }

  useEffect(() => {
    loadData();
  }, [year]);

  function updateItem(month: number, field: keyof WorkdayConfig, value: string) {
    setConfigs((prev) =>
      prev.map((item) =>
        item.month === month
          ? {
            ...item,
            [field]: Number(value),
            cost_per_minute:
              field === "average_salary" || field === "standard_work_days" || field === "working_hours_per_day"
                ? Math.round(
                  (field === "average_salary" ? Number(value) : item.average_salary) /
                  (field === "standard_work_days" ? Number(value) : item.standard_work_days) /
                  (field === "working_hours_per_day" ? Number(value) : item.working_hours_per_day) /
                  60
                )
                : item.cost_per_minute,
          }
          : item
      )
    );
  }

  async function handleSave() {
    const res = await updateWorkdayConfigs({
      year,
      configs: configs.map((item) => ({
        month: item.month,
        averageSalary: Number(item.average_salary),
        standardWorkDays: Number(item.standard_work_days),
        workingHoursPerDay: Number(item.working_hours_per_day),
      })),
    });

    setMessage(res.message || "Đã lưu cấu hình.");
    await loadData();
  }

  return (
    <div className="workday-page">
      <div className="workday-page-header">
        <div>
          <h3>Cấu hình ngày công</h3>
          <p>
            Cấu hình lương trung bình, ngày công chuẩn và số giờ làm việc theo từng tháng.
          </p>
        </div>

        <div className="workday-year-box">
          <label>Năm</label>
          <select
            className="form-select workday-year-select"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
          >
            {Array.from({ length: 6 }).map((_, i) => {
              const y = currentYear - 3 + i;

              return (
                <option key={y} value={y}>
                  {y}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {message && <div className="alert alert-success">{message}</div>}

      <div className="card shadow-sm border-0">
        <div className="card-body">

          <div className="workday-save-bar">
            <button className="btn btn-primary" onClick={handleSave}>
              <i className="bi bi-save me-1" />
              Lưu tất cả
            </button>
          </div>

          {/* Desktop table */}
          <div className="workday-table-wrap">
            <div className="table-responsive">
              <table className="table table-bordered align-middle workday-table">
                <thead className="table-dark">
                  <tr>
                    <th>Tháng</th>
                    <th>Lương trung bình</th>
                    <th>Ngày công chuẩn</th>
                    <th>Giờ làm việc/ngày</th>
                    <th>Số tiền/phút</th>
                  </tr>
                </thead>

                <tbody>
                  {configs.map((item) => (
                    <tr key={item.month}>
                      <td>
                        <strong>Tháng {item.month}</strong>
                      </td>

                      <td>
                        <input
                          className="form-control"
                          type="number"
                          value={item.average_salary}
                          onChange={(e) =>
                            updateItem(item.month, "average_salary", e.target.value)
                          }
                        />
                      </td>

                      <td>
                        <input
                          className="form-control"
                          type="number"
                          value={item.standard_work_days}
                          onChange={(e) =>
                            updateItem(item.month, "standard_work_days", e.target.value)
                          }
                        />
                      </td>

                      <td>
                        <input
                          className="form-control"
                          type="number"
                          value={item.working_hours_per_day}
                          onChange={(e) =>
                            updateItem(item.month, "working_hours_per_day", e.target.value)
                          }
                        />
                      </td>

                      <td className="text-danger fw-bold">
                        {Number(item.cost_per_minute || 0).toLocaleString("vi-VN")} VND
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile cards */}
          <div className="workday-mobile-list">
            {configs.map((item) => (
              <div className="workday-mobile-card" key={item.month}>
                <div className="workday-mobile-head">
                  <div>
                    <div className="workday-mobile-title">Tháng {item.month}</div>
                    <div className="workday-mobile-subtitle">
                      Cấu hình lương / ngày công
                    </div>
                  </div>

                  <div className="workday-mobile-price">
                    {Number(item.cost_per_minute || 0).toLocaleString("vi-VN")} VND
                  </div>
                </div>

                <div className="workday-mobile-grid">
                  <label className="workday-mobile-field">
                    <span>Lương trung bình</span>
                    <input
                      type="number"
                      value={item.average_salary}
                      onChange={(e) =>
                        updateItem(item.month, "average_salary", e.target.value)
                      }
                    />
                  </label>

                  <label className="workday-mobile-field">
                    <span>Ngày công chuẩn</span>
                    <input
                      type="number"
                      value={item.standard_work_days}
                      onChange={(e) =>
                        updateItem(item.month, "standard_work_days", e.target.value)
                      }
                    />
                  </label>

                  <label className="workday-mobile-field">
                    <span>Giờ làm việc/ngày</span>
                    <input
                      type="number"
                      value={item.working_hours_per_day}
                      onChange={(e) =>
                        updateItem(item.month, "working_hours_per_day", e.target.value)
                      }
                    />
                  </label>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}