import * as Papa from "papaparse"

export async function githubFetch(filename) {
  /* Fetch data from Github */

  let url = "https://raw.githubusercontent.com/PhiladelphiaController/gun-violence-dashboard-data/master/gun_violence_dashboard_data/data/processed/"
  try {
    const response = await fetch(url + filename);
    let data = await response.json();
    return data
  } catch (e) {
    console.error(e);
  }
}

export async function AWSFetch(filename) {
  /* Fetch data from AWS s3 */

  let url = "https://gun-violence-dashboard.s3.amazonaws.com/";
  try {
    const response = await fetch(url + filename);
    let data = await response.json();
    return data
  } catch (e) {
    console.error(e);
  }
}

export function jsonToGeoJson(data) {
  /* Convert JSON object to GeoJSON */

  //   Trim keys
  let features = data.map((o, i) => {
    return {
      type: "Feature", id: i, geometry: o.geometry,
      properties: o.properties
    }
  });

  // The content
  let collection = { type: "FeatureCollection", features: features };
  return JSON.stringify(collection);
}


export function jsonToCSV(data) {
  /* Convert JSON object to CSV */

  return Papa.unparse(
    //   Add lat/lng
    data.map((d) => {
      // Properties and geometry
      let out = d.properties;
      let geo = d.geometry;

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

export function downloadFile(content, contentType, fileName) {
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

export async function queryFeatureServerBatch({ url,
  where_key, where_value, outFields = "*", geometryPrecision = 5, batch_size = 2000 }) {

  // Request data in batches
  let start = 0;
  let stop = batch_size;

  // Output collection
  let collection = { type: "FeatureCollection", features: [] };

  // Loop until all data is queried
  while (start < where_value.length) {

    // Create the where parameter
    let value = where_value.slice(start, stop);
    let where = `${where_key} IN (${value.join()})`;

    // Submit the query
    const result = await queryFeatureServer({ url, outFields, geometryPrecision, where })

    // Save the features
    collection.features = collection.features.concat(result.features);

    // Update start/stop
    start = stop;
    stop += batch_size;
  }

  return collection;
}


export async function queryFeatureServer({ url,
  outFields = "*", geometryPrecision = 5, where = "1=1" }) {
  /* Query a feature server */

  // The query params
  let params = {
    f: "geojson",
    outFields: outFields,
    geometryPrecision: geometryPrecision,
    where: where
  };

  // Get the param string
  let params_str = Object.entries(params)
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
