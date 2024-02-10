import { from } from 'env-var';

const fromProcessEnv = () => from(process.env);

export const NODE_ENV = fromProcessEnv()
  .get('NODE_ENV')
  .default('development')
  .asEnum(['development', 'production']);

export const LOG_LEVEL_OVERRIDE = fromProcessEnv()
  .get('LOG_LEVEL_OVERRIDE')
  // https://github.com/pinojs/pino/blob/master/docs/api.md#level-string
  .asEnum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent', '']);

export const DISCORD_TOKEN = fromProcessEnv()
  .get('DISCORD_TOKEN')
  .required()
  .asString();

export const DISCORD_APPID = fromProcessEnv()
  .get('DISCORD_APPID')
  .required()
  .asString();

export const REDIS_URL = fromProcessEnv()
  .get('REDIS_URL')
  .required()
  .asString();

export const MYSQL_URL = fromProcessEnv()
  .get('MYSQL_URL')
  .required()
  .asString();
