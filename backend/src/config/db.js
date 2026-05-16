const sql = require("mssql");

const dbConfig = {
  server: process.env.DB_SERVER,
  port: Number(process.env.DB_PORT || 1433),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  options: {
    encrypt: process.env.DB_ENCRYPT === "true",
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === "true"
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

console.log("DB Config loaded:", {
  server: dbConfig.server,
  port: dbConfig.port,
  user: dbConfig.user,
  database: dbConfig.database
});

let poolPromise = null;

function getPool() {
  if (!poolPromise) {
    console.log("Creating new SQL connection pool...");
    poolPromise = sql.connect(dbConfig);
  }

  return poolPromise;
}

module.exports = {
  sql,
  getPool
};