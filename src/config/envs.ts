import 'dotenv/config.js';
import * as joi from 'joi';

interface EnvVars {
  DB_HOST: string;
  DB_PORT: string;
  DB_USERNAME: string;
  DB_PASSWORD: string;
  DB_DATABASE: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  PORT: number;
  REDIS_HOST: string;
  REDIS_PORT: number;
  ERP_API_URL: string;
  WMS_API_URL: string;
  AWS_REGION: string;
  AWS_CLOUDWATCH_LOG_GROUP: string;
  AWS_CLOUDWATCH_LOG_STREAM: string;
  NODE_ENV: string;
}

const envsSchema = joi
  .object({
    DB_HOST: joi.string().required(),
    DB_PORT: joi.string().required(),
    DB_USERNAME: joi.string().required(),
    DB_PASSWORD: joi.string().required(),
    DB_DATABASE: joi.string().required(),
    JWT_SECRET: joi.string().required(),
    JWT_EXPIRES_IN: joi.string().default('24h'),
    PORT: joi.number().required(),
    REDIS_HOST: joi.string().default('localhost'),
    REDIS_PORT: joi.number().default(6379),
    ERP_API_URL: joi.string().default('http://localhost:3001/api'),
    WMS_API_URL: joi.string().default('http://localhost:3002/api'),
    AWS_REGION: joi.string().default('us-east-1'),
    AWS_CLOUDWATCH_LOG_GROUP: joi.string().default('/aws/ms-auth'),
    AWS_CLOUDWATCH_LOG_STREAM: joi.string().default('application'),
    NODE_ENV: joi.string().default('development'),
  })
  .unknown(true);

let { DB_HOST, DB_PORT, DB_DATABASE } = process.env;
if (process.env.NODE_ENV === 'test') {
  DB_HOST = process.env.DB_TEST_HOST;
  DB_PORT = process.env.DB_TEST_PORT;
  DB_DATABASE = process.env.DB_TEST_DATABASE;
} else if (
  process.env.SYNC_TYPE === 'alter' ||
  (process.env.SYNC_TYPE === 'force' && process.env.NODE_ENV === 'development')
) {
  DB_HOST = process.env.DB_HOST_SYNC;
  DB_PORT = process.env.DB_PORT_SYNC;
}
const { error, value } = envsSchema.validate({
  ...process.env,
  DB_HOST,
  DB_PORT,
  DB_DATABASE,
});

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}
const envVars: EnvVars = value;

export const envs = {
  dbHost: envVars.DB_HOST,
  dbPort: envVars.DB_PORT,
  dbUsername: envVars.DB_USERNAME,
  dbPassword: envVars.DB_PASSWORD,
  dbDatabase: envVars.DB_DATABASE,
  jwtSecret: envVars.JWT_SECRET,
  jwtExpiresIn: envVars.JWT_EXPIRES_IN,
  port: envVars.PORT,
  redisHost: envVars.REDIS_HOST,
  redisPort: envVars.REDIS_PORT,
  erpApiUrl: envVars.ERP_API_URL,
  wmsApiUrl: envVars.WMS_API_URL,
  awsRegion: envVars.AWS_REGION,
  awsCloudWatchLogGroup: envVars.AWS_CLOUDWATCH_LOG_GROUP,
  awsCloudWatchLogStream: envVars.AWS_CLOUDWATCH_LOG_STREAM,
  nodeEnv: envVars.NODE_ENV,
};
