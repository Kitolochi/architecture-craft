// Saga Orchestrator: coordinates multi-step distributed transactions.
//
// In a distributed system, you can't use a single database transaction
// across services. The saga pattern breaks a transaction into a sequence
// of steps, each with a compensation (undo) action.
//
// Orchestration style: a central coordinator drives the steps.
// - Pro: easy to understand the flow, centralized error handling
// - Con: the orchestrator is a single point of coupling
//
// Choreography style (alternative): each service emits events, and the
// next service reacts. No central coordinator, but harder to trace flows.
//
// If step N fails, the orchestrator runs compensation for steps N-1 down to 1.

export type StepStatus = 'pending' | 'completed' | 'compensated' | 'failed';

export interface SagaStep<TContext> {
  name: string;
  execute: (context: TContext) => Promise<void>;
  compensate: (context: TContext) => Promise<void>;
}

export interface StepRecord {
  name: string;
  status: StepStatus;
  error?: string;
  startedAt?: Date;
  completedAt?: Date;
}

export interface SagaResult {
  success: boolean;
  steps: StepRecord[];
  error?: string;
}

export class SagaOrchestrator<TContext> {
  private steps: SagaStep<TContext>[] = [];

  // Add a step to the saga. Steps execute in the order they are added.
  // Each step must have both an execute and a compensate function.
  addStep(step: SagaStep<TContext>): this {
    this.steps.push(step);
    return this;
  }

  // Run the saga: execute each step in order, compensate on failure.
  //
  // The orchestrator tracks the status of every step so you can inspect
  // what happened after the saga completes (or fails).
  async run(context: TContext): Promise<SagaResult> {
    const records: StepRecord[] = this.steps.map((step) => ({
      name: step.name,
      status: 'pending' as StepStatus,
    }));

    const completedSteps: number[] = [];

    for (let i = 0; i < this.steps.length; i++) {
      const step = this.steps[i];
      records[i].startedAt = new Date();

      try {
        console.log(`[Saga] Executing step: ${step.name}`);
        await step.execute(context);
        records[i].status = 'completed';
        records[i].completedAt = new Date();
        completedSteps.push(i);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        records[i].status = 'failed';
        records[i].error = message;
        console.log(`[Saga] Step "${step.name}" failed: ${message}`);

        // Compensate completed steps in reverse order
        await this.compensate(context, completedSteps, records);

        return {
          success: false,
          steps: records,
          error: `Step "${step.name}" failed: ${message}`,
        };
      }
    }

    console.log('[Saga] All steps completed successfully');
    return { success: true, steps: records };
  }

  private async compensate(
    context: TContext,
    completedSteps: number[],
    records: StepRecord[]
  ): Promise<void> {
    console.log(`[Saga] Compensating ${completedSteps.length} completed steps...`);

    // Compensate in reverse order (last completed first)
    for (const i of completedSteps.reverse()) {
      const step = this.steps[i];
      try {
        console.log(`[Saga] Compensating step: ${step.name}`);
        await step.compensate(context);
        records[i].status = 'compensated';
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[Saga] Compensation failed for "${step.name}": ${message}`);
        records[i].status = 'failed';
        records[i].error = `Compensation failed: ${message}`;
      }
    }
  }
}
