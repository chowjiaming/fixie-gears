export type WheelSizeId = "700c" | "650b" | "26in";

export interface WheelSpec {
  beadSeatDiameterMm: number;
  tireWidthMm: number;
}

export interface DrivetrainConfig {
  chainringTeeth: number;
  cogTeeth: number;
  wheel: WheelSpec;
  crankLengthMm: number;
  ambidextrousSkidder: boolean;
}

export interface SpeedRow {
  cadenceRpm: number;
  speedKmh: number;
  speedMph: number;
}

export interface DerivedMetrics {
  ratio: number;
  gearInches: number;
  developmentMeters: number;
  gainRatio: number;
  rolloutMeters: number;
  wheelDiameterMm: number;
  skidPatches: number;
  speeds: SpeedRow[];
}
