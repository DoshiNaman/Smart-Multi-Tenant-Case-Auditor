import { Injectable, Logger } from '@nestjs/common';

const DEFAULT_CONCURRENCY = 3;

type Job = () => Promise<void>;

@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);
  private running = 0;
  private readonly waiting: Array<() => void> = [];
  private readonly concurrency = DEFAULT_CONCURRENCY;

  /**
   * Enqueue a fire-and-forget job. Returns immediately.
   * The job runs with bounded concurrency; failures are swallowed and logged.
   */
  enqueue(label: string, job: Job): void {
    void this.run(label, job);
  }

  private async run(label: string, job: Job): Promise<void> {
    if (this.running >= this.concurrency) {
      await new Promise<void>((resolve) => this.waiting.push(resolve));
    }
    this.running++;
    try {
      await job();
    } catch (err) {
      this.logger.error(
        `Job "${label}" threw unexpectedly`,
        err instanceof Error ? err.stack : String(err),
      );
    } finally {
      this.running--;
      const next = this.waiting.shift();
      if (next) next();
    }
  }
}
