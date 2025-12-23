const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = {
    host: process.env.MYSQL_HOST || process.env.MYSQLHOST || 'localhost',
    port: process.env.MYSQL_PORT || process.env.MYSQLPORT || 3306,
    user: process.env.MYSQL_USER || process.env.MYSQLUSER || 'root',
    password: process.env.MYSQL_PASSWORD || process.env.MYSQLPASSWORD || '',
    database: process.env.MYSQL_DATABASE || process.env.MYSQLDATABASE || 'kaitlus'
};

let pool = null;

// Create connection pool
function getPool() {
    if (!pool) {
        pool = mysql.createPool({
            ...dbConfig,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        });
    }
    return pool;
}

// Initialize database with tables
async function initializeDatabase() {
    const connection = await mysql.createConnection({
        host: dbConfig.host,
        port: dbConfig.port,
        user: dbConfig.user,
        password: dbConfig.password
    });

    // Create database if it doesn't exist
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\``);
    await connection.query(`USE \`${dbConfig.database}\``);

    // Create users table
    await connection.query(`
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(50) NOT NULL UNIQUE,
            email VARCHAR(100) NOT NULL UNIQUE,
            password VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
    `);

    await connection.end();
    console.log('Database tables created successfully');
}

// Query helper
async function query(sql, params) {
    const pool = getPool();
    const [results] = await pool.execute(sql, params);
    return results;
}

module.exports = {
    getPool,
    initializeDatabase,
    query,
    dbConfig
};
