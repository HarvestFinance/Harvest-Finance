import { Injectable, NestMiddleware } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';
import { randomUUID, randomBytes } from 'crypto';
import { Request, Response, NextFunction } from 'express';

export interface TraceContext {
  traceId: string;
  spanId: string;
  requestId: string;
}

export const traceAls = new AsyncLocalStorage<TraceContext>();

export function getTraceContext(): TraceContext | undefined {
  return traceAls.getStore();
}

@Injectable()
export class TracingService {
  runWithContext<T>(context: TraceContext, fn: () => T): T {
    return traceAls.run(context, fn);
  }

  getContext(): TraceContext | undefined {
    return traceAls.getStore();
  }

  generateTraceId(): string {
    return randomBytes(16).toString('hex');
  }

  generateSpanId(): string {
    return randomBytes(8).toString('hex');
  }

  parseTraceparent(traceparent: string): Partial<TraceContext> {
    const match = traceparent.match(/^00-([0-9a-f]{32})-([0-9a-f]{16})-01$/);
    if (match) {
      return { traceId: match[1] };
    }
    return {};
  }
}

@Injectable()
export class TracingMiddleware implements NestMiddleware {
  constructor(private readonly tracingService: TracingService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const requestId = req.headers['x-request-id'] as string || randomUUID();
    const traceparent = req.headers['traceparent'] as string;
    
    let traceId = '';
    if (traceparent) {
      const parsed = this.tracingService.parseTraceparent(traceparent);
      if (parsed.traceId) traceId = parsed.traceId;
    }
    if (!traceId) {
      traceId = this.tracingService.generateTraceId();
    }

    const context: TraceContext = {
      traceId,
      spanId: this.tracingService.generateSpanId(),
      requestId,
    };

    res.setHeader('x-request-id', requestId);
    res.setHeader('traceparent', `00-${traceId}-${context.spanId}-01`);
    
    // Assign to req for logging middleware
    req.headers['x-request-id'] = requestId;

    this.tracingService.runWithContext(context, () => {
      next();
    });
  }
}
