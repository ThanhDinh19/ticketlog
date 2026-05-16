const { sql, getPool } = require("../config/db");

function normalizeIdCsv(value) {
  if (!value || value === "all") {
    return "all";
  }

  const ids = String(value)
    .split(",")
    .map((x) => x.trim())
    .filter((x) => /^\d+$/.test(x));

  return ids.length > 0 ? ids.join(",") : "all";
}

function normalizeCategoryId(value) {
  if (!value || value === "all") {
    return "all";
  }

  const text = String(value).trim();

  if (/^\d+$/.test(text)) {
    return text;
  }

  return "all";
}

function toIntOrZero(value) {
  if (!value || value === "all") {
    return 0;
  }

  const n = Number(value);

  return Number.isInteger(n) ? n : 0;
}

async function getReasonParamByCategory(pool, reasonIds, categoryId) {
  reasonIds = normalizeIdCsv(reasonIds);
  categoryId = normalizeCategoryId(categoryId);

  if (categoryId === "all") {
    return reasonIds;
  }

  const result = await pool.request()
    .input("category_id", sql.Int, Number(categoryId))
    .query(`
      SELECT id
      FROM support_reasons
      WHERE category_id = @category_id
        AND is_active = 1
    `);

  const categoryReasonIds = result.recordset.map((row) => String(row.id));

  if (categoryReasonIds.length === 0) {
    return "0";
  }

  if (reasonIds === "all") {
    return categoryReasonIds.join(",");
  }

  const selectedIds = reasonIds.split(",");
  const filteredIds = selectedIds.filter((id) => categoryReasonIds.includes(id));

  return filteredIds.length > 0 ? filteredIds.join(",") : "0";
}

async function getReportMeta(req, res) {
  try {
    const pool = await getPool();

    const categoriesResult = await pool.request().query(`
      SELECT id, code, name
      FROM support_reason_categories
      WHERE is_active = 1
      ORDER BY code
    `);

    const reasonsResult = await pool.request().execute("sp_get_support_reasons");

    const statusesResult = await pool.request().query(`
      SELECT id, name
      FROM request_statuses
      ORDER BY id
    `);

    return res.json({
      success: true,
      data: {
        categories: categoriesResult.recordset,
        reasons: reasonsResult.recordset,
        statuses: statusesResult.recordset
      }
    });
  } catch (error) {
    console.error("getReportMeta error:", error);

    return res.status(500).json({
      success: false,
      message: "Lỗi lấy dữ liệu lọc báo cáo.",
      error: error.message
    });
  }
}

async function getSummary(req, res) {
  try {
    const {
      fromDate,
      toDate,
      reasonIds = "all",
      categoryId = "all"
    } = req.query;

    if (!fromDate || !toDate) {
      return res.status(400).json({
        success: false,
        message: "Thiếu fromDate hoặc toDate."
      });
    }

    const pool = await getPool();

    const reasonParam = await getReasonParamByCategory(
      pool,
      reasonIds,
      categoryId
    );

    const result = await pool.request()
      .input("from_date", sql.Date, fromDate)
      .input("to_date", sql.Date, toDate)
      .input("reason_ids", sql.VarChar(500), reasonParam)
      .execute("sp_get_report_summary_filter_v5");

    return res.json({
      success: true,
      data: result.recordset[0] || {}
    });
  } catch (error) {
    console.error("getSummary error:", error);

    return res.status(500).json({
      success: false,
      message: "Lỗi lấy tổng quan báo cáo.",
      error: error.message
    });
  }
}

async function getPending(req, res) {
  try {
    const {
      fromDate,
      toDate,
      reasonIds = "all",
      categoryId = "all",
      employeeId = ""
    } = req.query;

    if (!fromDate || !toDate) {
      return res.status(400).json({
        success: false,
        message: "Thiếu fromDate hoặc toDate."
      });
    }

    const pool = await getPool();

    const reasonParam = await getReasonParamByCategory(
      pool,
      reasonIds,
      categoryId
    );

    const result = await pool.request()
      .input("from_date", sql.Date, fromDate)
      .input("to_date", sql.Date, toDate)
      .input("reason_ids", sql.VarChar(500), reasonParam)
      .input("employee_id", sql.NVarChar(30), employeeId || "")
      .execute("sp_get_pending_support_requests_v3");

    return res.json({
      success: true,
      data: result.recordset
    });
  } catch (error) {
    console.error("getPending error:", error);

    return res.status(500).json({
      success: false,
      message: "Lỗi lấy danh sách cần hỗ trợ.",
      error: error.message
    });
  }
}

