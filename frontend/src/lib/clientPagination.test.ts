import { describe, expect, it } from "vitest";
import { paginate } from "./clientPagination";

const items = Array.from({ length: 23 }, (_, index) => index);

describe("paginate", () => {
  it("returns the first-page slice with correct meta", () => {
    const result = paginate(items, 0, 10);
    expect(result.rows).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(result.page).toBe(0);
    expect(result.totalPages).toBe(3);
    expect(result.totalElements).toBe(23);
    expect(result.first).toBe(true);
    expect(result.last).toBe(false);
  });

  it("returns the middle-page slice", () => {
    const result = paginate(items, 1, 10);
    expect(result.rows).toEqual([10, 11, 12, 13, 14, 15, 16, 17, 18, 19]);
    expect(result.first).toBe(false);
    expect(result.last).toBe(false);
  });

  it("returns the partial last-page slice and marks last", () => {
    const result = paginate(items, 2, 10);
    expect(result.rows).toEqual([20, 21, 22]);
    expect(result.last).toBe(true);
    expect(result.first).toBe(false);
  });

  it("clamps out-of-range pages to the last valid page", () => {
    const result = paginate(items, 99, 10);
    expect(result.page).toBe(2);
    expect(result.rows).toEqual([20, 21, 22]);
    expect(result.last).toBe(true);
  });

  it("clamps negative pages to zero", () => {
    const result = paginate(items, -5, 10);
    expect(result.page).toBe(0);
    expect(result.first).toBe(true);
  });

  it("handles an empty list with a single virtual page", () => {
    const result = paginate([], 0, 10);
    expect(result.rows).toEqual([]);
    expect(result.totalElements).toBe(0);
    expect(result.totalPages).toBe(1);
    expect(result.first).toBe(true);
    expect(result.last).toBe(true);
  });
});
