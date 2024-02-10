import { injectable, decorate } from 'inversify';
import { PrismaClient as Prisma } from '@prisma/client';

decorate(injectable(), Prisma);

@injectable()
export class PrismaClient extends Prisma {
  public constructor() {
    super();
  }
}
