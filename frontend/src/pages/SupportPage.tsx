import { useEffect, useState } from "react";
import { createSupportRequest, getSupportReasons } from "../api/supportApi";
import type { SupportReason } from "../types";


function formatCurrentDateTime(date: Date) {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();

    const hour = String(date.getHours()).padStart(2, "0");
    const minute = String(date.getMinutes()).padStart(2, "0");

    return `${day}/${month}/${year} ${hour}:${minute}`;
}

export default function SupportPage() {
    const [currentTime, setCurrentTime] = useState(formatCurrentDateTime(new Date()));
    const [reasons, setReasons] = useState<SupportReason[]>([]);
    const [employeeId, setEmployeeId] = useState("");
    const [reasonId, setReasonId] = useState("");
    const [description, setDescription] = useState("");
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState<"success" | "danger">("success");
    const [loading, setLoading] = useState(false);

    async function loadReasons() {
        const res = await getSupportReasons();
        setReasons(res.data || []);
    }

    useEffect(() => {
        loadReasons();
    }, []);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(formatCurrentDateTime(new Date()));
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setMessage("");

        if (!/^\d+$/.test(employeeId)) {
            setMessageType("danger");
            setMessage("Mã nhân viên chỉ được nhập số.");
            return;
        }

        if (!reasonId) {
            setMessageType("danger");
            setMessage("Vui lòng chọn lý do lỗi.");
            return;
        }

        try {
            setLoading(true);

            const res = await createSupportRequest({
                employeeId,
                reasonId: Number(reasonId),
                description,
            });

            if (res.success) {
                setMessageType("success");
                setMessage(res.message || "Đã lưu yêu cầu hỗ trợ thành công.");
                setEmployeeId("");
                setReasonId("");
                setDescription("");

                window.dispatchEvent(new Event("support-ticket-created"));
            } else {
                setMessageType("danger");
                setMessage(res.message || "Lỗi lưu yêu cầu.");
            }
        } catch (error: any) {
            setMessageType("danger");
            setMessage(error.response?.data?.message || "Lỗi lưu yêu cầu hỗ trợ.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="container py-4">
            <div className="row justify-content-center">
                <div className="col-12 col-lg-7">
                    <div className="card shadow-sm border-0">
                        <div className="card-body p-4">
                            <h3 className="mb-3">Gọi hỗ trợ</h3>

                            {message && (
                                <div className={`alert alert-${messageType}`}>
                                    {message}
                                </div>
                            )}

                            <form onSubmit={handleSubmit}>
                                <div className="mb-3">
                                    <label className="form-label">Mã nhân viên</label>
                                    <input
                                        value={employeeId}
                                        onChange={(e) => setEmployeeId(e.target.value)}
                                        className="form-control form-control-lg"
                                        required
                                        placeholder="Nhập mã nhân viên"
                                    />
                                </div>

                                <div className="mb-3">
                                    <label className="form-label">Ngày yêu cầu</label>
                                    <input
                                        type="text"
                                        className="form-control form-control-lg"
                                        value={currentTime}
                                        readOnly
                                        disabled
                                    />
                                </div>

                                <div className="mb-3">
                                    <label className="form-label">Lý do lỗi</label>
                                    <select
                                        value={reasonId}
                                        onChange={(e) => setReasonId(e.target.value)}
                                        className="form-select form-select-lg"
                                        required
                                    >
                                        <option value="">-- Chọn lý do --</option>
                                        {reasons.map((r) => (
                                            <option key={r.id} value={r.id}>
                                                {r.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="mb-3">
                                    <label className="form-label">Mô tả</label>
                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        className="form-control"
                                        rows={4}
                                        placeholder="Mô tả chi tiết vấn đề"
                                    />
                                </div>

                                <button className="btn btn-primary btn-lg w-100" disabled={loading}>
                                    {loading ? "Đang lưu..." : "Gửi yêu cầu hỗ trợ"}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}