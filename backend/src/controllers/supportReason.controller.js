const { sql, getPool } = require("../config/db");

function toBoolBit(value) {
  if (value === true || value === 1 || value === "1") {
    return 1;
  }

  return 0;
}

async function getSupportReasons(req, res) {
  try {
    const pool = await getPool();

    const categoriesResult = await pool.request().query(`
      SELECT
        id,
        code,
        name,
        is_active
      FROM support_reason_categories
      WHERE is_active = 1
      ORDER BY code
    `);

    const reasonsResult = await pool.request().query(`
      SELECT
        sr.id,
        sr.name,
        sr.category_id,
        c.code AS category_code,
        c.name AS category_name,
        sr.is_active
      FROM support_reasons sr
      LEFT JOIN support_reason_categories c
        ON sr.category_id = c.id
      ORDER BY sr.id
    `);

    return res.json({
      success: true,
      data: {
        categories: categoriesResult.recordset,
        reasons: reasonsResult.recordset
      }
    });
  } catch (error) {
    console.error("getSupportReasons error:", error);

    return res.status(500).json({
      success: false,
      message: "Lỗi lấy danh mục loại hỗ trợ.",
      error: error.message
    });
  }
}

async function createSupportReason(req, res) {
  try {
    const { name, categoryId } = req.body;

    const cleanName = String(name || "").trim();
    const categoryIdNumber = Number(categoryId);

    if (!cleanName) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập tên loại hỗ trợ."
      });
    }

    if (!Number.isInteger(categoryIdNumber)) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng chọn loại lỗi."
      });
    }

    const pool = await getPool();

    const categoryResult = await pool.request()
      .input("category_id", sql.Int, categoryIdNumber)
      .query(`
        SELECT TOP 1 id
        FROM support_reason_categories
        WHERE id = @category_id
          AND is_active = 1
      `);

    if (categoryResult.recordset.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Loại lỗi không tồn tại hoặc đang ẩn."
      });
    }

    const insertResult = await pool.request()
      .input("name", sql.NVarChar(100), cleanName)
      .input("category_id", sql.Int, categoryIdNumber)
      .query(`
        INSERT INTO support_reasons
          (name, category_id, is_active)
        OUTPUT INSERTED.id
        VALUES
          (@name, @category_id, 1)
      `);

    return res.json({
      success: true,
      message: "Đã thêm loại hỗ trợ mới.",
      data: {
        id: insertResult.recordset[0].id
      }
    });
  } catch (error) {
    console.error("createSupportReason error:", error);

    if (error.number === 2627 || error.number === 2601) {
      return res.status(400).json({
        success: false,
        message: "Tên loại hỗ trợ đã tồn tại."
      });
    }

    return res.status(500).json({
      success: false,
      message: "Lỗi thêm loại hỗ trợ.",
      error: error.message
    });
  }
}

async function updateSupportReasons(req, res) {
  const pool = await getPool();
  const transaction = new sql.Transaction(pool);

  try {
    const { reasons } = req.body;

    if (!Array.isArray(reasons) || reasons.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Không có dữ liệu để cập nhật."
      });
    }

    const rows = [];

    for (const item of reasons) {
      const id = Number(item.id);
      const name = String(item.name || "").trim();
      const categoryId = Number(item.categoryId);
      const isActive = toBoolBit(item.isActive);

      if (!Number.isInteger(id)) {
        return res.status(400).json({
          success: false,
          message: `ID không hợp lệ: ${item.id}`
        });
      }

      if (!name) {
        return res.status(400).json({
          success: false,
          message: `Loại hỗ trợ ID ${id} chưa có tên.`
        });
      }

      if (!Number.isInteger(categoryId)) {
        return res.status(400).json({
          success: false,
          message: `Loại hỗ trợ ID ${id} chưa chọn loại lỗi.`
        });
      }

      rows.push({
        id,
        name,
        categoryId,
        isActive
      });
    }

    await transaction.begin();

    for (const item of rows) {
      const request = new sql.Request(transaction);

      await request
        .input("id", sql.Int, item.id)
        .input("name", sql.NVarChar(100), item.name)
        .input("category_id", sql.Int, item.categoryId)
        .input("is_active", sql.Bit, item.isActive)
        .query(`
          UPDATE support_reasons
          SET
            name = @name,
            category_id = @category_id,
            is_active = @is_active
          WHERE id = @id
        `);
    }

    await transaction.commit();

    return res.json({
      success: true,
      message: "Đã lưu tất cả loại hỗ trợ."
    });
  } catch (error) {
    try {
      await transaction.rollback();
    } catch {}

    console.error("updateSupportReasons error:", error);

    if (error.number === 2627 || error.number === 2601) {
      return res.status(400).json({
        success: false,
        message: "Tên loại hỗ trợ bị trùng."
      });
    }

    return res.status(500).json({
      success: false,
      message: "Lỗi cập nhật danh mục loại hỗ trợ.",
      error: error.message
    });
  }
}

module.exports = {
  getSupportReasons,
  createSupportReason,
  updateSupportReasons
};