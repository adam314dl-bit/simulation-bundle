import { describe, it, expect } from 'vitest';
import { RingBuffer } from 'sim-kit/core';

describe('UTIL-02: RingBuffer — pre-allocated O(1) ring buffer', () => {
  it('push and get return correct values within capacity', () => {
    const buf = new RingBuffer<number>(5);
    buf.push(10);
    buf.push(20);
    buf.push(30);
    expect(buf.get(0)).toBe(10);
    expect(buf.get(1)).toBe(20);
    expect(buf.get(2)).toBe(30);
    expect(buf.size).toBe(3);
  });

  it('overwrites oldest items when full (capacity=5, push 6 items, get(0) returns item 2)', () => {
    const buf = new RingBuffer<number>(5);
    for (let i = 1; i <= 6; i++) buf.push(i);
    // After 6 pushes into cap=5: [2,3,4,5,6] — oldest is 2
    expect(buf.get(0)).toBe(2);
    expect(buf.get(4)).toBe(6);
    expect(buf.size).toBe(5);
    expect(buf.isFull).toBe(true);
  });

  it('latest returns most recently pushed item', () => {
    const buf = new RingBuffer<string>(3);
    buf.push('a');
    buf.push('b');
    expect(buf.latest).toBe('b');
  });

  it('get returns undefined for out-of-bounds index', () => {
    const buf = new RingBuffer<number>(5);
    buf.push(42);
    expect(buf.get(-1)).toBeUndefined();
    expect(buf.get(1)).toBeUndefined();
    expect(buf.get(100)).toBeUndefined();
  });

  it('clear resets size to 0 without reallocating', () => {
    const buf = new RingBuffer<number>(5);
    buf.push(1);
    buf.push(2);
    buf.clear();
    expect(buf.size).toBe(0);
    expect(buf.get(0)).toBeUndefined();
  });
});

describe('CORE-03: History ring buffer via SimulationProvider', () => {
  it('is a structural stub — verified via integration test after SimulationProvider implementation', () => {
    // Real test: SimulationProvider runs 1001 ticks, history.get(0) returns tick 2 state
    // Stub passes now, becomes meaningful in plan 01-05
    const buf = new RingBuffer<number>(1000);
    expect(buf.capacity).toBe(1000);
  });
});
