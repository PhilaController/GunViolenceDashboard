import crossfilter from "crossfilter2";

/** Types of different filters */
export type CrossfilterTypes = boolean | string[] | number[] | [number, number];

/** The crossfilter value */
export type FilterValue = crossfilter.FilterValue;

/** Base filter config that each filter type has */
interface FilterConfigBase {
  name: string;
  label: string;
}

export interface SwitchFilterConfig extends FilterConfigBase {
  kind: "switch";
  default: boolean;
  getFilter: (value: boolean, excludeMissing?: boolean) => boolean | null;
}

export interface CheckboxFilterConfig<T> extends FilterConfigBase {
  kind: "checkbox";
  default: T[];
  categories: { value: T; text: string }[];
  ncol: number;
  getFilter: (value: T[]) => (d: T) => boolean | null;
}

export interface SliderFilterConfig extends FilterConfigBase {
  kind: "slider";
  default?: [number, number];
  getFilter: (
    value: [number, number],
    excludeMissing?: boolean
  ) => ((d: number) => boolean) | [number, number] | boolean | null;
  tooltip: {
    formatter: (value: number) => string;
  };
  showHistogram: boolean;
  autoLimits: boolean;
  excludeMissing: boolean;
}

export type FilterConfig =
  | SwitchFilterConfig
  | CheckboxFilterConfig<string>
  | CheckboxFilterConfig<number>
  | SliderFilterConfig;
