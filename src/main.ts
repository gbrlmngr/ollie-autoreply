import 'reflect-metadata';
import { Container } from 'inversify';

import { LoggingService } from './services';
import { DiscordClient, PrismaClient, RedisClient } from './clients';
import { DISCORD_TOKEN } from './environment';

async function main() {
  const DIContainer = new Container({ skipBaseClassChecks: true });
  DIContainer.bind<DiscordClient>(DiscordClient).toSelf().inSingletonScope();
  DIContainer.bind<RedisClient>(RedisClient).toSelf().inSingletonScope();
  DIContainer.bind<PrismaClient>(PrismaClient).toSelf().inSingletonScope();
  DIContainer.bind<LoggingService>(LoggingService).toSelf();

  await DIContainer.get<DiscordClient>(DiscordClient).login(DISCORD_TOKEN);
}

main().catch((error) => {
  console.error(`🔴 Fatal error during start-up. Aborting...`);
  console.debug(error);
  process.exit(1);
});
