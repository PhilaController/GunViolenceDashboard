<template>
  <div id="filterableMapContainer" style="position: relative">
    <!-- <div class="legend-overlay-bar" v-if="showLegend()">
      <div class="legend-flex-wrapper">
        <Legend
          :height="20"
          :width="200"
          :colorScheme="legendColorScale"
          :range="legendRange"
        />
      </div>
    </div> -->

    <!-- Leaflet Map -->
    <l-map
      :options="mapOptions"
      :zoom="mapStartLocation.zoom"
      :center="mapStartLocation.center"
      ref="LeafletMap"
      class="map-pane"
    >
      <!-- Overlay a loader -->
      <v-overlay
        :value="isLoading"
        absolute
        opacity="0.6"
        color="#353d42"
        :z-index="9999999"
      >
        <v-progress-circular indeterminate size="64" color="#fff" />
      </v-overlay>

      <!--  -->
      <slot />
    </l-map>
  </div>
</template>

<script>
// Local imports
// import Legend from "./Legend";
// import { msToTimeString } from "@/tools.js";

// Jquery
import $ from "jquery";

// Leaflet imports
import L from "leaflet";
import * as Vue2Leaflet from "vue2-leaflet";

// d3 imports
// import { min, max, rollup } from "d3-array";
// import { scaleLog, scaleSequential } from "d3-scale";
// import { interpolatePlasma, interpolateReds } from "d3-scale-chromatic";

// Import esri-leaflet too
const esri = require("esri-leaflet");

// Define the scale we want to use
// const SCALE = interpolatePlasma;

// function styleFunction(feature) {
//   let fillColor = feature.properties.fatal ? "#d84545" : "#e5dc8e";
//   let edgeColor = feature.properties.fatal ? "#af2828" : "#d3c913";
//   return {
//     radius: 6,
//     fillColor: fillColor,
//     color: edgeColor,
//     weight: 1,
//     opacity: 1,
//     fillOpacity: 0.7,
//   };
// }

