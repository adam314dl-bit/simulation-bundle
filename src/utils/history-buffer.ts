/**
 * Pre-allocated ring buffer with O(1) push, read, and random access.
 * Used for simulation history storage (UTIL-02, CORE-03).
 *
 * Memory layout: fixed-size array pre-allocated at construction.
 * head pointer tracks the next write position.
 * index 0 = oldest item (wraps correctly after overflow).
 */
export class RingBuffer<T> {
  private readonly buffer: (T | undefined)[];
  private head = 0;
  private _size = 0;

  constructor(readonly capacity: number) {
    // Pre-allocate: avoids GC reallocation pressure during simulation
    this.buffer = new Array(capacity);
  }

  /** O(1) push. Overwrites oldest item when buffer is full. */
  push(item: T): void {
    this.buffer[this.head] = item;
    this.head = (this.head + 1) % this.capacity;
    if (this._size < this.capacity) this._size++;
  }

  /**
   * O(1) random access. index 0 = oldest item.
   * Returns undefined if index is out of bounds.
   */
  get(index: number): T | undefined {
    if (index < 0 || index >= this._size) return undefined;
    const oldest = this._size < this.capacity ? 0 : this.head;
    const physical = (oldest + index) % this.capacity;
    return this.buffer[physical];
  }

  /** The most recently pushed item. */
  get latest(): T | undefined {
    if (this._size === 0) return undefined;
    const lastPhysical = (this.head - 1 + this.capacity) % this.capacity;
    return this.buffer[lastPhysical];
  }

  /** Number of valid entries (0 to capacity). */
  get size(): number {
    return this._size;
  }

  /** True when size === capacity. */
  get isFull(): boolean {
    return this._size === this.capacity;
  }

  /**
   * Reset to empty state. Does NOT reallocate the buffer array --
   * keeps pre-allocated memory to avoid GC pressure during simulation reset.
   */
  clear(): void {
    this.head = 0;
    this._size = 0;
    // Intentionally NOT reassigning this.buffer -- keep pre-allocated slots
  }
}
