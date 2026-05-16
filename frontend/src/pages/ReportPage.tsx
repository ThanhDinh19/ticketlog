import { useEffect, useState } from "react";
import {
    getPendingRequests,
    getReportMeta,
    getReportSummary,
    searchSupportRequests,
    bulkUpdateStatus
} from "../api/reportApi";
import type {
    ReportSummary,
    RequestStatus,
    SupportCategory,
    SupportReason,
    SupportRequestRow,
} from "../types";


import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    ArcElement,
    Tooltip,
    Legend,
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";
import { getReportCharts } from "../api/reportApi";

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    ArcElement,
    Tooltip,
    Legend
);

const emptySummary: ReportSummary = {
    total_requests: 0,
    total_new: 0,
    total_in_progress: 0,
    total_done: 0,
    total_reject: 0,
    total_minutes: 0,
    avg_minutes: 0,
    total_processing_minutes: 0,
    avg_processing_minutes: 0,
    total_receive_minutes: 0,
    avg_receive_minutes: 0,
    total_cost: 0,
    cost_unit: "VND",
};

export default function ReportPage() {
    const currentYear = new Date().getFullYear();

    const [activeTab, setActiveTab] = useState<"summary" | "pending" | "search">("summary");

    const [categories, setCategories] = useState<SupportCategory[]>([]);
    const [reasons, setReasons] = useState<SupportReason[]>([]);
    const [statuses, setStatuses] = useState<RequestStatus[]>([]);

    const [filterYear, setFilterYear] = useState(currentYear);
    const [filterMonth, setFilterMonth] = useState("all");
    const [filterWeek, setFilterWeek] = useState("all");
    const [weekOptions, setWeekOptions] = useState<
        {
            value: string;
            label: string;
            start: string;
            end: string;
        }[]
    >([]);

    const [fromDate, setFromDate] = useState(`${currentYear}-01-01`);
    const [toDate, setToDate] = useState(`${currentYear}-12-31`);

    const [categoryId, setCategoryId] = useState("all");
    const [reasonIds, setReasonIds] = useState("all");


    const [employeeId, setEmployeeId] = useState("");
    const [statusId, setStatusId] = useState("all");

    const [summary, setSummary] = useState<ReportSummary>(emptySummary);
    const [pendingRows, setPendingRows] = useState<SupportRequestRow[]>([]);
    const [searchRows, setSearchRows] = useState<SupportRequestRow[]>([]);
    const [loading, setLoading] = useState(false);

    const [charts, setCharts] = useState({
        requestByDay: [] as { label: string; total: number }[],
        minutesByDay: [] as { label: string; total: number }[],
        byReason: [] as { label: string; total: number }[],
        byStatus: [] as { label: string; total: number }[],
    });

    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [showCompleteModal, setShowCompleteModal] = useState(false);
    const [actualIssue, setActualIssue] = useState("");
    const [solutionText, setSolutionText] = useState("");

    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectReason, setRejectReason] = useState("");

    const [detailRow, setDetailRow] = useState<SupportRequestRow | null>(null);

    const [actionMessage, setActionMessage] = useState("");
    const [actionMessageType, setActionMessageType] = useState<"success" | "danger">("success");

    async function loadMeta() {
        const res = await getReportMeta();
        setCategories(res.data.categories || []);
        setReasons(res.data.reasons || []);
        setStatuses(res.data.statuses || []);
    }

    async function loadData() {
        setLoading(true);

        try {
            const common = {
                fromDate,
                toDate,
                reasonIds,
                categoryId,
            };

            const summaryRes = await getReportSummary(common);
            setSummary(summaryRes.data || emptySummary);


            const chartRes = await getReportCharts(common);
            setCharts(chartRes.data || {
                requestByDay: [],
                minutesByDay: [],
                byReason: [],
                byStatus: [],
            });

            const pendingRes = await getPendingRequests({
                ...common,
                employeeId,
            });
            setPendingRows(pendingRes.data || []);

            const searchRes = await searchSupportRequests({
                ...common,
                statusId,
            });



            setSearchRows(searchRes.data || []);
        } finally {
            setLoading(false);
        }
    }

    const selectedPendingRows = pendingRows.filter((row) =>
        selectedIds.includes(row.id)
    );

    const canMoveInProgress =
        selectedPendingRows.length > 0 &&
        selectedPendingRows.every((row) => row.status_id === 1);

    const canComplete =
        selectedPendingRows.length > 0 &&
        selectedPendingRows.every((row) => row.status_id === 4);

    const canReject =
        selectedPendingRows.length > 0 &&
        selectedPendingRows.every((row) => row.status_id === 1 || row.status_id === 4);

    const allPendingSelected =
        pendingRows.length > 0 &&
        pendingRows.every((row) => selectedIds.includes(row.id));


    const mainActionButton = (() => {
        if (canComplete) {
            return {
                label: "Hoàn thành",
                className: "btn btn-success",
                disabled: false,
                onClick: () => setShowCompleteModal(true),
            };
        }

        return {
            label: "Đang thực hiện",
            className: "btn btn-primary",
            disabled: !canMoveInProgress,
            onClick: () => handleBulkAction("in_progress" as const),
        };
    })();

    async function handleRejectSubmit() {
        try {
            const res = await bulkUpdateStatus({
                ids: selectedIds,
                action: "reject",
                rejectReason,
            });

            setActionMessageType("success");
            setActionMessage(res.message || "Đã hủy ticket.");

            setSelectedIds([]);
            setRejectReason("");
            setShowRejectModal(false);

            await loadData();
        } catch (error: any) {
            setActionMessageType("danger");
            setActionMessage(error.response?.data?.message || "Lỗi hủy ticket.");
        }
    }

    function toggleSelectOne(id: number) {
        setSelectedIds((prev) => {
            if (prev.includes(id)) {
                return prev.filter((x) => x !== id);
            }

            return [...prev, id];
        });
    }

    function toggleSelectAll() {
        if (allPendingSelected) {
            setSelectedIds([]);
        } else {
            setSelectedIds(pendingRows.map((row) => row.id));
        }
    }

    async function handleBulkAction(action: "in_progress" | "reject") {
        try {
            const res = await bulkUpdateStatus({
                ids: selectedIds,
                action,
            });

            setActionMessageType("success");
            setActionMessage(res.message || "Đã cập nhật trạng thái.");

            setSelectedIds([]);
            await loadData();
        } catch (error: any) {
            setActionMessageType("danger");
            setActionMessage(error.response?.data?.message || "Lỗi cập nhật trạng thái.");
        }
    }

    async function handleCompleteSubmit() {
        try {
            const res = await bulkUpdateStatus({
                ids: selectedIds,
                action: "complete",
                actualIssue,
                solution: solutionText,
            });

            setActionMessageType("success");
            setActionMessage(res.message || "Đã hoàn thành ticket.");

            setSelectedIds([]);
            setActualIssue("");
            setSolutionText("");
            setShowCompleteModal(false);

            await loadData();
        } catch (error: any) {
            setActionMessageType("danger");
            setActionMessage(error.response?.data?.message || "Lỗi hoàn thành ticket.");
        }
    }

    useEffect(() => {
        loadMeta();
    }, []);

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        const result = getDateRangeByFilter(filterYear, filterMonth, filterWeek);

        setFromDate(result.fromDate);
        setToDate(result.toDate);
        setWeekOptions(result.weeks);

        if (result.fixedWeek !== filterWeek) {
            setFilterWeek(result.fixedWeek);
        }
    }, [filterYear, filterMonth, filterWeek]);

    function formatMoney(value: number) {
        return Number(value || 0).toLocaleString("vi-VN");
    }

    function formatDate(value?: string) {
        if (!value) return "";
        return new Date(value).toLocaleString("vi-VN");
    }


    function toDateInputValue(date: Date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");

        return `${year}-${month}-${day}`;
    }

    function getLastDayOfMonth(year: number, month: number) {
        return new Date(year, month, 0).getDate();
    }

    function getWeekOptions(year: number, month: number) {
        const lastDay = getLastDayOfMonth(year, month);
        const weeks: {
            value: string;
            label: string;
            start: string;
            end: string;
        }[] = [];

        let current = new Date(year, month - 1, 1);
        const endMonth = new Date(year, month - 1, lastDay);
        let weekNo = 1;

        while (current <= endMonth) {
            const currentDay = current.getDay();
            // JS: Sunday = 0, Monday = 1, ..., Saturday = 6
            const daysUntilSaturday = (6 - currentDay + 7) % 7;

            let weekEnd = new Date(current);
            weekEnd.setDate(current.getDate() + daysUntilSaturday);

            if (weekEnd > endMonth) {
                weekEnd = endMonth;
            }

            const startText = current.toLocaleDateString("vi-VN", {
                day: "2-digit",
                month: "2-digit",
            });

            const endText = weekEnd.toLocaleDateString("vi-VN", {
                day: "2-digit",
                month: "2-digit",
            });

            weeks.push({
                value: String(weekNo),
                label: `Tuần ${weekNo} (${startText} - ${endText})`,
                start: toDateInputValue(current),
                end: toDateInputValue(weekEnd),
            });

            const next = new Date(weekEnd);
            next.setDate(weekEnd.getDate() + 1);
            current = next;
            weekNo += 1;
        }

        return weeks;
    }

    function getDateRangeByFilter(year: number, month: string, week: string) {
        if (month === "all") {
            return {
                fromDate: `${year}-01-01`,
                toDate: `${year}-12-31`,
                weeks: [],
                fixedWeek: "all",
            };
        }

        const monthNumber = Number(month);
        const lastDay = getLastDayOfMonth(year, monthNumber);
        const weeks = getWeekOptions(year, monthNumber);

        if (week !== "all") {
            const selectedWeek = weeks.find((w) => w.value === week);

            if (selectedWeek) {
                return {
                    fromDate: selectedWeek.start,
                    toDate: selectedWeek.end,
                    weeks,
                    fixedWeek: week,
                };
            }
        }

        return {
            fromDate: `${year}-${String(monthNumber).padStart(2, "0")}-01`,
            toDate: `${year}-${String(monthNumber).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`,
            weeks,
            fixedWeek: "all",
        };
    }

    return (
        <div className="container-fluid py-3">
            <h3 className="mb-3">Báo cáo hao phí thời gian hỗ trợ</h3>

            <ul className="nav nav-tabs mb-3">
                <li className="nav-item">
                    <button
                        className={`nav-link ${activeTab === "summary" ? "active" : ""}`}
                        onClick={() => setActiveTab("summary")}
                    >
                        <i className="bi bi-bar-chart me-1" />
                        Tổng quan
                    </button>
                </li>

                <li className="nav-item">
                    <button
                        className={`nav-link ${activeTab === "pending" ? "active" : ""}`}
                        onClick={() => setActiveTab("pending")}
                    >
                        <i className="bi bi-list-check me-1" />
                        Cần hỗ trợ
                    </button>
                </li>

                <li className="nav-item">
                    <button
                        className={`nav-link ${activeTab === "search" ? "active" : ""}`}
                        onClick={() => setActiveTab("search")}
                    >
                        <i className="bi bi-search me-1" />
                        Tra cứu
                    </button>
                </li>
            </ul>

            <div className="card shadow-sm border-0 mb-3">
                <div className="card-body">
                    <div className="row g-3 align-items-end">

                        <div className="col-12 col-md-2">
                            <label className="form-label">Năm</label>
                            <select
                                className="form-select"
                                value={filterYear}
                                onChange={(e) => {
                                    setFilterYear(Number(e.target.value));
                                    setFilterMonth("all");
                                    setFilterWeek("all");
                                }}
                            >
                                {Array.from({ length: 6 }).map((_, index) => {
                                    const year = currentYear - 3 + index;

                                    return (
                                        <option key={year} value={year}>
                                            {year}
                                        </option>
                                    );
                                })}
                            </select>
                        </div>

                        <div className="col-12 col-md-2">
                            <label className="form-label">Tháng</label>
                            <select
                                className="form-select"
                                value={filterMonth}
                                onChange={(e) => {
                                    setFilterMonth(e.target.value);
                                    setFilterWeek("all");
                                }}
                            >
                                <option value="all">Tất cả</option>
                                {Array.from({ length: 12 }).map((_, index) => {
                                    const month = index + 1;

                                    return (
                                        <option key={month} value={month}>
                                            Tháng {month}
                                        </option>
                                    );
                                })}
                            </select>
                        </div>

                        <div className="col-12 col-md-2">
                            <label className="form-label">Tuần</label>
                            <select
                                className="form-select"
                                value={filterWeek}
                                disabled={filterMonth === "all"}
                                onChange={(e) => setFilterWeek(e.target.value)}
                            >
                                <option value="all">Tất cả</option>
                                {weekOptions.map((week) => (
                                    <option key={week.value} value={week.value}>
                                        {week.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="col-12 col-md-2">
                            <label className="form-label">Từ ngày</label>
                            <input
                                type="date"
                                className="form-control"
                                value={fromDate}
                                onChange={(e) => setFromDate(e.target.value)}
                            />
                        </div>

                        <div className="col-12 col-md-2">
                            <label className="form-label">Đến ngày</label>
                            <input
                                type="date"
                                className="form-control"
                                value={toDate}
                                onChange={(e) => setToDate(e.target.value)}
                            />
                        </div>

                        <div className="col-12 col-md-2">
                            <label className="form-label">Team hỗ trợ</label>
                            <select
                                className="form-select"
                                value={categoryId}
                                onChange={(e) => setCategoryId(e.target.value)}
                            >
                                <option value="all">Tất cả</option>
                                {categories.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.code}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="col-12 col-md-3">
                            <label className="form-label">Loại hỗ trợ</label>
                            <select
                                className="form-select"
                                value={reasonIds}
                                onChange={(e) => setReasonIds(e.target.value)}
                            >
                                <option value="all">Tất cả</option>
                                {reasons.map((r) => (
                                    <option key={r.id} value={r.id}>
                                        {r.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {activeTab === "pending" && (
                            <div className="col-12 col-md-2">
                                <label className="form-label">Mã NV</label>
                                <input
                                    className="form-control"
                                    value={employeeId}
                                    onChange={(e) => setEmployeeId(e.target.value)}
                                />
                            </div>
                        )}

                        {activeTab === "search" && (
                            <div className="col-12 col-md-2">
                                <label className="form-label">Trạng thái</label>
                                <select
                                    className="form-select"
                                    value={statusId}
                                    onChange={(e) => setStatusId(e.target.value)}
                                >
                                    <option value="all">Tất cả</option>
                                    {statuses.map((s) => (
                                        <option key={s.id} value={s.id}>
                                            {s.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div className="col-12 col-md-1">
                            <button
                                className="btn btn-primary w-100"
                                onClick={loadData}
                                disabled={loading}
                            >
                                Lọc
                            </button>
                        </div>

                        <div className="col-12 col-md-2">
                            <button
                                className="btn btn-success w-100"
                                type="button"
                                onClick={() => alert("Phần xuất Excel sẽ làm API riêng sau.")}
                            >
                                Xuất Excel
                            </button>
                        </div>

                    </div>
                </div>
            </div>

            {activeTab === "summary" && (
                <>
                    <div className="row g-3 mb-3">
                        <SummaryCard title="Tổng yêu cầu" value={summary.total_requests} />
                        <SummaryCard title="Mới" value={summary.total_new} className="text-warning" />
                        <SummaryCard title="Đang thực hiện" value={summary.total_in_progress} className="text-primary" />
                        <SummaryCard title="Đã hoàn thành" value={summary.total_done} className="text-success" />
                        <SummaryCard title="Từ chối" value={summary.total_reject} className="text-danger" />
                        <SummaryCard title="Tổng thời gian chờ" value={summary.total_minutes} />

                        <SummaryCard
                            title="Tổng chi phí"
                            value={
                                <span className="summary-cost-value">
                                    <span className="summary-cost-number">
                                        {formatMoney(summary.total_cost)}
                                    </span>
                                    <span className="summary-cost-unit">
                                        {summary.cost_unit || "VND"}
                                    </span>
                                </span>
                            }
                        />

                        <SummaryCard title="TB thời gian chờ" value={summary.avg_minutes} />
                        <SummaryCard title="Tổng TG xử lý" value={summary.total_processing_minutes} />
                        <SummaryCard title="TB TG xử lý" value={summary.avg_processing_minutes} />
                        <SummaryCard title="Tổng TG tiếp nhận" value={summary.total_receive_minutes} />
                        <SummaryCard title="TB TG tiếp nhận" value={summary.avg_receive_minutes} />
                    </div>

                    <div className="row g-3">
                        <div className="col-12 col-xl-6">
                            <ChartCard title="Số lượng yêu cầu theo ngày">
                                <Bar
                                    data={makeBarData(charts.requestByDay, "Số yêu cầu")}
                                    options={barOptions}
                                />
                            </ChartCard>
                        </div>

                        <div className="col-12 col-xl-6">
                            <ChartCard title="Tổng phút xử lý theo ngày">
                                <Bar
                                    data={makeBarData(charts.minutesByDay, "Tổng phút xử lý")}
                                    options={barOptions}
                                />
                            </ChartCard>
                        </div>

                        <div className="col-12 col-xl-6">
                            <ChartCard title="Tỷ lệ lý do lỗi">
                                <Doughnut
                                    data={makeDoughnutData(charts.byReason)}
                                    options={doughnutOptions}
                                />
                            </ChartCard>
                        </div>

                        <div className="col-12 col-xl-6">
                            <ChartCard title="Trạng thái xử lý">
                                <Doughnut
                                    data={makeDoughnutData(charts.byStatus)}
                                    options={doughnutOptions}
                                />
                            </ChartCard>
                        </div>
                    </div>
                </>
            )}

            {activeTab === "pending" && (
                <>
                    {actionMessage && (
                        <div className={`alert alert-${actionMessageType}`}>
                            {actionMessage}
                        </div>
                    )}

                    <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                        <div className="text-muted">
                            Chỉ hiển thị các yêu cầu có trạng thái <strong>Mới</strong> và <strong>Đang thực hiện</strong>.
                        </div>

                        <div className="mobile-select-all-row">
                            <label className="mobile-select-all-label">
                                <input
                                    type="checkbox"
                                    checked={allPendingSelected}
                                    onChange={toggleSelectAll}
                                />
                                <span>Chọn tất cả</span>
                            </label>
                        </div>

                        <div className="d-flex gap-2 flex-wrap pending-action-bar">
                            <button
                                className={mainActionButton.className}
                                disabled={mainActionButton.disabled}
                                onClick={mainActionButton.onClick}
                            >
                                {mainActionButton.label}
                            </button>

                            <button
                                className="btn btn-danger"
                                disabled={!canReject}
                                onClick={() => setShowRejectModal(true)}
                            >
                                Hủy
                            </button>
                        </div>
                    </div>

                    <RequestTable
                        rows={pendingRows}
                        formatDate={formatDate}
                        selectable
                        selectedIds={selectedIds}
                        allSelected={allPendingSelected}
                        onToggleOne={toggleSelectOne}
                        onToggleAll={toggleSelectAll}
                    />

                    {showCompleteModal && (
                        <CompleteModal
                            actualIssue={actualIssue}
                            solutionText={solutionText}
                            setActualIssue={setActualIssue}
                            setSolutionText={setSolutionText}
                            onClose={() => setShowCompleteModal(false)}
                            onSubmit={handleCompleteSubmit}
                        />
                    )}

                    {showRejectModal && (
                        <RejectModal
                            rejectReason={rejectReason}
                            setRejectReason={setRejectReason}
                            onClose={() => setShowRejectModal(false)}
                            onSubmit={handleRejectSubmit}
                        />
                    )}
                </>
            )}

            {activeTab === "search" && (
                <>
                    <RequestTable
                        rows={searchRows}
                        formatDate={formatDate}
                        rowClickable
                        onRowClick={(row) => setDetailRow(row)}
                    />

                    {detailRow && (
                        <RequestDetailModal
                            row={detailRow}
                            onClose={() => setDetailRow(null)}
                        />
                    )}
                </>
            )}
        </div>
    );
}

function SummaryCard({
    title,
    value,
    className = "",
}: {
    title: string;
    value: React.ReactNode;
    className?: string;
}) {
    return (
        <div className="col-6 col-lg-2">
            <div className="card summary-card">
                <div className="card-body">
                    <div className="summary-title">{title}</div>
                    <div className={`summary-value ${className}`}>{value}</div>
                </div>
            </div>
        </div>
    );
}
function RequestTable({
    rows,
    formatDate,
    selectable = false,
    selectedIds = [],
    allSelected = false,
    onToggleOne,
    onToggleAll,
    rowClickable = false,
    onRowClick,
}: {
    rows: SupportRequestRow[];
    formatDate: (value?: string) => string;
    selectable?: boolean;
    selectedIds?: number[];
    allSelected?: boolean;
    onToggleOne?: (id: number) => void;
    onToggleAll?: () => void;
    rowClickable?: boolean;
    onRowClick?: (row: SupportRequestRow) => void;
}) {
    return (
        <>
            {/* DESKTOP TABLE */}
            <div className="card shadow-sm border-0 request-table-card">
                <div className="card-body">
                    <div className="table-responsive support-table-wrap">
                        <table className="table table-bordered table-sm align-middle support-table">
                            <colgroup>
                                {selectable && <col style={{ width: "5%" }} />}
                                <col style={{ width: "7%" }} />
                                <col style={{ width: "10%" }} />
                                <col style={{ width: "15%" }} />
                                <col style={{ width: "22%" }} />
                                <col style={{ width: "29%" }} />
                                <col style={{ width: "12%" }} />
                            </colgroup>

                            <thead className="table-dark">
                                <tr>
                                    {selectable && (
                                        <th className="text-center">
                                            <input
                                                type="checkbox"
                                                className="form-check-input"
                                                checked={allSelected}
                                                onChange={onToggleAll}
                                            />
                                        </th>
                                    )}
                                    <th>ID</th>
                                    <th>Mã NV</th>
                                    <th>Ngày YC</th>
                                    <th>Loại hỗ trợ</th>
                                    <th>Mô tả lỗi</th>
                                    <th>Trạng thái</th>
                                </tr>
                            </thead>

                            <tbody>
                                {rows.map((r) => (
                                    <tr
                                        key={r.id}
                                        className={rowClickable ? "clickable-row" : ""}
                                        onClick={() => {
                                            if (rowClickable) {
                                                onRowClick?.(r);
                                            }
                                        }}
                                    >
                                        {selectable && (
                                            <td
                                                className="text-center"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <input
                                                    type="checkbox"
                                                    className="form-check-input"
                                                    checked={selectedIds.includes(r.id)}
                                                    onChange={() => onToggleOne?.(r.id)}
                                                />
                                            </td>
                                        )}

                                        <td>{r.id}</td>
                                        <td>{r.employee_id}</td>
                                        <td>{formatDate(r.request_date)}</td>
                                        <td className="cell-wrap">{r.reason_name}</td>
                                        <td className="description-cell">
                                            {renderMultilineText(r.description || "")}
                                        </td>
                                        <td>
                                            <StatusBadge
                                                statusId={r.status_id}
                                                statusName={r.status_name}
                                            />
                                        </td>
                                    </tr>
                                ))}

                                {rows.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={selectable ? 7 : 6}
                                            className="text-center text-muted"
                                        >
                                            Không có dữ liệu.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* MOBILE CARDS */}
            <div className="request-mobile-list">
                {rows.map((r) => (
                    <div
                        key={r.id}
                        className={`request-mobile-card ${rowClickable ? "clickable-row" : ""}`}
                        onClick={() => {
                            if (rowClickable) {
                                onRowClick?.(r);
                            }
                        }}
                    >
                        <div className="request-mobile-card-top">
                            <div className="request-mobile-left">
                                {selectable && (
                                    <input
                                        type="checkbox"
                                        className="request-mobile-check"
                                        checked={selectedIds.includes(r.id)}
                                        onClick={(e) => e.stopPropagation()}
                                        onChange={() => onToggleOne?.(r.id)}
                                    />
                                )}

                                <div>
                                    <div className="request-mobile-id">ID #{r.id}</div>
                                    <div className="request-mobile-employee">
                                        {r.employee_id}
                                    </div>
                                </div>
                            </div>

                            <StatusBadge
                                statusId={r.status_id}
                                statusName={r.status_name}
                            />
                        </div>

                        <MobileInfoRow
                            label="Ngày YC"
                            value={formatDate(r.request_date)}
                        />

                        {rowClickable && (
                            <MobileInfoRow
                                label="Số phút HT"
                                value={formatDurationFromMinutes(r.waiting_minutes || 0)}
                            />
                        )}

                        <MobileInfoRow
                            label="Loại hỗ trợ"
                            value={r.reason_name}
                        />

                        <MobileInfoRow
                            label="Mô tả lỗi"
                            value={renderMultilineText(r.description || "")}
                        />
                    </div>
                ))}

                {rows.length === 0 && (
                    <div className="request-mobile-empty">
                        Không có dữ liệu.
                    </div>
                )}
            </div>
        </>
    );
}

function MobileInfoRow({
    label,
    value,
}: {
    label: string;
    value: React.ReactNode;
}) {
    return (
        <div className="request-mobile-row">
            <div className="request-mobile-label">{label}</div>
            <div className="request-mobile-value">{value}</div>
        </div>
    );
}

function renderMultilineText(value: string) {
    return value
        .replaceAll("\\n", "\n")
        .split(/\r?\n/)
        .map((line, index) => (
            <div key={index}>
                {line || "\u00A0"}
            </div>
        ));
}

function formatDateForTable(value?: string) {
    if (!value) return "";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    const time = date.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    });

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();

    return (
        <>
            <div>{time}</div>
            <div>{day}/{month}/{year}</div>
        </>
    );
}

function formatDurationFromMinutes(minutes: number) {
    const totalMinutes = Number(minutes || 0);

    if (totalMinutes <= 0) {
        return "0P";
    }

    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;

    if (hours > 0 && mins > 0) {
        return `${hours}G ${mins}P`;
    }

    if (hours > 0) {
        return `${hours}G`;
    }

    return `${mins}P`;
}

function StatusBadge({
    statusId,
    statusName,
}: {
    statusId: number;
    statusName: string;
}) {
    let className = "bg-secondary";

    if (statusId === 1) {
        className = "bg-warning text-dark";
    }

    if (statusId === 2) {
        className = "bg-success";
    }

    if (statusId === 3) {
        className = "bg-danger";
    }

    if (statusId === 4) {
        className = "bg-primary";
    }

    return <span className={`badge ${className}`}>{statusName}</span>;
}

function CompleteModal({
    actualIssue,
    solutionText,
    setActualIssue,
    setSolutionText,
    onClose,
    onSubmit,
}: {
    actualIssue: string;
    solutionText: string;
    setActualIssue: (value: string) => void;
    setSolutionText: (value: string) => void;
    onClose: () => void;
    onSubmit: () => void;
}) {
    return (
        <>
            <div className="modal fade show support-modal" style={{ display: "block" }}>
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">Xác nhận hoàn thành hỗ trợ</h5>
                            <button type="button" className="btn-close" onClick={onClose} />
                        </div>

                        <div className="modal-body">
                            <div className="mb-3">
                                <label className="form-label">
                                    Thực tế lỗi ghi nhận <span className="text-danger">*</span>
                                </label>
                                <textarea
                                    className="form-control"
                                    rows={4}
                                    value={actualIssue}
                                    onChange={(e) => setActualIssue(e.target.value)}
                                    placeholder="Nhập thực tế lỗi ghi nhận"
                                />
                            </div>

                            <div className="mb-3">
                                <label className="form-label">
                                    Hướng xử lý <span className="text-danger">*</span>
                                </label>
                                <textarea
                                    className="form-control"
                                    rows={4}
                                    value={solutionText}
                                    onChange={(e) => setSolutionText(e.target.value)}
                                    placeholder="Nhập hướng xử lý"
                                />
                            </div>

                            <div className="text-muted">
                                Nội dung này sẽ được lưu cho tất cả ticket đang được chọn.
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button className="btn btn-outline-secondary" onClick={onClose}>
                                Đóng
                            </button>

                            <button className="btn btn-success" onClick={onSubmit}>
                                Lưu hoàn thành
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="modal-backdrop fade show" />
        </>
    );
}

function RejectModal({
    rejectReason,
    setRejectReason,
    onClose,
    onSubmit,
}: {
    rejectReason: string;
    setRejectReason: (value: string) => void;
    onClose: () => void;
    onSubmit: () => void;
}) {
    return (
        <>
            <div className="modal fade show support-modal" style={{ display: "block" }}>
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">Xác nhận hủy hỗ trợ</h5>
                            <button type="button" className="btn-close" onClick={onClose} />
                        </div>

                        <div className="modal-body">
                            <div className="mb-3">
                                <label className="form-label">
                                    Lý do hủy <span className="text-danger">*</span>
                                </label>

                                <textarea
                                    className="form-control"
                                    rows={5}
                                    value={rejectReason}
                                    onChange={(e) => setRejectReason(e.target.value)}
                                    placeholder="Nhập lý do vì sao hủy yêu cầu hỗ trợ"
                                />
                            </div>

                            <div className="text-muted">
                                Lý do này sẽ được lưu cho tất cả ticket đang được chọn.
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button className="btn btn-outline-secondary" onClick={onClose}>
                                Đóng
                            </button>

                            <button className="btn btn-danger" onClick={onSubmit}>
                                Xác nhận hủy
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="modal-backdrop fade show" />
        </>
    );
}


function ChartCard({
    title,
    children,
}: {
    title: string;
    children: React.ReactNode;
}) {
    return (
        <div className="card chart-card shadow-sm border-0">
            <div className="card-body">
                <h5 className="mb-3">{title}</h5>
                <div className="chart-box">{children}</div>
            </div>
        </div>
    );
}

function makeBarData(rows: { label: string; total: number }[], label: string) {
    return {
        labels: rows.map((x) => x.label),
        datasets: [
            {
                label,
                data: rows.map((x) => Number(x.total || 0)),
                backgroundColor: "rgba(54, 162, 235, 0.45)",
                borderColor: "rgba(54, 162, 235, 1)",
                borderWidth: 1,
            },
        ],
    };
}

function makeDoughnutData(rows: { label: string; total: number }[]) {
    return {
        labels: rows.map((x) => x.label),
        datasets: [
            {
                data: rows.map((x) => Number(x.total || 0)),
                backgroundColor: [
                    "#36A2EB",
                    "#FF6384",
                    "#FFCE56",
                    "#4BC0C0",
                    "#9966FF",
                    "#FF9F40",
                    "#198754",
                    "#dc3545",
                ],
            },
        ],
    };
}

const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            position: "bottom" as const,
        },
    },
};

const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            position: "bottom" as const,
        },
    },
};

function RequestDetailModal({
    row,
    onClose,
}: {
    row: SupportRequestRow;
    onClose: () => void;
}) {
    const receiveTime = formatDurationBetween(row.request_date, row.started_date);
    const waitTime = formatDurationBetween(row.request_date, row.completed_date);
    const processTime = formatDurationBetween(row.started_date, row.completed_date);

    return (
        <>
            <div className="modal fade show detail-modal" style={{ display: "block" }}>
                <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
                    <div className="modal-content detail-modal-content">
                        <div className="modal-header detail-modal-header">
                            <h5 className="modal-title">
                                <i className="bi bi-shield-check me-2" />
                                Chi tiết yêu cầu hỗ trợ # {row.id}
                            </h5>

                            <button
                                type="button"
                                className="btn-close btn-close-white"
                                onClick={onClose}
                            />
                        </div>

                        <div className="modal-body">
                            <div className="row g-3">
                                <div className="col-12 col-md-6">
                                    <DetailBox
                                        icon="bi-person-badge"
                                        title="Mã nhân viên"
                                        value={row.employee_id}
                                        color="blue"
                                    />
                                </div>

                                <div className="col-12 col-md-6">
                                    <DetailBox
                                        icon="bi-activity"
                                        title="Trạng thái"
                                        value={
                                            <StatusBadge
                                                statusId={row.status_id}
                                                statusName={row.status_name}
                                            />
                                        }
                                        color="green"
                                    />
                                </div>

                                <div className="col-12 col-md-6">
                                    <DetailBox
                                        icon="bi-calendar-plus"
                                        title="Ngày yêu cầu"
                                        value={formatDateTime(row.request_date)}
                                        color="purple"
                                    />
                                </div>

                                <div className="col-12 col-md-6">
                                    <DetailBox
                                        icon="bi-play-circle"
                                        title="Ngày thực hiện"
                                        value={formatDateTime(row.started_date) || "Chưa thực hiện"}
                                        color="purple"
                                    />
                                </div>

                                <div className="col-12 col-md-6">
                                    <DetailBox
                                        icon="bi-check2-square"
                                        title="Ngày hoàn thành"
                                        value={formatDateTime(row.completed_date) || "Chưa hoàn thành"}
                                        color="purple"
                                    />
                                </div>

                                <div className="col-12 col-md-6">
                                    <DetailBox
                                        icon="bi-tags"
                                        title="Loại hỗ trợ"
                                        value={row.reason_name}
                                        color="orange"
                                    />
                                </div>

                                <div className="col-12 col-md-4">
                                    <DetailBox
                                        icon="bi-stopwatch"
                                        title="TG tiếp nhận"
                                        value={receiveTime || "0P 0S"}
                                        color="dark"
                                    />
                                </div>

                                <div className="col-12 col-md-4">
                                    <DetailBox
                                        icon="bi-hourglass-split"
                                        title="TG chờ xử lý"
                                        value={waitTime || "0P 0S"}
                                        color="dark"
                                    />
                                </div>

                                <div className="col-12 col-md-4">
                                    <DetailBox
                                        icon="bi-tools"
                                        title="TG xử lý"
                                        value={processTime || "0P 0S"}
                                        color="dark"
                                    />
                                </div>

                                <div className="col-12">
                                    <DetailTextBox
                                        icon="bi-exclamation-triangle"
                                        title="Mô tả lỗi"
                                        value={row.description || "Không có mô tả"}
                                        color="red"
                                    />
                                </div>

                                {row.actual_issue && (
                                    <div className="col-12">
                                        <DetailTextBox
                                            icon="bi-clipboard2-pulse"
                                            title="Thực tế lỗi ghi nhận"
                                            value={row.actual_issue}
                                            color="orange"
                                        />
                                    </div>
                                )}

                                {row.solution && (
                                    <div className="col-12">
                                        <DetailTextBox
                                            icon="bi-lightbulb"
                                            title="Hướng xử lý"
                                            value={row.solution}
                                            color="green"
                                        />
                                    </div>
                                )}

                                {row.reject_reason && (
                                    <div className="col-12">
                                        <DetailTextBox
                                            icon="bi-x-octagon"
                                            title="Lý do hủy"
                                            value={row.reject_reason}
                                            color="red"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button className="btn btn-outline-secondary" onClick={onClose}>
                                <i className="bi bi-x-circle me-1" />
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="modal-backdrop fade show" />
        </>
    );
}

function DetailBox({
    icon,
    title,
    value,
    color,
}: {
    icon: string;
    title: string;
    value: React.ReactNode;
    color: "blue" | "green" | "purple" | "orange" | "red" | "dark";
}) {
    return (
        <div className={`detail-box detail-${color}`}>
            <div className="detail-title">
                <span className="detail-icon">
                    <i className={`bi ${icon}`} />
                </span>
                {title}
            </div>

            <div className="detail-value">{value}</div>
        </div>
    );
}

function DetailTextBox({
    icon,
    title,
    value,
    color,
}: {
    icon: string;
    title: string;
    value: string;
    color: "blue" | "green" | "purple" | "orange" | "red" | "dark";
}) {
    return (
        <div className={`detail-box detail-text-box detail-${color}`}>
            <div className="detail-title">
                <span className="detail-icon">
                    <i className={`bi ${icon}`} />
                </span>
                {title}
            </div>

            <div className="detail-text">
                {value.split("\n").map((line, index) => (
                    <div key={index}>{line}</div>
                ))}
            </div>
        </div>
    );
}

function formatDateTime(value?: string) {
    if (!value) return "";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hour = String(date.getHours()).padStart(2, "0");
    const minute = String(date.getMinutes()).padStart(2, "0");
    const second = String(date.getSeconds()).padStart(2, "0");

    return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
}

function formatDurationBetween(start?: string, end?: string) {
    if (!start || !end) return "";

    const startDate = new Date(start);
    const endDate = new Date(end);

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
        return "";
    }

    const diffSeconds = Math.max(
        0,
        Math.floor((endDate.getTime() - startDate.getTime()) / 1000)
    );

    const minutes = Math.floor(diffSeconds / 60);
    const seconds = diffSeconds % 60;

    return `${minutes}P ${seconds}S`;
}