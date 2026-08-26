export enum CircuitState {
  CLOSED,
  OPEN,
  HALF_OPEN,
}

export interface CircuitBreakerOptions {
  failureThreshold: number;
  cooldownMs: number;
  onStateChange?: (state: CircuitState) => void;
}

export class CircuitBreaker {
  private state = CircuitState.CLOSED;
  private failures = 0;
  private nextAttempt = 0;

  constructor(private readonly options: CircuitBreakerOptions) {}

  async execute<T>(action: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (Date.now() >= this.nextAttempt) {
        this.transitionTo(CircuitState.HALF_OPEN);
      } else {
        throw new Error('CircuitBreaker is OPEN');
      }
    }

    try {
      const result = await action();
      if (this.state === CircuitState.HALF_OPEN) {
        this.transitionTo(CircuitState.CLOSED);
      }
      return result;
    } catch (error) {
      this.failures++;
      if (
        this.state === CircuitState.HALF_OPEN ||
        this.failures >= this.options.failureThreshold
      ) {
        this.transitionTo(CircuitState.OPEN);
      }
      throw error;
    }
  }

  private transitionTo(newState: CircuitState) {
    this.state = newState;
    if (newState === CircuitState.CLOSED) {
      this.failures = 0;
    } else if (newState === CircuitState.OPEN) {
      this.nextAttempt = Date.now() + this.options.cooldownMs;
    }
    this.options.onStateChange?.(newState);
  }
}
