import { inject, injectable, decorate } from 'inversify';
import Redis from 'ioredis';
import { EventEmitter } from 'eventemitter3';

import { REDIS_URL } from '../../environment';
import { LoggingService } from '../../services';
import { ExpiredKeyEvent } from './redis.interfaces';

decorate(injectable(), Redis);

@injectable()
export class RedisClient extends Redis {
  private readonly _subscriber: Redis;

  public constructor(
    @inject(LoggingService) private readonly loggingService: LoggingService,
    @inject(EventEmitter) private readonly eventEmitter: EventEmitter
  ) {
    super(REDIS_URL);
    this.on('ready', this._onReadyEvent.bind(this));

    this._subscriber = new Redis(REDIS_URL);
    this._subscriber.subscribe(ExpiredKeyEvent);
    this._subscriber.on('message', this._onMessageEvent.bind(this));
  }

  private _onReadyEvent() {
    this.config('SET', 'notify-keyspace-events', 'Ex');
  }

  private async _onMessageEvent(channel: string, message: string) {
    switch (channel) {
      case ExpiredKeyEvent:
        this.eventEmitter.emit(ExpiredKeyEvent, message);
        return;

      default:
        return;
    }
  }
}
