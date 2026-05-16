const { sql, getPool } = require("../config/db");

async function getReasons(req, res) {
  try {
    const pool = await getPool();

    const result = await pool.request()
      .execute("sp_get_support_reasons");

    res.json({
      success: true,
      data: result.recordset
    });
  } catch (error) {
    console.error("getReasons error:", error);

    res.status(500).json({
      success: false,
      message: "Lỗi lấy danh sách loại hỗ trợ.",
      error: error.message
    });
  }
}

async function createSupportRequest(req, res) {
  try {
    const { employeeId, reasonId, description } = req.body;

    if (!employeeId || !/^\d+$/.test(String(employeeId))) {
      return res.status(400).json({
        success: false,
        message: "Mã nhân viên chỉ được nhập số."
      });
    }

    if (!reasonId) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng chọn lý do lỗi."
      });
    }

    const pool = await getPool();

    const result = await pool.request()
      .input("employee_id", sql.NVarChar(30), String(employeeId))
      .input("reason_id", sql.Int, Number(reasonId))
      .input("description", sql.NVarChar(sql.MAX), description || "")
      .execute("sp_create_support_request");

    res.json({
      success: true,
      message: "Đã lưu yêu cầu hỗ trợ thành công.",
      requestId: result.recordset?.[0]?.request_id
    });
  } catch (error) {
    console.error("createSupportRequest error:", error);

    res.status(500).json({
      success: false,
      message: "Lỗi lưu yêu cầu hỗ trợ."
    });
  }
}


async function getNewRequestCount(req, res) {
  try {
    const pool = await getPool();

    const result = await pool.request().query(`
      SELECT COUNT(*) AS total_new
      FROM support_requests
      WHERE status_id = 1
    `);

    return res.json({
      success: true,
      data: {
        totalNew: result.recordset[0]?.total_new || 0
      }
    });
  } catch (error) {
    console.error("getNewRequestCount error:", error);

    return res.status(500).json({
      success: false,
      message: "Lỗi lấy số yêu cầu mới.",
      error: error.message
    });
  }
}



module.exports = {
  getReasons,
  createSupportRequest,
  getNewRequestCount
};