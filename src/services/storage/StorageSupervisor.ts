/**
 * src/services/storage/StorageSupervisor.ts - Sprint 21
 * Manages persistence scheduling, snapshot serialization, retry backoff,
 * and writer generation conflicts across storage layers.
 */
import type { CorpusExplorerService } from '../clm/corpusExplorerService';
import type { WorkbenchStores } from '../../stores/createWorkbenchStores';

export interface StorageSupervisorOptions {
  flush: () => Promise<void>;
  corpusExplorer: CorpusExplorerService;
  stores: WorkbenchStores;
}

export class StorageSupervisor {
  private isFlushing: boolean = false;
  private flushPromise: Promise<void> | null = null;
  private retryAttempts: number = 0;

  constructor(private options: StorageSupervisorOptions) {}

  public flush(): Promise<void> {
    if (this.isFlushing && this.flushPromise) {
      return this.flushPromise;
    }

    this.isFlushing = true;
    this.flushPromise = (async () => {
      try {
        await this.options.flush();
        this.retryAttempts = 0;
        const view = this.options.stores.$corpusView.get();
        if (view.persistenceError) {
          this.options.stores.$corpusView.set({
            ...view,
            persistence: 'persistent',
            persistenceError: undefined,
          });
        }
      } catch (err: any) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        const view = this.options.stores.$corpusView.get();
        this.options.stores.$corpusView.set({
          ...view,
          persistenceError: errorMsg,
        });
        throw err;
      } finally {
        this.isFlushing = false;
        this.flushPromise = null;
      }
    })();

    return this.flushPromise;
  }

  public async retryFlush(): Promise<boolean> {
    try {
      if (this.options.corpusExplorer && typeof this.options.corpusExplorer.flush === 'function') {
        await this.options.corpusExplorer.flush();
      } else {
        await this.flush();
      }
      const view = this.options.stores.$corpusView.get();
      this.options.stores.$corpusView.set({
        ...view,
        persistence: 'persistent',
        persistenceError: undefined,
      });
      return true;
    } catch (err: any) {
      this.retryAttempts++;
      const view = this.options.stores.$corpusView.get();
      this.options.stores.$corpusView.set({
        ...view,
        persistenceError: err instanceof Error ? err.message : String(err),
      });
      return false;
    }
  }

  public handleStaleConflict(expectedGen: number, actualGen: number): void {
    const view = this.options.stores.$corpusView.get();
    this.options.stores.$corpusView.set({
      ...view,
      persistence: 'stale',
      persistenceError: `Stale writer conflict: generation ${expectedGen} superseded by ${actualGen}`,
    });
  }

  public reset(): void {
    this.isFlushing = false;
    this.flushPromise = null;
    this.retryAttempts = 0;
  }
}
