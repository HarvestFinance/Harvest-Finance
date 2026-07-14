import { Module, Global } from '@nestjs/common';
import { CustomLoggerService } from './custom-logger.service';

@Global()
@Module({
  providers: [CustomLoggerService],
  exports: [CustomLoggerService],
})
export class LoggerModule {}
