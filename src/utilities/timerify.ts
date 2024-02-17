import { performance } from 'node:perf_hooks';
import { Awaitable } from 'discord.js';

export const timerify = async <Return>(
  label: string,
  callback: () => Awaitable<Return>
) => {
  performance.mark(`${label}:start`);
  const result = await callback();
  performance.mark(`${label}:end`);
  performance.measure(`${label}`, `${label}:start`, `${label}:end`);

  return result;
};
