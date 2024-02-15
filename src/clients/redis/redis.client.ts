import { inject, injectable, decorate } from 'inversify';
import Redis from 'ioredis';
import { EventEmitter } from 'eventemitter3';

import { REDIS_URL } from '../../environment';
import { DISymbols } from '../../di.interfaces';
import {
  DeletedKeyEvent,
  ExpiredKeyEvent,
  RemovedKeyEvent,
} from './redis.interfaces';

decorate(injectable(), Redis);

@injectable()
export class RedisClient extends Redis {
  private readonly _subscriber: Redis;

  public constructor(
    @inject(DISymbols.EventEmitter) private readonly eventEmitter: EventEmitter
  ) {
    super(REDIS_URL);
    this.on('ready', this._onReadyEvent.bind(this));

    this._subscriber = new Redis(REDIS_URL);
    this._subscriber.subscribe(ExpiredKeyEvent);
    this._subscriber.subscribe(DeletedKeyEvent);
    this._subscriber.on('message', this._onMessageEvent.bind(this));
  }

  private _onReadyEvent() {
    this.config('SET', 'notify-keyspace-events', 'Egx');
  }

  private async _onMessageEvent(channel: string, message: string) {
    switch (channel) {
      case ExpiredKeyEvent:
      case DeletedKeyEvent:
        this.eventEmitter.emit(RemovedKeyEvent, message);
        return;

      default:
        return;
    }
  }
}
