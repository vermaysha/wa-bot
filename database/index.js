const {
    Sequelize
} = require('sequelize')
const process = require('process')
const { logger } = require('../helpers')
require('dotenv').config()

const sequelize = new Sequelize(process.env.DATABASE_URL, {
    logging: (sql, timing) => logger.info(sql, typeof timing === 'number' ? `Elapsed time: ${timing}ms` : ''),
    dialectOptions: {
        ssl: {
          rejectUnauthorized: false // This line will fix new error
        }
    }
});

const modelDefiners = [
	require('./models/session.model')
];

// We define all models according to their files.
for (const modelDefiner of modelDefiners) {
	modelDefiner(sequelize);
}

module.exports = sequelize;
