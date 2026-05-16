import { useEffect, useState, type FormEvent } from "react";
import {
  createSupportReason,
  getSupportReasonsManage,
  updateSupportReasons,
} from "../api/supportReasonApi";
import type { SupportCategory, SupportReason } from "../types";

type EditableSupportReason = SupportReason & {
  category_id?: number | string | null;
  categoryId?: number | string | null;
  is_active?: number | boolean | null;
  isActive?: boolean | null;
};

export default function SupportReasonsPage() {
  const [categories, setCategories] = useState<SupportCategory[]>([]);
  const [reasons, setReasons] = useState<EditableSupportReason[]>([]);
  const [newName, setNewName] = useState("");
  const [newCategoryId, setNewCategoryId] = useState("");
  const [message, setMessage] = useState("");

  async function loadData() {
    const res = await getSupportReasonsManage();
    setCategories(res.data.categories || []);
    setReasons(res.data.reasons || []);
  }

  useEffect(() => {
    loadData();
  }, []);

  function getCategoryId(item: EditableSupportReason) {
    return Number(item.category_id ?? item.categoryId ?? 0);
  }

  function getIsActive(item: EditableSupportReason) {
    return (
      item.is_active === true ||
      item.isActive === true
    );
  }

  function updateItem(
    id: number,
    field: "name" | "category_id" | "is_active",
    value: string
  ) {
    setReasons((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;

        if (field === "name") {
          return {
            ...item,
            name: value,
          };
        }

        if (field === "category_id") {
          const categoryId = Number(value);

          return {
            ...item,
            category_id: categoryId,
            categoryId,
          };
        }

        if (field === "is_active") {
          const isActive = value === "1";

          return {
            ...item,
            is_active: isActive,
            isActive,
          };
        }

        return item;
      })
    );
  }

  async function handleAdd(e: FormEvent) {
    e.preventDefault();

    const name = newName.trim();
    const categoryId = Number(newCategoryId);

    if (!name) {
      setMessage("Vui lòng nhập tên loại hỗ trợ.");
      return;
    }

    if (!categoryId) {
      setMessage("Vui lòng chọn team.");
      return;
    }

    const res = await createSupportReason({
      name,
      categoryId,
    });

    setMessage(res.message || "Đã thêm loại hỗ trợ.");
    setNewName("");
    setNewCategoryId("");
    await loadData();
  }

  async function handleSaveAll() {
    const payload = reasons.map((r) => ({
      id: r.id,
      name: String(r.name || "").trim(),
      categoryId: getCategoryId(r),
      isActive: getIsActive(r),
    }));

    const res = await updateSupportReasons({ reasons: payload });
    setMessage(res.message || "Đã lưu tất cả.");
    await loadData();
  }

  return (
    <div className="support-reason-page">
      <div className="support-reason-page-header">
        <h3>Danh mục loại hỗ trợ</h3>
        <p>Quản lý danh sách loại hỗ trợ và map vào team MES, BRAVO, SYSTEM.</p>
      </div>

      {message && <div className="alert alert-success">{message}</div>}

      <div className="card shadow-sm border-0 mb-3 support-reason-add-card">
        <div className="card-body">
          <h5 className="mb-3">Thêm loại hỗ trợ mới</h5>

          <form className="row g-3 align-items-end" onSubmit={handleAdd}>
            <div className="col-12 col-md-6">
              <label className="form-label">Tên loại hỗ trợ</label>
              <input
                className="form-control"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
                placeholder="Ví dụ: Lỗi phần mềm BRAVO"
              />
            </div>

            <div className="col-12 col-md-3">
              <label className="form-label">Team</label>
              <select
                className="form-select"
                value={newCategoryId}
                onChange={(e) => setNewCategoryId(e.target.value)}
                required
              >
                <option value="">-- Chọn team --</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-12 col-md-3">
              <button className="btn btn-primary w-100" type="submit">
                Thêm mới
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="card shadow-sm border-0 support-reason-manage-card">
        <div className="card-body">
          <div className="support-reason-save-bar">
            <button className="btn btn-primary" onClick={handleSaveAll}>
              <i className="bi bi-save me-1" />
              Lưu tất cả
            </button>
          </div>

          {/* Desktop table */}
          <div className="support-reason-table-wrap">
            <div className="table-responsive">
              <table className="table table-bordered align-middle support-reason-table">
                <thead className="table-dark">
                  <tr>
                    <th style={{ width: "80px" }}>ID</th>
                    <th>Tên loại hỗ trợ</th>
                    <th style={{ width: "180px" }}>Team</th>
                    <th style={{ width: "160px" }}>Trạng thái</th>
                  </tr>
                </thead>

                <tbody>
                  {reasons.map((item) => {
                    const categoryId = getCategoryId(item);
                    const isActive = getIsActive(item);

                    return (
                      <tr key={item.id}>
                        <td>{item.id}</td>

                        <td>
                          <input
                            className="form-control"
                            value={item.name || ""}
                            onChange={(e) =>
                              updateItem(item.id, "name", e.target.value)
                            }
                          />
                        </td>

                        <td>
                          <select
                            className="form-select"
                            value={categoryId || ""}
                            onChange={(e) =>
                              updateItem(item.id, "category_id", e.target.value)
                            }
                          >
                            <option value="">-- Chọn team --</option>
                            {categories.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.code}
                              </option>
                            ))}
                          </select>
                        </td>

                        <td>
                          <select
                            className="form-select"
                            value={isActive ? "1" : "0"}
                            onChange={(e) =>
                              updateItem(item.id, "is_active", e.target.value)
                            }
                          >
                            <option value="1">Đang hiện</option>
                            <option value="0">Đang ẩn</option>
                          </select>
                        </td>
                      </tr>
                    );
                  })}

                  {reasons.length === 0 && (
                    <tr>
                      <td colSpan={4} className="text-center text-muted">
                        Không có dữ liệu.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile cards */}
          <div className="support-reason-mobile-list">
            {reasons.map((item) => {
              const categoryId = getCategoryId(item);
              const isActive = getIsActive(item);

              return (
                <div className="support-reason-mobile-card" key={item.id}>
                  <div className="support-reason-mobile-head">
                    <div>
                      <div className="support-reason-mobile-title">
                        ID #{item.id}
                      </div>
                      <div className="support-reason-mobile-subtitle">
                        Danh mục loại hỗ trợ
                      </div>
                    </div>

                    <span
                      className={
                        isActive
                          ? "support-reason-status active"
                          : "support-reason-status inactive"
                      }
                    >
                      {isActive ? "Đang hiện" : "Đang ẩn"}
                    </span>
                  </div>

                  <div className="support-reason-mobile-grid">
                    <label className="support-reason-mobile-field">
                      <span>Tên loại hỗ trợ</span>
                      <input
                        value={item.name || ""}
                        onChange={(e) =>
                          updateItem(item.id, "name", e.target.value)
                        }
                      />
                    </label>

                    <label className="support-reason-mobile-field">
                      <span>Team</span>
                      <select
                        value={categoryId || ""}
                        onChange={(e) =>
                          updateItem(item.id, "category_id", e.target.value)
                        }
                      >
                        <option value="">-- Chọn team --</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.code}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="support-reason-mobile-field">
                      <span>Trạng thái</span>
                      <select
                        value={isActive ? "1" : "0"}
                        onChange={(e) =>
                          updateItem(item.id, "is_active", e.target.value)
                        }
                      >
                        <option value="1">Đang hiện</option>
                        <option value="0">Đang ẩn</option>
                      </select>
                    </label>
                  </div>
                </div>
              );
            })}

            {reasons.length === 0 && (
              <div className="support-reason-mobile-empty">
                Không có dữ liệu.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}