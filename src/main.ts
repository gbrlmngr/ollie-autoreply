import 'reflect-metadata';
import { Container } from 'inversify';

import { LoggingService } from './services';
import { DiscordClient } from './clients';

async function main() {
  const DIContainer = new Container();
  DIContainer.bind<DiscordClient>(DiscordClient).toSelf().inSingletonScope();
  DIContainer.bind<LoggingService>(LoggingService).toSelf().inSingletonScope();

  DIContainer.get<DiscordClient>(DiscordClient).login();
}

main();
