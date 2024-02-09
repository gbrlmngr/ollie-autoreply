import { from } from 'env-var';

const fromProcessEnv = () => from(process.env);

export const DISCORD_TOKEN = fromProcessEnv()
  .get('DISCORD_TOKEN')
  .required()
  .asString();

export const REDIS_URL = fromProcessEnv()
  .get('REDIS_URL')
  .required()
  .asString();
