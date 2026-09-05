import { z } from "zod";

export const UUID = z.string().uuid();
export type UUID = z.infer<typeof UUID>;

export const Email = z.string().email();
export type Email = z.infer<typeof Email>;

export const ISODateTime = z.string().datetime({ offset: true });
export type ISODateTime = z.infer<typeof ISODateTime>;

export type JSONValue = string | number | boolean | null | JSONValue[] | { [key: string]: JSONValue };

export const JSONValue: z.ZodType<JSONValue> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(JSONValue),
    z.record(JSONValue),
  ]),
);

export const JsonObject = z.record(JSONValue);
export type JsonObject = z.infer<typeof JsonObject>;

/** Difficulty level, clamped 1..10 */
export const Difficulty = z.number().min(1).max(10);
export type Difficulty = z.infer<typeof Difficulty>;

/** Normalized performance score, clamped 0..1 */
export const PerformanceScore = z.number().min(0).max(1);
export type PerformanceScore = z.infer<typeof PerformanceScore>;

/** Product performance index, displayed as 0..100 */
export const PerformanceIndex = z.number().min(0).max(100);
export type PerformanceIndex = z.infer<typeof PerformanceIndex>;
