/**
 * 2D Spatial Hash Grid (2.0 u cell size)
 * Layer 3 (sim): Zero-allocation query buffer for fast circle & range queries.
 */

export class SpatialHashGrid {
  private readonly cellSize: number;
  private readonly invCellSize: number;
  private readonly cells = new Map<number, number[]>();
  private readonly bucketPool: number[][] = [];
  private readonly seenSet = new Set<number>();

  constructor(cellSize = 2.0) {
    this.cellSize = cellSize;
    this.invCellSize = 1 / cellSize;
  }

  private hashCoords(cx: number, cy: number): number {
    // Pack two 16-bit signed cell indices into one 32-bit integer key
    return ((cx & 0xffff) << 16) | (cy & 0xffff);
  }

  public clear(): void {
    for (const bucket of this.cells.values()) {
      bucket.length = 0;
      this.bucketPool.push(bucket);
    }
    this.cells.clear();
  }

  public insert(id: number, x: number, y: number, radius: number): void {
    const minX = Math.floor((x - radius) * this.invCellSize);
    const maxX = Math.floor((x + radius) * this.invCellSize);
    const minY = Math.floor((y - radius) * this.invCellSize);
    const maxY = Math.floor((y + radius) * this.invCellSize);

    for (let cy = minY; cy <= maxY; cy++) {
      for (let cx = minX; cx <= maxX; cx++) {
        const key = this.hashCoords(cx, cy);
        let bucket = this.cells.get(key);
        if (!bucket) {
          bucket = this.bucketPool.pop() ?? [];
          this.cells.set(key, bucket);
        }
        bucket.push(id);
      }
    }
  }

  /**
   * Populates `outIds` with unique entity IDs in cells overlapping the query circle (x, y, radius).
   */
  public queryCircle(x: number, y: number, radius: number, outIds: number[]): void {
    outIds.length = 0;
    this.seenSet.clear();

    const minX = Math.floor((x - radius) * this.invCellSize);
    const maxX = Math.floor((x + radius) * this.invCellSize);
    const minY = Math.floor((y - radius) * this.invCellSize);
    const maxY = Math.floor((y + radius) * this.invCellSize);

    for (let cy = minY; cy <= maxY; cy++) {
      for (let cx = minX; cx <= maxX; cx++) {
        const bucket = this.cells.get(this.hashCoords(cx, cy));
        if (!bucket) continue;
        for (let i = 0; i < bucket.length; i++) {
          const id = bucket[i]!;
          if (!this.seenSet.has(id)) {
            this.seenSet.add(id);
            outIds.push(id);
          }
        }
      }
    }
  }
}
