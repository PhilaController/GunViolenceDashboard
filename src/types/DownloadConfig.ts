export interface DownloadConfig {
  /**
   * The columns to exclude before downloading
   */
  exclude: string[];

  /**
   * Formatters to apply to output columns
   */
  formatters: { [key: string]: (d: any) => any };

  /**
   * Rename columns
   */
  rename?: { [key: string]: string };
}

export interface DataDownloadParams {
  aggLayer: string;
  ignoreFilters: boolean;
  outputType: "CSV" | "GeoJSON";
}
