<template>
  <div id="shootingsMapContainer" style="position: relative">
    <div class="legend-overlay-bar" v-if="showLegend()">
      <div class="legend-flex-wrapper">
        <Legend
          :height="20"
          :width="200"
          :colorScheme="legendColorScale"
          :range="legendRange"
        />
      </div>
    </div>
    <l-map
      :options="mapOptions"
      :zoom="zoom"
      :center="center"
      ref="shootingsMap"
      class="map-pane"
    >
      <!-- Overlay a lodader -->
      <v-overlay
        :value="isLoading"
        absolute
        opacity="0.6"
        color="#353d42"
        :z-index="9999999"
      >
        <v-progress-circular indeterminate size="64" color="#fff" />
      </v-overlay>

      <!-- The geojson -->
      <l-geo-json
        :visible="isActive('points')"
        :geojson="geojson"
        :options="pointOptions"
      />
    </l-map>
  </div>
</template>

<script>
// Local imports
import Legend from "./Legend";
import { msToTimeString } from "@/tools.js";

// Jquery
import $ from "jquery";

// Leaflet imports
import L from "leaflet";
import * as Vue2Leaflet from "vue2-leaflet";
import "leaflet.heat";

// d3 imports
import { min, max, rollup } from "d3-array";
import { scaleLog, scaleSequential } from "d3-scale";
import { interpolatePlasma, interpolateReds } from "d3-scale-chromatic";

// Import esri-leaflet too
const esri = require("esri-leaflet");

// Define the scale we want to use
const SCALE = interpolatePlasma;

function styleFunction(feature) {
  let fillColor = feature.properties.fatal ? "#d84545" : "#e5dc8e";
  let edgeColor = feature.properties.fatal ? "#af2828" : "#d3c913";
  return {
    radius: 6,
    fillColor: fillColor,
    color: edgeColor,
    weight: 1,
    opacity: 1,
    fillOpacity: 0.7,
  };
}

