const mariadb = require("mariadb");

const CONNECTION_POOL_SIZE = 128;

module.exports = class {
	constructor(databaseAddress, databasePort = 3306, databaseUsername, databasePassword, databaseName) {
		this.connectionPool = mariadb.createPool({
			connectionLimit: CONNECTION_POOL_SIZE,
			host: databaseAddress,
			port: databasePort,
			user: databaseUsername,
			password: databasePassword,
			database: databaseName
		});
		console.log(`[Database] Connection pool created. Size = ${CONNECTION_POOL_SIZE}`);
	}

	async query(query = "", data) {
		const limited = query.includes("LIMIT 1");

		try {
			const connection = await this.connectionPool.getConnection();
			if (connection == null) {
				return null;
			}

			if (data == null) {
				const result = await connection.query(query);
				connection.release();
				return limited ? result[0] : result;
			} else {
				const result = await connection.query(query, data);
				connection.release();
				return limited ? result[0] : result;
			}
		} catch (e) {
			console.error(e);
			throw e;
		}

	}
}