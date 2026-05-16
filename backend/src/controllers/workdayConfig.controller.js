const { sql, getPool } = require("../config/db");

function parseNumber(value, defaultValue = 0) {
  const n = Number(value);

  if (Number.isFinite(n)) {
    return n;
  }

  return defaultValue;
}

async function ensureYearConfigs(pool, year) {
  const request = pool.request();

  request.input("year", sql.Int, year);

  await request.query(`
    MERGE workday_configs AS target
    USING (
      VALUES
        (@year, 1, 24000000, 26, 9),
        (@year, 2, 24000000, 26, 9),
        (@year, 3, 24000000, 26, 9),
        (@year, 4, 24000000, 26, 9),
        (@year, 5, 24000000, 26, 9),
        (@year, 6, 24000000, 26, 9),
        (@year, 7, 24000000, 26, 9),
        (@year, 8, 24000000, 26, 9),
        (@year, 9, 24000000, 26, 9),
        (@year, 10, 24000000, 26, 9),
        (@year, 11, 24000000, 26, 9),
        (@year, 12, 24000000, 26, 9)
    ) AS source ([year], [month], average_salary, standard_work_days, working_hours_per_day)
    ON target.[year] = source.[year]
       AND target.[month] = source.[month]
    WHEN NOT MATCHED THEN
      INSERT
        ([year], [month], average_salary, standard_work_days, working_hours_per_day, is_active)
      VALUES
        (source.[year], source.[month], source.average_salary, source.standard_work_days, source.working_hours_per_day, 1);
  `);
}

async function getWorkdayConfigs(req, res) {
  try {
    const currentYear = new Date().getFullYear();
    const year = parseInt(req.query.year || currentYear, 10);

    if (!Number.isInteger(year)) {
      return res.status(400).json({
        success: false,
        message: "Năm không hợp lệ."
      });
    }

    const pool = await getPool();

    await ensureYearConfigs(pool, year);

    const result = await pool.request()
      .input("year", sql.Int, year)
      .query(`
        SELECT
          id,
          [year] AS year,
          [month] AS month,
          average_salary,
          standard_work_days,
          working_hours_per_day,
          is_active,
          updated_at,
          ROUND(
            average_salary
            / NULLIF(standard_work_days, 0)
            / NULLIF(working_hours_per_day, 0)
            / 60,
            0
          ) AS cost_per_minute
        FROM workday_configs
        WHERE [year] = @year
        ORDER BY [month]
      `);

    return res.json({
      success: true,
      data: result.recordset
    });
  } catch (error) {
    console.error("getWorkdayConfigs error:", error);

    return res.status(500).json({
      success: false,
      message: "Lỗi lấy cấu hình ngày công.",
      error: error.message
    });
  }
}

async function updateWorkdayConfigs(req, res) {
  const pool = await getPool();
  const transaction = new sql.Transaction(pool);

  try {
    const { year, configs } = req.body;

    const yearInt = parseInt(year, 10);

    if (!Number.isInteger(yearInt)) {
      return res.status(400).json({
        success: false,
        message: "Năm không hợp lệ."
      });
    }

    if (!Array.isArray(configs) || configs.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Không có dữ liệu cấu hình."
      });
    }

    const rows = [];

    for (const item of configs) {
      const month = parseInt(item.month, 10);
      const averageSalary = parseNumber(item.averageSalary, 24000000);
      const standardWorkDays = parseNumber(item.standardWorkDays, 26);
      const workingHoursPerDay = parseNumber(item.workingHoursPerDay, 9);

      if (!Number.isInteger(month) || month < 1 || month > 12) {
        return res.status(400).json({
          success: false,
          message: `Tháng không hợp lệ: ${item.month}`
        });
      }

      if (averageSalary <= 0) {
        return res.status(400).json({
          success: false,
          message: `Lương trung bình tháng ${month} phải lớn hơn 0.`
        });
      }

      if (standardWorkDays <= 0) {
        return res.status(400).json({
          success: false,
          message: `Ngày công chuẩn tháng ${month} phải lớn hơn 0.`
        });
      }

      if (workingHoursPerDay <= 0) {
        return res.status(400).json({
          success: false,
          message: `Giờ làm việc/ngày tháng ${month} phải lớn hơn 0.`
        });
      }

      rows.push({
        month,
        averageSalary,
        standardWorkDays,
        workingHoursPerDay
      });
    }

    await transaction.begin();

    for (const item of rows) {
      const request = new sql.Request(transaction);

      await request
        .input("year", sql.Int, yearInt)
        .input("month", sql.Int, item.month)
        .input("average_salary", sql.Decimal(18, 2), item.averageSalary)
        .input("standard_work_days", sql.Decimal(5, 2), item.standardWorkDays)
        .input("working_hours_per_day", sql.Decimal(5, 2), item.workingHoursPerDay)
        .query(`
          MERGE workday_configs AS target
          USING (
            SELECT
              @year AS [year],
              @month AS [month],
              @average_salary AS average_salary,
              @standard_work_days AS standard_work_days,
              @working_hours_per_day AS working_hours_per_day
          ) AS source
          ON target.[year] = source.[year]
             AND target.[month] = source.[month]
          WHEN MATCHED THEN
            UPDATE SET
              average_salary = source.average_salary,
              standard_work_days = source.standard_work_days,
              working_hours_per_day = source.working_hours_per_day,
              is_active = 1,
              updated_at = SYSDATETIME()
          WHEN NOT MATCHED THEN
            INSERT
              ([year], [month], average_salary, standard_work_days, working_hours_per_day, is_active)
            VALUES
              (source.[year], source.[month], source.average_salary, source.standard_work_days, source.working_hours_per_day, 1);
        `);
    }

    await transaction.commit();

    return res.json({
      success: true,
      message: `Đã lưu cấu hình ngày công năm ${yearInt}.`
    });
  } catch (error) {
    try {
      await transaction.rollback();
    } catch {}

    console.error("updateWorkdayConfigs error:", error);

    return res.status(500).json({
      success: false,
      message: "Lỗi lưu cấu hình ngày công.",
      error: error.message
    });
  }
}

module.exports = {
  getWorkdayConfigs,
  updateWorkdayConfigs
};