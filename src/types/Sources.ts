import { FeatureCollection, Geometry, GeoJsonProperties } from "geojson";

export interface SourceConfigBase {
  /** Name of the source */
  name: string;
  /** Column to match on when filtering features */
  filterColumn?: string;
  /** Optional format functions for columns */
  formatter?: object;
}

export interface GeoJsonSourceConfig extends SourceConfigBase {
  data: FeatureCollection<Geometry | null, GeoJsonProperties> | null;
}

export interface ArcgisSourceConfig extends SourceConfigBase {
  /** The url to pull data from */
  url: string;
  /** Only query these columns */
  outFields?: string[];
}

export interface BatchArcgisSourceConfig extends ArcgisSourceConfig {
  whereColumn: string;
  batchSize: number;
}

export type SourceConfig =
  | GeoJsonSourceConfig
  | ArcgisSourceConfig
  | BatchArcgisSourceConfig;
