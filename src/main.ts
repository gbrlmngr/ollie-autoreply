import 'reflect-metadata';
import { Container, decorate, injectable } from 'inversify';
import { EventEmitter } from 'eventemitter3';
import {
  RateLimiterRedis,
  type IRateLimiterRedisOptions,
} from 'rate-limiter-flexible';

import { LoggingService, I18NService, ActivitiesService } from './services';
import { DiscordClient, PrismaClient, RedisClient } from './clients';
import { DISCORD_TOKEN } from './environment';
import { DISymbols } from './di.interfaces';

decorate(injectable(), EventEmitter);

async function main() {
  const DIContainer = new Container({
    skipBaseClassChecks: true,
    defaultScope: 'Singleton',
  });
  DIContainer.bind<EventEmitter>(DISymbols.EventEmitter).to(EventEmitter);
  DIContainer.bind<DiscordClient>(DISymbols.DiscordClient).to(DiscordClient);
  DIContainer.bind<RedisClient>(DISymbols.RedisClient).to(RedisClient);
  DIContainer.bind<PrismaClient>(DISymbols.PrismaClient).to(PrismaClient);
  DIContainer.bind<LoggingService>(DISymbols.LoggingService).to(LoggingService);
  DIContainer.bind<I18NService>(DISymbols.I18NService).to(I18NService);
  DIContainer.bind<ActivitiesService>(DISymbols.ActivitiesService).to(
    ActivitiesService
  );

  DIContainer.bind<(options: IRateLimiterRedisOptions) => RateLimiterRedis>(
    `Factory<${RateLimiterRedis.name}>`
  ).toFactory<RateLimiterRedis>(
    () => (options: IRateLimiterRedisOptions) =>
      new RateLimiterRedis({
        keyPrefix: 'ollie/rl',
        ...options,
      })
  );

  await DIContainer.get<DiscordClient>(DISymbols.DiscordClient).login(
    DISCORD_TOKEN
  );
}

main().catch((error) => {
  console.error(`🔴 Fatal error during start-up. Aborting...`);
  console.debug(error);
  process.exit(1);
});