export default {
  components: {
    "l-map": Vue2Leaflet.LMap,
  },
  props: {
    features: Array,
    mapStartLocation: {
      type: Object,
      default: () => {
        return { zoom: 12, center: [39.9854507, -75.15] };
      },
    },
    mapOptions: {
      type: Object,
      default: () => {
        return {
          maxZoom: 16,
          minZoom: 11,
          zoomControl: false,
          scrollWheelZoom: false,
        };
      },
    },
    zoomControlLocation: {
      type: String,
      default: "topright",
    },
    addHomeButton: {
      type: Boolean,
      default: true,
    },
    basemapLayerName: {
      type: String,
      default: "DarkGray",
    },
    addCityLimits: {
      type: Boolean,
      default: true,
    },
    cityLimitsStyle: {
      type: Object,
      default: () => {
        return { fill: false, color: "#fff", weight: 4 };
      },
    },

    // aggregationColorScheme: {
    //   type: Object,
    //   default: interpolateReds,
    // },
  },
  data() {
    return {
      isLoading: false,
      // legendColorScale: interpolatePlasma,
      // legendRange: [0.5, 1.0],
      // streetsURL:
      //   "https://services.arcgis.com/fLeGjb7u4uXqeF9q/arcgis/rest/services/Philadelphia_Streets/FeatureServer/0",
      activeLayers: [],
      selectedAggLayer: null,
      homeBounds: null,
      layers: {},
      aggLayers: {},
      panes: {},
      // circle: { radius: 6, color: "#7ab5e5" },
    };
  },
  computed: {
    totalFeatures() {
      return this.features.length;
    },

    mapObject() {
      return this.$refs.LeafletMap.mapObject;
    },

    // onEachFeatureFunction() {
    //   return (feature, layer) => {
    //     let aliases = {
    //       W: "White (Non-Hispanic)",
    //       B: "Black (Non-Hispanic)",
    //       H: "Hispanic (Black or White)",
    //       M: "Male",
    //       F: "Female",
    //       A: "Asian",
    //     };
    //     let data = feature.properties;
    //     let fatal = data.fatal == 1 ? "Fatal" : "Nonfatal";
    //     let text = `<div class="tooltip-title">${fatal} Shooting</div>
    //                 <table class="w-100">
    //                 <tbody>`;

    //     text += ` <tr class="tooltip-line">
    //                 <td>${data.date.toDateString()}</td>
    //               </tr>`;
    //     text += ` <tr class="tooltip-line">
    //                 <td>${msToTimeString(data.time)}</td>
    //               </tr>`;
    //     text += ` <tr class="tooltip-line">
    //               <td>${data.block_number} ${data.street_name}</td>
    //             </tr>`;
    //     text += `</tbody>
    //             </table>`;

    //     text += `<div class="tooltip-title mt-2">Victim Info</div>
    //                 <table class="w-100">
    //                 <tbody>`;

    //     text += ` <tr class="tooltip-line">
    //             <td>${data.age} years old</td>
    //             </tr>`;
    //     text += ` <tr class="tooltip-line">
    //             <td>${aliases[data.race]}</td>
    //             </tr>`;
    //     text += ` <tr class="tooltip-line">
    //         <td>${aliases[data.sex]}</td>
    //         </tr>`;
    //     text += `</tbody>
    //             </table>`;
    //     text += `<div class="tooltip-title mt-2">Incident Info</div>
    //               <table class="w-100">
    //               <tbody>`;

    //     text += ` <tr class="tooltip-line">
    //         <td>DC #: ${data.dc_key}</td>
    //         </tr>`;
    //     let arrest = data.has_court_case ? "Yes" : "No";
    //     text += ` <tr class="tooltip-line">
    //         <td>Court Case: ${arrest}</td>
    //         </tr>`;

    //     text += `</tbody>
    //             </table>`;

    //     // bind the popup to the layer
    //     layer.bindTooltip(text, {
    //       permanent: false,
    //       sticky: true,
    //       opacity: 1.0,
    //     });
    //   };
    // },
  },
  mounted() {
    this.$nextTick(() => {
      // the leaflet basemap
      let map = this.mapObject;

      //Add zoom control with your options
      if (this.zoomControlLocation) {
        L.control
          .zoom({
            position: this.zoomControlLocation,
          })
          .addTo(map);
      }

      // Add a home button
      if (this.addHomeButton) {
        // Set zoom home bounds
        this.homeBounds = map.getBounds();

        // Add a home button to the control bar
        let button =
          $(`<a class="leaflet-control-zoom-in" title="Recenter Map" role="button" aria-label="Recenter Map">
        <i class="fa fa-home" aria-hidden="true"></i>
        </a>`);
        button.on("click", this.zoomHome);
        $("#LeafletMapObjectContainer .leaflet-control-zoom").append(button);

        // Convert to svg
        if (window.FontAwesome) window.FontAwesome.dom.i2svg();
      }

      // Add ArcGIS Online basemap
      esri
        .basemapLayer(this.basemapLayerName, {
          detectRetina: false,
        })
        .addTo(map);

      // Add city limits
      if (this.addCityLimits) {
        this.layers.cityLimits = esri
          .featureLayer({
            url: "https://services.arcgis.com/fLeGjb7u4uXqeF9q/arcgis/rest/services/City_Limits/FeatureServer/0",
            style: () => {
              return this.cityLimitsStyle;
            },
          })
          .addTo(map);
      }

      // Create and layer the panes
      map.getPane("overlayPane").style.zIndex = 1400;

      this.panes.geojson = map.createPane("geojson");
      this.panes.geojson.style.zIndex = 1200;

      this.panes.heatmap = map.createPane("heatmap");
      this.panes.heatmap.style.zIndex = 500;
      this.panes.heatmap.style.pointerEvents = "none";

      this.panes.aggLayers = map.createPane("aggLayers");
      this.panes.aggLayers.style.zIndex = 300;

      //  change stroke weight on zoom
      // map.on("zoomend", () => {
      //   if (this.isActive("streets")) {
      //     this.layers.streets.setStyle(this.streetStyleFunction);
      //   }
      // });
    });
  },
  watch: {
    /* Agg layer opacity */
    aggregationLayerOpacity() {
      this.updateAggLayer();
    },
    /* Watch length of GeoJSON data */
    totalFeatures() {
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
    features() {
      // Add the heatmap
      if (this.isActive("heatmap")) this.addHeatmap();

      // Add the streets hotspots
      if (this.isActive("streets")) this.addStreetHotSpots();
    },
  },
  methods: {
    addLayer(layer, aggregated = false) {
      // Save the layer locally
      if (!aggregated) this.layers[layer.name] = layer;
      else this.aggLayers[layer.name] = layer;

      // Add to the dashboard too
      this.$parent.addLayer(layer, aggregated);
    },
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

    // getWeightBasedOnZoom() {
    //   let currentZoom = this.mapObject.getZoom();
    //   if (currentZoom > 13) return 5;
    //   else if (currentZoom > 12) return 3;
    //   else return 2;
    // },

    setActiveLayers(layerName, active) {
      let layer = this.layers[layerName];
      if (active) layer.add(this.mapObject);
      else layer.remove(this.mapObject);
    },
    setAggregationLayer(layerName, active) {
      let layer = this.aggLayers[layerName];
      if (active) layer.add(this.mapObject);
      else layer.remove(this.mapObject);
    },
    zoomHome() {
      this.mapObject.flyToBounds(this.homeBounds);
    },
  },
};
</script>

<style>
#filterableMapContainer {
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
  text-align: center;
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


