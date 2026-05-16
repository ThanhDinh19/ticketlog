const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { sql, getPool } = require("../config/db");

function signToken(user) {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      fullName: user.full_name
    },
    process.env.JWT_SECRET || "change-this-secret-key",
    {
      expiresIn: "8h"
    }
  );
}

async function login(req, res) {
  try {
    const username = String(req.body.username || "").trim();
    const password = String(req.body.password || "");

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập tài khoản và mật khẩu."
      });
    }

    const pool = await getPool();

    const result = await pool.request()
      .input("username", sql.NVarChar(50), username)
      .query(`
        SELECT TOP 1
            id,
            username,
            password_hash,
            full_name,
            is_active
        FROM users
        WHERE username = @username
          AND is_active = 1
      `);

    const user = result.recordset[0];

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Sai tài khoản hoặc mật khẩu."
      });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Sai tài khoản hoặc mật khẩu."
      });
    }

    const token = signToken(user);

    return res.json({
      success: true,
      message: "Đăng nhập thành công.",
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          fullName: user.full_name || user.username
        }
      }
    });
  } catch (error) {
    console.error("login error:", error);

    return res.status(500).json({
      success: false,
      message: "Lỗi đăng nhập.",
      error: error.message
    });
  }
}

async function me(req, res) {
  return res.json({
    success: true,
    data: {
      user: req.user
    }
  });
}

module.exports = {
  login,
  me
};