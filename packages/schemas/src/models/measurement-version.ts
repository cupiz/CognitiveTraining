import { z } from "zod";

/**
 * Measurement version schema — tracks algorithm versions for reproducibility.
 *
 * Every derived result must store:
 * - scoringVersion
 * - adaptiveVersion
 * - normVersion (nullable)
 * - mappingVersion
 *
 * @see docs/08_SCORING_AND_NORMS.md §7
 */

export const MeasurementVersion = z.object({
  /** Scoring algorithm version */
  scoringVersion: z.string(),

  /** Adaptive algorithm version */
  adaptiveVersion: z.string(),

  /** Domain mapping version */
  mappingVersion: z.string(),

  /** Norm version (null if no norms applied) */
  normVersion: z.string().nullable(),

  /** Full algorithm version string for logging */
  algorithmVersion: z.string(),
});

export type MeasurementVersion = z.infer<typeof MeasurementVersion>;

/**
 * Create a measurement version from individual component versions.
 */
export function createMeasurementVersion(overrides: Partial<MeasurementVersion> = {}): MeasurementVersion {
  return {
    scoringVersion: "scoring-v0.1",
    adaptiveVersion: "adaptive-v0.1-mvp",
    mappingVersion: "mapping-v0.1",
    normVersion: null,
    algorithmVersion: "v0.1.0",
    ...overrides,
  };
}

/**
 * Get the current default measurement version.
 */
export function getCurrentMeasurementVersion(): MeasurementVersion {
  return createMeasurementVersion();
}

/**
 * Compare two measurement versions for compatibility.
 */
export function areVersionsCompatible(a: MeasurementVersion, b: MeasurementVersion): boolean {
  // Major version must match
  const aMajor = a.algorithmVersion.split(".")[0];
  const bMajor = b.algorithmVersion.split(".")[0];
  return aMajor === bMajor;
}

/**
 * Serialize measurement version for storage.
 */
export function serializeMeasurementVersion(version: MeasurementVersion): string {
  return JSON.stringify(version);
}

/**
 * Deserialize measurement version from storage.
 */
export function deserializeMeasurementVersion(json: string): MeasurementVersion {
  return MeasurementVersion.parse(JSON.parse(json));
}
