import { inject, injectable } from 'inversify';

import { LoggingService } from '../logging';

@injectable()
export class PlansService {
  public constructor(
    @inject(LoggingService) private readonly logger: LoggingService
  ) {}
}
