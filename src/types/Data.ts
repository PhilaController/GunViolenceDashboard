import { Point, GeoJsonObject } from "geojson";
import crossfilter from "crossfilter2";

export type UnionToIntersection<U> = (
  U extends any ? (k: U) => void : never
) extends (k: infer I) => void
  ? I
  : never;

export interface GenericFeature extends GeoJsonObject {
  type: "Feature";
  /**
   * The feature's geometry
   */
  geometry: Point | null;
  /**
   * A value that uniquely identifies this feature in a
   * https://tools.ietf.org/html/rfc7946#section-3.2.
   */
  id?: string | number | undefined;
  /**
   * Properties associated with this feature.
   */
  properties: { [name: string]: any };
}

export interface GenericFeatureCollection extends GeoJsonObject {
  type: "FeatureCollection";
  features: GenericFeature[];
}

export interface CrossfilterDimensions {
  [key: string]: crossfilter.Dimension<
    GenericFeature,
    crossfilter.NaturallyOrderedValue
  >;
}
