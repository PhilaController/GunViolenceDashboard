export interface DownloadConfig {
  /**
   * The columns to exclude before downloading
   */
  exclude: string[];

  /**
   *
   */
  formatters: { [key: string]: (d: any) => any };
}