async function searchRequests(req, res) {
  try {
    const {
      fromDate,
      toDate,
      reasonIds = "all",
      categoryId = "all",
      statusId = "all"
    } = req.query;

    if (!fromDate || !toDate) {
      return res.status(400).json({
        success: false,
        message: "Thiếu fromDate hoặc toDate."
      });
    }

    const pool = await getPool();

    const reasonParam = await getReasonParamByCategory(
      pool,
      reasonIds,
      categoryId
    );

    const statusParam = toIntOrZero(statusId);

    const result = await pool.request()
      .input("from_date", sql.Date, fromDate)
      .input("to_date", sql.Date, toDate)
      .input("reason_ids", sql.VarChar(500), reasonParam)
      .input("status_id", sql.Int, statusParam)
      .execute("sp_search_support_requests_v3");

    return res.json({
      success: true,
      data: result.recordset
    });
  } catch (error) {
    console.error("searchRequests error:", error);

    return res.status(500).json({
      success: false,
      message: "Lỗi tra cứu hỗ trợ.",
      error: error.message
    });
  }
}

async function getCharts(req, res) {
  try {
    const {
      fromDate,
      toDate,
      reasonIds = "all",
      categoryId = "all"
    } = req.query;

    if (!fromDate || !toDate) {
      return res.status(400).json({
        success: false,
        message: "Thiếu fromDate hoặc toDate."
      });
    }

    const pool = await getPool();

    const reasonParam = await getReasonParamByCategory(
      pool,
      reasonIds,
      categoryId
    );

    const requestByDay = await pool.request()
      .input("from_date", sql.Date, fromDate)
      .input("to_date", sql.Date, toDate)
      .input("reason_ids", sql.VarChar(500), reasonParam)
      .query(`
        SELECT
          CONVERT(VARCHAR(10), CAST(sr.request_date AS DATE), 103) AS label,
          COUNT(*) AS total
        FROM support_requests sr
        WHERE sr.request_date >= @from_date
          AND sr.request_date < DATEADD(DAY, 1, @to_date)
          AND (
                @reason_ids IS NULL
                OR @reason_ids = ''
                OR @reason_ids = 'all'
                OR EXISTS (
                    SELECT 1
                    FROM STRING_SPLIT(@reason_ids, ',') x
                    WHERE TRY_CAST(x.value AS INT) = sr.reason_id
                )
              )
        GROUP BY CAST(sr.request_date AS DATE)
        ORDER BY CAST(sr.request_date AS DATE)
      `);

    const minutesByDay = await pool.request()
      .input("from_date", sql.Date, fromDate)
      .input("to_date", sql.Date, toDate)
      .input("reason_ids", sql.VarChar(500), reasonParam)
      .query(`
        SELECT
          CONVERT(VARCHAR(10), CAST(sr.request_date AS DATE), 103) AS label,
          SUM(
            CASE
              WHEN sr.started_date IS NOT NULL
               AND sr.completed_date IS NOT NULL
              THEN DATEDIFF(MINUTE, sr.started_date, sr.completed_date)
              ELSE 0
            END
          ) AS total
        FROM support_requests sr
        WHERE sr.request_date >= @from_date
          AND sr.request_date < DATEADD(DAY, 1, @to_date)
          AND (
                @reason_ids IS NULL
                OR @reason_ids = ''
                OR @reason_ids = 'all'
                OR EXISTS (
                    SELECT 1
                    FROM STRING_SPLIT(@reason_ids, ',') x
                    WHERE TRY_CAST(x.value AS INT) = sr.reason_id
                )
              )
        GROUP BY CAST(sr.request_date AS DATE)
        ORDER BY CAST(sr.request_date AS DATE)
      `);

    const byReason = await pool.request()
      .input("from_date", sql.Date, fromDate)
      .input("to_date", sql.Date, toDate)
      .input("reason_ids", sql.VarChar(500), reasonParam)
      .query(`
        SELECT
          r.name AS label,
          COUNT(*) AS total
        FROM support_requests sr
        LEFT JOIN support_reasons r ON sr.reason_id = r.id
        WHERE sr.request_date >= @from_date
          AND sr.request_date < DATEADD(DAY, 1, @to_date)
          AND (
                @reason_ids IS NULL
                OR @reason_ids = ''
                OR @reason_ids = 'all'
                OR EXISTS (
                    SELECT 1
                    FROM STRING_SPLIT(@reason_ids, ',') x
                    WHERE TRY_CAST(x.value AS INT) = sr.reason_id
                )
              )
        GROUP BY r.name
        ORDER BY COUNT(*) DESC
      `);

    const byStatus = await pool.request()
      .input("from_date", sql.Date, fromDate)
      .input("to_date", sql.Date, toDate)
      .input("reason_ids", sql.VarChar(500), reasonParam)
      .query(`
        SELECT
          s.name AS label,
          COUNT(*) AS total
        FROM support_requests sr
        LEFT JOIN request_statuses s ON sr.status_id = s.id
        WHERE sr.request_date >= @from_date
          AND sr.request_date < DATEADD(DAY, 1, @to_date)
          AND (
                @reason_ids IS NULL
                OR @reason_ids = ''
                OR @reason_ids = 'all'
                OR EXISTS (
                    SELECT 1
                    FROM STRING_SPLIT(@reason_ids, ',') x
                    WHERE TRY_CAST(x.value AS INT) = sr.reason_id
                )
              )
        GROUP BY s.name
        ORDER BY COUNT(*) DESC
      `);

    return res.json({
      success: true,
      data: {
        requestByDay: requestByDay.recordset,
        minutesByDay: minutesByDay.recordset,
        byReason: byReason.recordset,
        byStatus: byStatus.recordset
      }
    });
  } catch (error) {
    console.error("getCharts error:", error);

    return res.status(500).json({
      success: false,
      message: "Lỗi lấy dữ liệu biểu đồ.",
      error: error.message
    });
  }
}

