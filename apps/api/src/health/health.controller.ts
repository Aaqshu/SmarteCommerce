import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('health')
export class HealthController {
  constructor(private db: PrismaService) {}

  @Get()
  async health() {
    let database = false;
    try {
      await this.db.$queryRaw`SELECT 1`;
      database = true;
    } catch {
      database = false;
    }
    return { status: 'ok', database };
  }
}
