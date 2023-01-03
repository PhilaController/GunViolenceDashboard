export type TitleFunction = (data: any) => string;

export interface AggregatedLayerConfig {
  /** Display name */
  name: string;
  /** Name of the map source */
  source: string;
  /** Type of map layer */
  type: "fill";
  /** Aggregated layer */
  aggregated: true;
  /** Is this layer an overlay option? */
  overlay?: true | false;
  /** Should we show this layer initially? */
  showOnStart?: true | false;
  /** The name of the data column */
  column: string;
  /** The name of the column in the geo data to match on */
  geoid: string;
  /** Tooltip configuration */
  tooltip?: {
    formatter: (data: object) => string;
    on: "mousemove" | "mouseover";
  };
}

export interface MapLayerConfig {
  /** Display name */
  name: string;
  /** Name of the map source */
  source: string;
  /** Type of map layer */
  type: "line" | "fill" | "circle" | "heatmap";
  /** Aggregated layer */
  aggregated: true | false;
  /** The name of the data column */
  column?: string;
  /** Show this layer before a specific layer ID */
  beforeId?: string;
  /** The name of the column in the geo data to match on */
  geoid?: string;
  /** The map paint object */
  paint?: object;
  /** Is this layer static */
  static?: true | false;
  /** Should we show this layer initially? */
  showOnStart?: true | false;
  /** Tooltip configuration */
  tooltip?: {
    formatter: (data: any) => string;
    on: "mousemove" | "mouseover";
  };
  /** Config for the legend */
  legend?: {
    colorScheme: string;
    scaleName: string;
    colorRange: [number, number];
  };
}

export type LayerConfig = AggregatedLayerConfig | MapLayerConfig;