export default {
  components: {
    "l-map": Vue2Leaflet.LMap,
    "l-geo-json": Vue2Leaflet.LGeoJson,
    Legend,
  },
  props: ["geojson", "aggLayerOpacity", "aggLayerURLs"],
  data() {
    return {
      isLoading: false,
      legendColorScale: interpolatePlasma,
      legendRange: [0.5, 1.0],
      streetsURL:
        "https://services.arcgis.com/fLeGjb7u4uXqeF9q/arcgis/rest/services/Philadelphia_Streets/FeatureServer/0",
      activeLayers: ["points"],
      aggLayer: null,
      mapOptions: {
        maxZoom: 16,
        minZoom: 11,
        zoomControl: false,
        scrollWheelZoom: false,
      },
      zoom: 12,
      center: [39.9854507, -75.15],
      homeBounds: null,
      layers: {},
      panes: {},
      circle: { radius: 6, color: "#7ab5e5" },
      markerOptions: {
        radius: 8,
        fillColor: "#25cef7",
        color: "#25cef7",
        weight: 1,
        opacity: 0.8,
        fillOpacity: 0.5,
      },
    };
  },
  computed: {
    lengthGeojson() {
      return this.geojson.length;
    },
    aggExtent() {
      if (this.aggCounts) return [0, max(this.aggCounts, (d) => d[1])];
      else return null;
    },
    aggCounts() {
      if (this.geojson !== null) {
        return rollup(
          this.geojson,
          (v) => v.length,
          (d) => d.properties[this.aggLayer]
        );
      } else return null;
    },
    streetCounts() {
      if (this.isActive("streets")) {
        return rollup(
          this.geojson.filter((el) => el.properties.segment_id !== ""),
          (v) => v.length,
          (d) => d.properties.segment_id
        );
      } else return null;
    },
    uniqueStreets() {
      if (this.streetCounts) return Array.from(this.streetCounts.keys());
      else return null;
    },
    mapObject() {
      return this.$refs.shootingsMap.mapObject;
    },
    scale() {
      return scaleLog()
        .domain([this.minStreetCount, this.maxStreetCount])
        .range([0.5, 1]);
    },
    aggColorScale() {
      return scaleSequential(interpolateReds).domain(this.aggExtent);
    },
    minStreetCount() {
      if (this.streetCounts) return min(this.streetCounts.values());
      else return null;
    },
    maxStreetCount() {
      if (this.streetCounts) return max(this.streetCounts.values());
      else return null;
    },
    heatmapData() {
      return this.geojson.map((feature) =>
        feature.geometry.coordinates.slice().reverse().concat([1.0])
      );
    },
    pointOptions() {
      return {
        onEachFeature: this.onEachFeatureFunction,
        pointToLayer: this.pointToLayerFunction,
      };
    },
    pointToLayerFunction() {
      return (feature, latlng) => {
        return L.circleMarker(latlng, styleFunction(feature));
      };
    },

    onEachFeatureFunction() {
      return (feature, layer) => {
        let aliases = {
          W: "White (Non-Hispanic)",
          B: "Black (Non-Hispanic)",
          H: "Hispanic (Black or White)",
          M: "Male",
          F: "Female",
          A: "Asian",
        };
        let data = feature.properties;
        let fatal = data.fatal == 1 ? "Fatal" : "Nonfatal";
        let text = `<div class="tooltip-title">${fatal} Shooting</div>
                    <table class="w-100">
                    <tbody>`;

        text += ` <tr class="tooltip-line">
                    <td>${data.date.toDateString()}</td>
                  </tr>`;
        text += ` <tr class="tooltip-line">
                    <td>${msToTimeString(data.time)}</td>
                  </tr>`;
        text += ` <tr class="tooltip-line">
                  <td>${data.block_number} ${data.street_name}</td>
                </tr>`;
        text += `</tbody>
                </table>`;

        text += `<div class="tooltip-title mt-2">Victim Info</div>
                    <table class="w-100">
                    <tbody>`;

        text += ` <tr class="tooltip-line">
                <td>${data.age} years old</td>
                </tr>`;
        text += ` <tr class="tooltip-line">
                <td>${aliases[data.race]}</td>
                </tr>`;
        text += ` <tr class="tooltip-line">
            <td>${aliases[data.sex]}</td>
            </tr>`;
        text += `</tbody>
                </table>`;
        text += `<div class="tooltip-title mt-2">Incident Info</div>
                  <table class="w-100">
                  <tbody>`;

        text += ` <tr class="tooltip-line">
            <td>DC #: ${data.dc_key}</td>
            </tr>`;
        let arrest = data.has_court_case ? "Yes" : "No";
        text += ` <tr class="tooltip-line">
            <td>Court Case: ${arrest}</td>
            </tr>`;

        text += `</tbody>
                </table>`;

        // bind the popup to the layer
        layer.bindTooltip(text, {
          permanent: false,
          sticky: true,
          opacity: 1.0,
        });
      };
    },
  },
  mounted() {
    this.$nextTick(() => {
      // the leaflet basemap
      let map = this.mapObject;

      // set zoom home bounds
      this.homeBounds = map.getBounds();

      //add zoom control with your options
      L.control
        .zoom({
          position: "topright",
        })
        .addTo(map);

      // add a home button to the control bar
      let button =
        $(`<a class="leaflet-control-zoom-in" title="Recenter Map" role="button" aria-label="Recenter Map">
        <i class="fa fa-home" aria-hidden="true"></i>
        </a>`);
      button.on("click", this.zoomHome);
      $("#shootingsMapContainer .leaflet-control-zoom").append(button);

      // convert to svg
      if (window.FontAwesome) window.FontAwesome.dom.i2svg();

      // Add ArcGIS Online basemap
      esri
        .basemapLayer("DarkGray", {
          detectRetina: false,
        })
        .addTo(map);

      // add city limits
      this.layers.cityLimits = esri
        .featureLayer({
          url: "https://services.arcgis.com/fLeGjb7u4uXqeF9q/arcgis/rest/services/City_Limits/FeatureServer/0",
          style: () => {
            return { fill: false, color: "#fff", weight: 4 };
          },
        })
        .addTo(map);

      // Create the panes
      this.panes.aggLayers = map.createPane("aggLayers");
      this.panes.aggLayers.style.zIndex = 300;
      this.panes.heatmap = map.createPane("heatmap");
      this.panes.heatmap.style.zIndex = 500;
      this.panes.heatmap.style.pointerEvents = "none";
      this.panes.streets = map.createPane("streets");
      this.panes.streets.style.zIndex = 1200;
      map.getPane("overlayPane").style.zIndex = 1400;

      //  change stroke weight on zoom
      map.on("zoomend", () => {
        if (this.isActive("streets")) {
          this.layers.streets.setStyle(this.streetStyleFunction);
        }
      });
    });
  },
  watch: {
    /* Agg layer opacity */
    aggLayerOpacity() {
      this.updateAggLayer();
    },
    /* Watch length of GeoJSON data */
    lengthGeojson() {
      this.updateAggLayer();
    },
    /* Watch the current agg layer */
    aggLayer(nextValue, prevValue) {
      let map = this.mapObject;

      // Remove old layer
      if (prevValue != null) map.removeLayer(this.layers[prevValue]);

      // Add new layer
      if (nextValue != null) {
        this.addAggLayer(nextValue);
        this.updateAggLayer();
      }
    },
    activeLayers() {
      let map = this.mapObject;

      // Remove heatmap
      if (!this.isActive("heatmap") & map.hasLayer(this.layers.heatmap))
        map.removeLayer(this.layers.heatmap);

      // Remove streets
      if (!this.isActive("streets") & map.hasLayer(this.layers.streets))
        map.removeLayer(this.layers.streets);

      // Add heatmap
      if (this.isActive("heatmap") & !map.hasLayer(this.layers.heatmap))
        this.addHeatmap();

      // Add streets
      if (this.isActive("streets") & !map.hasLayer(this.layers.streets))
        this.addStreetHotSpots();
    },
    geojson() {
      // Add the heatmap
      if (this.isActive("heatmap")) this.addHeatmap();

      // Add the streets hotspots
      if (this.isActive("streets")) this.addStreetHotSpots();
    },
  },
  methods: {
    updateAggLayer() {
      // If we have an agg layer, update the colors
      // Update style
      let aggLayer = this.layers[this.aggLayer];
      if (aggLayer) {
        aggLayer.setStyle(this.aggStyleFunction);

        // Update tooltip
        aggLayer.eachFeature((layer) => {
          layer.bindTooltip(this.getAggTooltip(layer.feature), {
            permanent: false,
            sticky: true,
            opacity: 1.0,
          });
        });
      }
    },

    showLegend() {
      return this.isActive("streets") | (this.aggLayer !== null);
    },
    isActive(layer) {
      return this.activeLayers.indexOf(layer) !== -1;
    },
    getAggTooltip(feature) {
      // The name of each geographic region
      let key = this.getAggKey(this.aggLayer);
      key = feature.properties[key];

      // Get the total count
      let count = this.aggCounts.get(key) || 0;

      // Determine the title to show
      let title;
      if (
        (this.aggLayer == "council") |
        (this.aggLayer == "police") |
        (this.aggLayer == "house_district")
      )
        title = `District #${key}`;
      else title = key;

      // Return the text
      let text = `<div class="tooltip-title">${title}</div>
                  <table class="w-100">
                  <tbody>`;
      text += ` <tr class="tooltip-line">
                <td class="tooltip-line-header">Shooting Victims</td>
              <td>${count.toFixed(0)}</td>
              </tr>`;
      text += `</tbody>
              </table>`;
      return text;
    },
    getStreetTooltip(data) {
      // Get the count for this street
      let count = this.streetCounts.get(`${data.segment_id}`);

      let text = `<div class="tooltip-title">${data.block_number} ${data.street_name}</div>
                  <table class="w-100">
                  <tbody>`;
      // Add shootings count
      text += ` <tr class="tooltip-line">
                <td class="tooltip-line-header">Shooting Victims</td>
              <td>${count.toFixed(0)}</td>
              </tr>`;

      text += `</tbody>
              </table>`;
      return text;
    },
    getWeightBasedOnZoom() {
      let currentZoom = this.mapObject.getZoom();
      if (currentZoom > 13) return 5;
      else if (currentZoom > 12) return 3;
      else return 2;
    },
    getAggKey(aggLayer) {
      if (aggLayer == "council") return "DISTRICT";
      else if (aggLayer == "zip") return "zip_code";
      else if (aggLayer == "police") return "DISTRICT_";
      else if (aggLayer == "hood") return "neighborhood";
      else if (aggLayer == "school") return "name";
      else if (aggLayer == "house_district") return "district";
    },
    aggStyleFunction(feature) {
      let key = this.getAggKey(this.aggLayer);
      key = feature.properties[key];

      let color = this.aggColorScale(this.aggCounts.get(key) || 0);
      return {
        color: "#cfcfcf",
        fillColor: color,
        weight: 1,
        opacity: 1,
        fillOpacity: this.aggLayerOpacity,
      };
    },
    onEachFeatureAgg(feature, layer) {
      layer.bindTooltip(this.getAggTooltip(layer.feature), {
        permanent: false,
        sticky: true,
        opacity: 1.0,
      });
    },
    streetStyleFunction(feature) {
      return {
        weight: this.getWeightBasedOnZoom(),
        color: this.getColor(feature.properties),
      };
    },

    onEachFeatureStreets(feature, layer) {
      layer.bindTooltip(this.getStreetTooltip(layer.feature.properties), {
        permanent: false,
        sticky: true,
        opacity: 1.0,
      });
    },
    getColor(props) {
      return SCALE(this.scale(this.streetCounts.get(`${props.segment_id}`)));
    },
    setActiveLayers(layers) {
      this.activeLayers = layers;
    },
    setAggLayer(layer) {
      this.aggLayer = layer;
    },
    addStreetHotSpots() {
      let map = this.mapObject;
      if (map.hasLayer(this.layers.streets))
        map.removeLayer(this.layers.streets);

      // Update legend color scale
      this.legendColorScale = interpolatePlasma;
      this.legendRange = [0.5, 1.0];

      this.layers.streets = esri.featureLayer({
        url: this.streetsURL,
        precision: 5,
        simplifyFactor: 0.5,
        where: `segment_id in (${this.uniqueStreets})`,
        onEachFeature: this.onEachFeatureStreets,
        style: this.streetStyleFunction,
        pane: "streets",
      });

      // when done loading, hide the spinner
      this.layers.streets.on("loading", () => {
        this.isLoading = true;
      });
      this.layers.streets.on("load", () => {
        this.isLoading = false;
      });

      // Add to map
      this.layers.streets.addTo(map);
    },
    addAggLayer(name) {
      let map = this.mapObject;

      // Update legend color scale
      this.legendColorScale = interpolateReds;
      this.legendRange = [0, 1];

      if (this.layers[name] == null) {
        this.layers[name] = esri.featureLayer({
          url: this.aggLayerURLs[name],
          style: this.aggStyleFunction,
          onEachFeature: this.onEachFeatureAgg,
          pane: "aggLayers",
        });
      }

      // Add new layer
      if (!map.hasLayer(this.layers[name])) {
        map.addLayer(this.layers[name]);
      }
    },
    addHeatmap() {
      let map = this.mapObject;
      if (map.hasLayer(this.layers.heatmap))
        map.removeLayer(this.layers.heatmap);

      this.layers.heatmap = L.heatLayer(this.heatmapData, {
        radius: 25,
        minOpacity: this.geojson.length > 500 ? 0.1 : 0.4,
        gradient: {
          0.1: "#120d31",
          0.2: "#331067",
          0.3: "#59157e",
          0.4: "#7e2482",
          0.5: "#a3307e",
          0.6: "#c83e73",
          0.7: "#e95462",
          0.8: "#fa7d5e",
          0.9: "#fea973",
          1.0: "#fed395",
        },
        pane: "heatmap",
      }).addTo(map);
    },
    zoomHome() {
      this.mapObject.flyToBounds(this.homeBounds);
    },
  },
};
</script>

