export class MigrationCreatedEvent {
  constructor(
    public readonly migrationId: string,
    public readonly userId: string,
    public readonly sourceChain: string,
    public readonly destinationChain: string,
    public readonly amount: string,
    public readonly occurredAt: Date = new Date(),
  ) {}
}
