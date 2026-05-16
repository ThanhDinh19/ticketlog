require("dotenv").config();
const bcrypt = require("bcryptjs");
const { sql, getPool } = require("../src/config/db");

async function seedAdmin() {
  try {
    const pool = await getPool();

    const username = process.env.ADMIN_USERNAME;
    const password = process.env.ADMIN_PASSWORD;
    const fullName = process.env.ADMIN_FULL_NAME;

    const passwordHash = await bcrypt.hash(password, 10);

    await pool.request().query(`
      IF OBJECT_ID('dbo.users', 'U') IS NULL
      BEGIN
          CREATE TABLE dbo.users (
              id INT IDENTITY(1,1) PRIMARY KEY,
              username NVARCHAR(50) NOT NULL UNIQUE,
              password_hash NVARCHAR(255) NOT NULL,
              full_name NVARCHAR(100) NULL,
              is_active BIT NOT NULL DEFAULT 1,
              created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
              updated_at DATETIME2 NOT NULL DEFAULT SYSDATETIME()
          );
      END
    `);

    await pool.request()
      .input("username", sql.NVarChar(50), username)
      .input("password_hash", sql.NVarChar(255), passwordHash)
      .input("full_name", sql.NVarChar(100), fullName)
      .query(`
        IF EXISTS (SELECT 1 FROM users WHERE username = @username)
        BEGIN
            UPDATE users
            SET 
                password_hash = @password_hash,
                full_name = @full_name,
                is_active = 1,
                updated_at = SYSDATETIME()
            WHERE username = @username;
        END
        ELSE
        BEGIN
            INSERT INTO users
                (username, password_hash, full_name, is_active)
            VALUES
                (@username, @password_hash, @full_name, 1);
        END
      `);

    console.log("Seed admin success:", {
      username,
      password,
      fullName
    });

    process.exit(0);
  } catch (error) {
    console.error("Seed admin error:", error);
    process.exit(1);
  }
}

seedAdmin();