import { from } from 'env-var';

const fromProcessEnv = () => from(process.env);

export const NODE_ENV = fromProcessEnv()
  .get('NODE_ENV')
  .default('development')
  .asEnum(['development', 'production']);

export const DISCORD_TOKEN = fromProcessEnv()
  .get('DISCORD_TOKEN')
  .required()
  .asString();

export const REDIS_URL = fromProcessEnv()
  .get('REDIS_URL')
  .required()
  .asString();
