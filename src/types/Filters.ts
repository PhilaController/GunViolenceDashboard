interface FilterConfigBase {
  name: string;
  label: string;
}

export interface SwitchFilterConfig extends FilterConfigBase {
  kind: "switch";
  default: true | false;
  getFilter: (value: boolean) => boolean | null;
}

export interface CheckboxFilterConfig<T> extends FilterConfigBase {
  kind: "checkbox";
  default: T[];
  getFilter: (value: T[]) => (d: T) => boolean;
  categories: { value: T; text: string }[];
  ncol: number;
}

export interface SliderFilterConfig extends FilterConfigBase {
  kind: "slider";
  default?: [number, number];
  getFilter: (
    value: [number, number],
    excludeMissing?: boolean
  ) => boolean | [number, number] | null | ((d: number) => boolean);
  tooltip: {
    formatter: (value: number) => string;
  };
  showHistogram: true | false;
  autoLimits: true | false;
  excludeMissing: true | false;
}

export type FilterConfig =
  | SwitchFilterConfig
  | CheckboxFilterConfig<string>
  | CheckboxFilterConfig<number>
  | SliderFilterConfig;
