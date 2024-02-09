import { from } from 'env-var';

const fromProcessEnv = () => from(process.env);
export const DISCORD_TOKEN = fromProcessEnv()
  .get('DISCORD_TOKEN')
  .required()
  .asString();
