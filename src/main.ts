import 'reflect-metadata';
import { Container } from 'inversify';

import { LoggingService } from '$services';
import { DiscordClient } from '$clients';
import { DISCORD_TOKEN } from './config';

async function main() {
  const DIContainer = new Container({ defaultScope: 'Singleton' });
  DIContainer.bind<DiscordClient>(DiscordClient).toSelf();
  DIContainer.bind<LoggingService>(LoggingService).toSelf();

  await DIContainer.get<DiscordClient>(DiscordClient).login(DISCORD_TOKEN);
}

main().catch((error) => {
  console.error(`🔴 Fatal error during start-up. Aborting...`);
  console.debug(error);
  process.exit(1);
});
