import { FeatureCollection, Point, Feature } from "geojson";

export type RaceValues = "B" | "H" | "W" | "A" | "Other/Unknown";
export type SexValues = "M" | "F";
export type AgeGroupValues =
  | "18 to 30"
  | "Younger than 18"
  | "31 to 45"
  | "Older than 45"
  | "Unknown";

export interface ShootingVictimsProperties {
  /**
   * The unique incident number
   */
  dc_key: string;
  /**
   * The victim's race
   */
  race: RaceValues;
  /**
   * The victims's sex
   */
  sex: SexValues;
  /**
   * Whether the shooting was fatal
   */
  fatal: true | false;
  /**
   * The date as a string
   */
  date: string;
  /**
   * The age group
   */
  age_group: AgeGroupValues;
  /**
   * Whether the incident has a court case
   */
  has_court_case: true | false;
  /**
   * The victim's age; some of these are missing
   */
  age: number | null;
  /**
   * Name of street where incident occurred
   */
  street_name: string | null;
  /**
   * Block where incident occurred
   */
  block_number: number | null;
  /**
   * ID of street segment where incident occurred
   */
  segment_id: string | null;
  /**
   * ZIP code where incident occurred
   */
  zip_code: string | null;
  /**
   * Council district where incident occurred
   */
  council_district: string;
  /**
   * Police district where incident occurred
   */
  police_district: string | null;
  /**
   * Neighborhood where incident occurred
   */
  neighborhood: string | null;
  /**
   * Elementary school catchment
   */
  school_name: string | null;
  /**
   * PA House district
   */
  house_district: string | null;
  /**
   * PA Senate district
   */
  senate_district: string | null;

  /**
   * Sunday - Saturday : 0 - 6
   */
  weekday: number;
  /**
   * The time, in milliseconds since midnight
   */
  timeInMs: number;
  /**
   * The date in milliseconds since Jan 1, 1970
   */
  dateInMs: number;
}

export type ShootingVictimsGeoJson = FeatureCollection<
  Point | null,
  ShootingVictimsProperties
>;

export type ShootingVictimsFeatures = Feature<
  Point | null,
  ShootingVictimsProperties
>[];
