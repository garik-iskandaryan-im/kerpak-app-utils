require('dotenv').config();

module.exports = {
    env: process.env.NODE_ENV,
    server: {
        port: 4002
    },
    sequelize: {
        host: process.env.DATABASE_HOST || 'localhost',
        dialect: 'mysql',
        database: process.env.DATABASE_NAME || 'kerpak',
        username: process.env.DATABASE_USERNAME || 'root',
        password: process.env.DATABASE_PASSWORD || 'root',
        logDBHost: process.env.LOG_DATABASE_HOST || 'localhost',
        logDBDialect: 'mysql',
        logDBName: process.env.LOG_DATABASE_NAME|| 'kerpakLogs',
        logDBUsername: process.env.LOG_DATABASE_USERNAME || 'root',
        logDBPassword: process.env.LOG_DATABASE_PASSWORD || 'root',
    },
    jwt: {
        secrets: {
            aiSecretKeyBase: process.env.JWT_AI_SECRET_KEY_BASE,
        }
    },
    s3: {
        KEY: process.env.S3_KEY,
        SECRET: process.env.S3_SECRET,
        SES: {
            REGION: process.env.S3_SES_REGION,
            SOURCE: process.env.S3_SES_SOURCE,
        }
    },
    ivideon: {
        URL: process.env.IVIDEON_URL,
    },
    firebase: {
        key: process.env.FIREBASE_KEY
    },
    ai: {
        URL: process.env.AI_URL,
        TRY_GET_VIDEO_COUNT: process.env.TRY_GET_VIDEO_COUNT || 1,
    },
    kerpakUtilsClient: {
        privateKeyPath: process.env.KERPAK_UTILS_CLIENT_PRIVATE_KEY_PATH,
        secret: process.env.KERPAK_UTILS_CLIENT_SECRET,
    },
};
