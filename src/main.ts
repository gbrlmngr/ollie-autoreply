import 'reflect-metadata';
import { Container, decorate, injectable } from 'inversify';
import { EventEmitter } from 'eventemitter3';

import { LoggingService } from './services';
import { DiscordClient, PrismaClient, RedisClient } from './clients';
import { DISCORD_TOKEN } from './environment';

decorate(injectable(), EventEmitter);

async function main() {
  const DIContainer = new Container({ skipBaseClassChecks: true, defaultScope: 'Singleton' });
  DIContainer.bind<EventEmitter>(EventEmitter).toSelf();
  DIContainer.bind<DiscordClient>(DiscordClient).toSelf();
  DIContainer.bind<RedisClient>(RedisClient).toSelf();
  DIContainer.bind<PrismaClient>(PrismaClient).toSelf();
  DIContainer.bind<LoggingService>(LoggingService).toSelf();

  await DIContainer.get<DiscordClient>(DiscordClient).login(DISCORD_TOKEN);
}

main().catch((error) => {
  console.error(`🔴 Fatal error during start-up. Aborting...`);
  console.debug(error);
  process.exit(1);
});