<style>
#shootingsMapContainer {
  flex: 1 1;
  display: flex;
}
.map-pane {
  flex: 1;
  height: 800px !important;
  z-index: 1 !important;
}

@media only screen and (max-width: 767px) {
  .map-pane {
    height: 500px !important;
  }
}
/* Zoom control */
.fa-home {
  color: #000;
}

.leaflet-control-zoom-in,
.leaflet-control-zoom-out {
  color: #000 !important;
}

/* tooltip */
.tooltip-line {
  border-bottom: 1px solid #f0f0f0;
}
.tooltip-line td {
  padding: 0 7px 0 7px;
}
.tooltip-line-header {
  font-weight: bold;
  text-align: left;
}
.leaflet-tooltip {
  padding: 10px;
  font: 1rem sans-serif;
  background: #ffffff;
  border-radius: 8px;
  pointer-events: none;
  border: 1px solid #cdcdcd;
  opacity: 1;
  display: block;
  max-width: 500px;
}
.tooltip-title {
  margin-bottom: 5px;
  border-bottom: 1px solid #cdcdcd;
  text-align: center;
  font-weight: bold;
  padding-bottom: 5px;
}
.leaflet-tooltip-pane {
  z-index: 1500 !important;
}

/* legend placement */
.legend-flex-wrapper {
  margin-right: 50px;
  display: flex;
  justify-content: flex-end;
}
.legend-overlay-bar {
  z-index: 2;
  position: absolute;
  width: 100%;
  pointer-events: none;
}
</style>


