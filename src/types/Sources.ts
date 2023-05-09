import { FeatureCollection, Geometry } from "geojson";

export type DataFeatureCollection = FeatureCollection<
  Geometry | null,
  { [name: string]: any }
>;

export interface SourceConfigBase {
  /** Name of the source */
  name: string;
  /** Column to match on when filtering features */
  filterColumn?: string;
  /** Optional format functions for columns */
  formatter?: object;
}

export interface GeoJsonSourceConfig extends SourceConfigBase {
  data: DataFeatureCollection | null;
}

export interface ArcgisSourceConfig extends SourceConfigBase {
  /** The url to pull data from */
  url: string;
  /** Only query these columns */
  outFields?: string[] | string;
  /** Where clause */
  where?: string;
  /** Precision */
  geometryPrecision?: number;
  data?: FeatureCollection<Geometry | null, { [name: string]: any }> | null;
}

export interface BatchArcgisSourceConfig extends ArcgisSourceConfig {
  whereColumn: string;
  batchSize: number;
}

export type SourceConfig =
  | GeoJsonSourceConfig
  | ArcgisSourceConfig
  | BatchArcgisSourceConfig;
