import { describe, expect, it } from "vitest";
import { CITY_COORDINATES, coordinatesForCity } from "./city-coordinates";

describe("coordinatesForCity", () => {
  it("returns a point near the requested city's center", () => {
    const { lat, lng } = coordinatesForCity("Toshkent", 1);
    const center = CITY_COORDINATES.Toshkent;
    expect(Math.abs(lat - center.lat)).toBeLessThan(0.02);
    expect(Math.abs(lng - center.lng)).toBeLessThan(0.02);
  });

  it("is deterministic for the same city and seed", () => {
    const a = coordinatesForCity("Samarqand", 42);
    const b = coordinatesForCity("Samarqand", 42);
    expect(a).toEqual(b);
  });

  it("jitters differently for different seeds, avoiding exact overlap", () => {
    const a = coordinatesForCity("Buxoro", 1);
    const b = coordinatesForCity("Buxoro", 2);
    expect(a).not.toEqual(b);
  });

  it("falls back to a default point for an unknown city", () => {
    const { lat, lng } = coordinatesForCity("Not A Real City", 1);
    expect(Number.isFinite(lat)).toBe(true);
    expect(Number.isFinite(lng)).toBe(true);
  });
});
