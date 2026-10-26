/**
 * Generic Zero-Heap-Allocation Object Pool
 * Layer 1 (core): Tracks active and reserved counts for debug inspection.
 */

export class ObjectPool<T> {
  private readonly pool: T[] = [];
  private activeCount = 0;

  constructor(
    private readonly factory: () => T,
    private readonly reset: (item: T) => void,
    initialCapacity: number,
    private readonly maxCapacity: number = initialCapacity * 2
  ) {
    for (let i = 0; i < initialCapacity; i++) {
      this.pool.push(this.factory());
    }
  }

  public acquire(): T {
    this.activeCount++;
    return this.pool.pop() ?? this.factory();
  }

  public release(item: T): void {
    this.activeCount = Math.max(0, this.activeCount - 1);
    this.reset(item);
    if (this.pool.length < this.maxCapacity) {
      this.pool.push(item);
    }
  }

  public getStats(): { active: number; available: number; maxCapacity: number } {
    return {
      active: this.activeCount,
      available: this.pool.length,
      maxCapacity: this.maxCapacity,
    };
  }
}
