export type TitleFunction = (data: any) => string;

interface BaseLayerConfig {
  /** Display name */
  name: string;
  /** Name of the map source */
  source: string;
  /** Aggregated layer? */
  aggregated: true | false;
  /** The map paint object */
  paint?: object;
  /** Is this layer an overlay option? */
  overlay?: true | false;
  /** Should we show this layer initially? */
  showOnStart?: true | false;
  /** Is this layer static */
  static?: true | false;
  /** The name of the data column */
  column?: string;
  /** The name of the column in the geo data to match on */
  geoid?: string;
  /** Tooltip configuration */
  tooltip?: {
    formatter: (data: any) => string;
    on: "mousemove" | "mouseenter";
  };
  /** Config for the legend */
  legend?: {
    colorScheme: string;
    scaleName: string;
    colorRange: [number, number];
  };
  /** Show this layer before a specific layer ID */
  beforeId?: string;
}

export interface AggregatedLayerConfig extends BaseLayerConfig {
  /** Aggregated layer */
  aggregated: true;
  /** The name of the data column */
  column: string;
  /** The name of the column in the geo data to match on */
  geoid: string;
  /** Type of map layer */
  type: "fill";
}

export interface MapLayerConfig extends BaseLayerConfig {
  /** Type of map layer */
  type: "line" | "circle" | "heatmap";
}

export type LayerConfig = AggregatedLayerConfig | MapLayerConfig;