async function bulkUpdateStatus(req, res) {
  const pool = await getPool();
  const transaction = new sql.Transaction(pool);

  try {
    const {
      ids,
      action,
      actualIssue = "",
      solution = "",
      rejectReason = ""
    } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng chọn ít nhất một ticket."
      });
    }

    const cleanIds = ids
      .map((id) => Number(id))
      .filter((id) => Number.isInteger(id) && id > 0);

    if (cleanIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Danh sách ticket không hợp lệ."
      });
    }

    let statusId = 0;

    if (action === "in_progress") {
      statusId = 4;
    } else if (action === "complete") {
      statusId = 2;

      if (!String(actualIssue).trim()) {
        return res.status(400).json({
          success: false,
          message: "Vui lòng nhập thực tế lỗi ghi nhận."
        });
      }

      if (!String(solution).trim()) {
        return res.status(400).json({
          success: false,
          message: "Vui lòng nhập hướng xử lý."
        });
      }
    } else if (action === "reject") {
      statusId = 3;

      if (!String(rejectReason).trim()) {
        return res.status(400).json({
          success: false,
          message: "Vui lòng nhập lý do hủy."
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        message: "Thao tác không hợp lệ."
      });
    }

    await transaction.begin();

    const idsText = cleanIds.join(",");

    const result = await new sql.Request(transaction)
      .input("ids", sql.VarChar(sql.MAX), idsText)
      .input("action", sql.VarChar(30), action)
      .input("status_id", sql.Int, statusId)
      .input("actual_issue", sql.NVarChar(sql.MAX), String(actualIssue).trim())
      .input("solution", sql.NVarChar(sql.MAX), String(solution).trim())
      .input("reject_reason", sql.NVarChar(sql.MAX), String(rejectReason).trim())
      .query(`
    DECLARE @IdTable TABLE (id INT PRIMARY KEY);

    INSERT INTO @IdTable (id)
    SELECT DISTINCT TRY_CAST(value AS INT)
    FROM STRING_SPLIT(@ids, ',')
    WHERE TRY_CAST(value AS INT) IS NOT NULL;

    UPDATE sr
SET
  sr.status_id = @status_id,

  sr.started_date =
    CASE
      WHEN @action = 'in_progress'
      THEN ISNULL(sr.started_date, SYSDATETIME())
      ELSE sr.started_date
    END,

  sr.completed_date =
    CASE
      WHEN @action = 'complete'
      THEN ISNULL(sr.completed_date, SYSDATETIME())
      WHEN @action = 'reject'
      THEN NULL
      ELSE sr.completed_date
    END,

  sr.actual_issue =
    CASE
      WHEN @action = 'complete'
      THEN @actual_issue
      ELSE sr.actual_issue
    END,

  sr.solution =
    CASE
      WHEN @action = 'complete'
      THEN @solution
      ELSE sr.solution
    END,

  sr.reject_reason =
    CASE
      WHEN @action = 'reject'
      THEN @reject_reason
      ELSE sr.reject_reason
    END
FROM support_requests sr
INNER JOIN @IdTable ids ON sr.id = ids.id
WHERE
  (
    @action = 'in_progress'
    AND sr.status_id = 1
  )
  OR
  (
    @action = 'complete'
    AND sr.status_id = 4
  )
  OR
  (
    @action = 'reject'
    AND sr.status_id IN (1, 4)
  );

    SELECT @@ROWCOUNT AS affected_rows;
  `);

    const affectedRows = result.recordset?.[0]?.affected_rows || 0;

    if (affectedRows <= 0) {
      await transaction.rollback();

      let message = "Không có ticket nào được cập nhật.";

      if (action === "in_progress") {
        message = "Chỉ ticket trạng thái Mới mới được chuyển sang Đang thực hiện.";
      }

      if (action === "complete") {
        message = "Ticket phải ở trạng thái Đang thực hiện trước khi Hoàn thành.";
      }

      return res.status(400).json({
        success: false,
        message
      });
    }

    await transaction.commit();

    let message = "Đã cập nhật trạng thái.";

    if (action === "in_progress") {
      message = "Đã chuyển ticket sang Đang thực hiện.";
    }

    if (action === "complete") {
      message = "Đã hoàn thành ticket.";
    }

    if (action === "reject") {
      message = "Đã hủy ticket.";
    }

    return res.json({
      success: true,
      message,
      affectedRows
    });
  } catch (error) {
    try {
      await transaction.rollback();
    } catch { }

    console.error("bulkUpdateStatus error:", error);

    return res.status(500).json({
      success: false,
      message: "Lỗi cập nhật trạng thái ticket.",
      error: error.message
    });
  }
}

module.exports = {
  getReportMeta,
  getSummary,
  getPending,
  searchRequests,
  getCharts,
  bulkUpdateStatus
};