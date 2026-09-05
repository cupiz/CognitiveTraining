import { describe, it, expect } from "vitest";
import { createRng, shuffle, sample, pick } from "./seed.js";

describe("createRng", () => {
  it("produces values in [0, 1)", () => {
    const rng = createRng(42);
    for (let i = 0; i < 100; i++) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it("is deterministic with the same seed", () => {
    const rng1 = createRng(12345);
    const rng2 = createRng(12345);
    const seq1 = Array.from({ length: 10 }, () => rng1());
    const seq2 = Array.from({ length: 10 }, () => rng2());
    expect(seq1).toEqual(seq2);
  });

  it("produces different sequences for different seeds", () => {
    const rng1 = createRng(1);
    const rng2 = createRng(2);
    const seq1 = Array.from({ length: 10 }, () => rng1());
    const seq2 = Array.from({ length: 10 }, () => rng2());
    expect(seq1).not.toEqual(seq2);
  });
});

describe("shuffle", () => {
  it("returns same elements in different order", () => {
    const rng = createRng(42);
    const arr = [1, 2, 3, 4, 5];
    const result = shuffle(arr, rng);
    expect(result.sort()).toEqual(arr.sort());
  });

  it("does not mutate original", () => {
    const rng = createRng(42);
    const arr = [1, 2, 3, 4, 5];
    const original = [...arr];
    shuffle(arr, rng);
    expect(arr).toEqual(original);
  });

  it("is deterministic with same seed", () => {
    const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const r1 = shuffle(arr, createRng(99));
    const r2 = shuffle(arr, createRng(99));
    expect(r1).toEqual(r2);
  });
});

describe("sample", () => {
  it("returns n unique items", () => {
    const rng = createRng(42);
    const arr = [1, 2, 3, 4, 5];
    const result = sample(arr, 3, rng);
    expect(result).toHaveLength(3);
    expect(new Set(result).size).toBe(3);
  });

  it("returns all items when n >= arr.length", () => {
    const rng = createRng(42);
    const arr = [1, 2, 3];
    const result = sample(arr, 5, rng);
    expect(result).toHaveLength(3);
  });
});

describe("pick", () => {
  it("returns an item from the array", () => {
    const rng = createRng(42);
    const arr = ["a", "b", "c"];
    const result = pick(arr, rng);
    expect(arr).toContain(result);
  });
});
