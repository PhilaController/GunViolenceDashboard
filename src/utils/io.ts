import * as Papa from "papaparse";
import { DataFeatureCollection } from "@/types/Sources";
import { GenericFeature } from "@/types/Data";

export async function githubFetch(jsonFilename: string): Promise<any> {
  /**
   * Fetches the specified filename from the processed/ folder of the
   * `gun-violenced-dashboard-data` GitHub repository
   *
   * @param jsonFilename the name of the JSON file to fetch
   * @returns the fetched JSON data
   */

  const REPO =
    "https://raw.githubusercontent.com/PhiladelphiaController/gun-violence-dashboard-data";
  const response = await fetch(
    `${REPO}/master/gun_violence_dashboard_data/data/processed/${jsonFilename}`
  );
  const data = await response.json();
  return data;
}

export function jsonToGeoJson(data: GenericFeature[]): string {
  /**
   * Convert an array of objects to GeoJSON format
   *
   * @param data array of features to convert
   * @returns the string version of the GeoJSON data
   */

  //   Trim keys
  const features = data.map((d: GenericFeature, i: number) => {
    return {
      type: "Feature",
      id: i,
      geometry: d.geometry,
      properties: d.properties,
    };
  });

  // The content
  const collection = { type: "FeatureCollection", features: features };
  return JSON.stringify(collection);
}

export function jsonToCSV(data: GenericFeature[]): string {
  /* Convert JSON object to CSV string */

  return Papa.unparse(
    //   Add lat/lng
    data.map((d: GenericFeature) => {
      // Properties and geometry
      const out = Object.assign({}, d.properties);
      const geo = d.geometry;

      //   Get the lat/lng
      if (geo) {
        out["lng"] = geo.coordinates[0];
        out["lat"] = geo.coordinates[1];
      } else {
        out["lng"] = null;
        out["lat"] = null;
      }

      // Trim to the right columns
      return out;
    })
  );
}

export function downloadFile(
  content: string,
  contentType: string,
  fileName: string
) {
  /* Download the content to the specified file */

  // Create the link
  const a = document.createElement("a");

  // Create object to download
  const file = new Blob([content], { type: contentType });
  a.href = URL.createObjectURL(file);

  // Set the file name
  a.download = fileName;

  // Trigger download
  a.click();
}

export async function queryFeatureServerBatch({
  url,
  where_key,
  where_value,
  outFields = "*",
  geometryPrecision = 5,
  batch_size = 2000,
}: {
  url: string;
  where_key: string;
  where_value: any[];
  outFields?: string[] | string;
  geometryPrecision?: number;
  batch_size?: number;
}): Promise<DataFeatureCollection> {
  /**
   * Fetches the data from a ArcGIS Esri Feature Server in batches
   *
   */

  // Request data in batches
  let start = 0;
  let stop = batch_size;

  // Output collection
  const collection: DataFeatureCollection = {
    type: "FeatureCollection",
    features: [],
  };

  // Loop until all data is queried
  while (start < where_value.length) {
    // Create the where parameter
    const value = where_value.slice(start, stop);
    const where = `${where_key} IN (${value.join()})`;

    // Submit the query
    const result = await queryFeatureServer({
      url,
      outFields,
      geometryPrecision,
      where,
    });

    // Save the features
    collection.features = collection.features.concat(result.features);

    // Update start/stop
    start = stop;
    stop += batch_size;
  }

  return collection;
}

export async function queryFeatureServer({
  url,
  outFields = "*",
  geometryPrecision = 5,
  where = "1=1",
}: {
  url: string;
  outFields?: string | string[];
  geometryPrecision?: number;
  where?: string;
}): Promise<DataFeatureCollection> {
  /**
   * Fetches the data from a ArcGIS Esri Feature Server
   *
   */

  // The query params
  const params = {
    f: "geojson",
    outFields: outFields,
    geometryPrecision: geometryPrecision,
    where: where,
  };

  // Get the param string
  const params_str = Object.entries(params)
    .map(([k, v]) => `${k}=${v}`)
    .join("&");

  const options = {
    method: "POST",
    body: new URLSearchParams(params_str),
  };

  const r = await fetch(`${url}/query`, options);
  const result = await r.json();
  return result;
}
