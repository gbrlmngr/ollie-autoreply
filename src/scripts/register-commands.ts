import 'reflect-metadata';
import { resolve } from 'node:path';
import { readdir } from 'node:fs/promises';
import { REST, Routes } from 'discord.js';

import { DISCORD_APPID, DISCORD_TOKEN } from '../environment';
import { LoggingService } from '../services';
import { Command } from '../commands';

async function run() {
  const logger = new LoggingService();
  const RestAPI = new REST().setToken(DISCORD_TOKEN);
  const commands = new Set<Command>();

  try {
    const commandFiles = (await readdir(resolve(__dirname, '..', 'commands')))
      .filter((fileName) => /^(.+)\.command\.(t|j)s$/.test(fileName))
      .map((fileName) => fileName.replace(/\.(t|j)s$/, ''));

    if (!commandFiles.length) {
      this.logger.warn('No command files have been found.');
      return;
    }

    for (const commandFile of commandFiles) {
      logger.debug(`Reading command file "${commandFile}"...`);

      const CommandClass = (
        await import(resolve(__dirname, '..', 'commands', commandFile)).catch(
          (error) => {
            logger
              .error(`🔴 Unable to import command "${commandFile}"`)
              .error(`🔴 Reason: ${error.message ?? error}`);
          }
        )
      ).default;

      const command = new CommandClass() as Command;
      if (command.disabled) continue;

      commands.add(command);
    }

    await RestAPI.put(Routes.applicationCommands(DISCORD_APPID), {
      body: [...commands].map((command) => command.definition.toJSON()),
    });

    logger.info(
      `✅ ${commands.size} command${
        commands.size === 1 ? ' has' : 's have'
      } been successfully registered to Discord!`
    );
  } catch (error) {
    logger
      .error('🔴 Unable to register the commands.')
      .error(`🔴 Reason: ${error.message ?? error}`);
  }
}

run();
