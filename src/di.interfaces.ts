export const DISymbols = {
  EventEmitter: Symbol('di.event-emitter'),
  LoggingService: Symbol('di.logging-service'),
  I18NService: Symbol('di.i18n-service'),
  ActivitiesService: Symbol('di.activities-service'),
  DiscordClient: Symbol('di.discord-client'),
  RedisClient: Symbol('di.redis-client'),
  PrismaClient: Symbol('di.prisma-client'),
} as const;
