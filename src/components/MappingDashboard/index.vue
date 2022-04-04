<template>
  <div style="position: relative">
    <!-- Overlay a loader -->
    <v-overlay :value="isLoading" opacity="1" color="#353d42">
      <v-progress-circular indeterminate size="64" color="#fff" />
    </v-overlay>

    <!-- Header message -->
    <!-- <HeaderMessage
      ref="headerMessage"
      class="header-message"
      :fatal="fatalCount"
      :nonfatal="nonfatalCount"
      :selectedYear="selectedYear"
      :currentYear="currentYear"
      :maxDate="maxDate"
      :homicideData="homicideData"
    /> -->

    <div class="filterable-map-wrapper">
      <!-- Add the Filterable Map -->
      <FilterableMap ref="FilterableMap" :features="pointsGeoJSON">
        <!-- Layers -->
        <slot name="layers">
          <!-- Marker layer -->
          <MarkerLayer
            name="points"
            label="Point locations"
            :data="pointsGeoJSON"
          />

          <!-- Heatmap layer -->
          <HeatmapLayer name="heatmap" label="Heat map" :data="pointsGeoJSON" />

          <!-- Add aggregation layers -->
          <template v-for="aggLayer in aggregationLayers">
            <AggregationLayer
              :key="aggLayer.name"
              :data="pointsGeoJSON"
              :url="aggLayer.url"
              :name="aggLayer.name"
              :label="aggLayer.label"
              :geoid="aggLayer.geoid"
              :opacity="defaultAggLayerOpacity"
            />
          </template>
        </slot>
      </FilterableMap>

      <!-- Sidebar -->
      <MapSidebar
        ref="MapSidebar"
        :data="data"
        :filterDimensions="filterDimensions"
        :layers="layers"
        :aggLayers="aggLayers"
        :filteredSize="filteredSize"
        :pointsOnMap="totalPointsOnMap"
        @update:filter="handleFilterUpdate"
        @update:opacity="handleOpacityChange"
        @reset="handleReset"
      />
    </div>
  </div>
</template>

<script>
// Local
// import {
//   getDayOfYear,
//   dateFromDay,
//   // githubFetch,
//   parseTime,
//   getMsSinceMidnight,
//   downloadFile,
//   AWSFetch,
// } from "@/tools.js";
// import { AGG_LAYER_URLS, DIMS } from "@/data-dict";
// import HeaderMessage from "./HeaderMessage";

// Map components
import FilterableMap from "./FilterableMap";
import MarkerLayer from "./Layers/MarkerLayer";
import HeatmapLayer from "./Layers/HeatmapLayer";
import AggregationLayer from "./Layers/AggregationLayer";
import MapSidebar from "./MapSidebar";
// import MapFilters from "./MapFilters";

// // Charts
// import ChartDashboard from "./ChartDashboard";

// External
import crossfilter from "crossfilter2";
// import { min, max, bin, rollup } from "d3-array";
// import * as Papa from "papaparse";

// // Import esri-leaflet too
// const esri = require("esri-leaflet");

export default {
  name: "MappingDashboard",
  components: {
    MapSidebar,
    FilterableMap,
    MarkerLayer,
    HeatmapLayer,
    AggregationLayer,
  },
  props: {
    data: Array,
    filterDimensions: Array,
    aggregationLayers: { type: Array, default: () => [] },
    defaultAggLayerOpacity: { type: Number, default: 0.5 },
    isLoading: { type: Boolean, default: false },
  },

  data() {
    return {
      crossfilter: null,
      crossfilterDimensions: {},
      filteredData: null,
      currentFilters: {},
      layers: [],
      aggLayers: [],

      // aggregationLayer: AGG_LAYER_URLS,
      // data: null,
      // crossfilter: null,
      // aggLayerOpacity: 0.5,
      // dashboardKey: 0,
      // filteredData: null,
      // homicideData: null,
      // dimensions: DIMS.reduce((o, key) => Object.assign(o, { [key]: {} }), {}),
      // currentFilters: DIMS.reduce(
      //   (o, key) => Object.assign(o, { [key]: null }),
      //   {}
      // ),
      // allowedAgeRange: [0, 100],
      // allowedDateRange: [1, 366],
      // fatalCount: 0,
      // nonfatalCount: 0,
      // maxDate: null,
      // isLoading: true,
    };
  },
  created() {
    // Create and save crossfilter
    this.crossfilter = crossfilter(this.data);

    // Create dimensions
    for (let i = 0; i < this.filterDimensions.length; i++) {
      // Filter name
      let filter = this.filterDimensions[i];
      let dim = filter.name;

      // Set a default filter value
      this.currentFilters[dim] = null;

      // This is the crossfilter dimension
      this.crossfilterDimensions[dim] = this.crossfilter.dimension(
        (d) => d.properties[dim]
      );

      // Set default value
      let defaultFilter = filter.default;
      if (defaultFilter) {
        this.currentFilters[dim] = filter.setFilter(defaultFilter);
        this.crossfilterDimensions[dim].filter(this.currentFilters[dim]);
      }
    }

    // Set the filtered data
    this.filteredData = this.crossfilter.allFiltered();
  },
  computed: {
    pointsGeoJSON() {
      if (this.filteredData)
        return this.filteredData.filter((d) => d.geometry != null);
      else return [];
    },
    totalPointsOnMap() {
      if (this.filteredData)
        return this.filteredData.filter((d) => d.geometry != null).length;
      else return 0;
    },
    filteredSize() {
      if (this.filteredData) return this.filteredData.length;
      else return 0;
    },
  },
  methods: {
    addLayer(layer, aggregated = false) {
      if (!aggregated) {
        this.layers.push(layer);
      } else {
        this.aggLayers.push(layer);
      }
    },
    /* Reset the specified filter */
    handleReset(filterName) {
      this.currentFilters[filterName] = null;
      this.applyFilter(filterName);
    },
    /* Handle change to */
    handleOpacityChange(layerName, opacity) {
      let map = this.$refs.FilterableMap;
      let layer = map.aggLayers[layerName];
      layer.setOpacity(opacity);
      layer.update();
    },
    /* Handle the update event for the specific */
    handleFilterUpdate(filterName, ...args) {
      // Set the active layers
      if (filterName == "layer") {
        this.$refs.FilterableMap.setActiveLayers(...args);
      } // Set the aggregation layer
      else if (filterName == "aggLayer") {
        this.$refs.FilterableMap.setAggregationLayer(...args);
      } // Handle a filter
      else {
        // Get the filter value
        let filter = this.filterDimensions.filter(
          (d) => d.name == filterName
        )[0];

        // Create the current filter function
        let currentFilter = filter.setFilter(...args);

        // Set it as the current filter for this dimension
        this.currentFilters[filterName] = currentFilter;

        // Apply the filter
        this.applyFilter(filterName);
      }
    },

    // getAllowedAges() {
    //   return [
    //     min(this.filteredData.map((el) => +el.properties["age"])),
    //     max(this.filteredData.map((el) => +el.properties["age"])),
    //   ];
    // },
    // getAllowedDates() {
    //   this.maxDate =
    //     this.dimensions.date[this.selectedYear].top(1)[0].properties.date;
    //   return [
    //     getDayOfYear(
    //       this.dimensions.date[this.selectedYear].bottom(1)[0].properties.date
    //     ),
    //     getDayOfYear(this.maxDate),
    //   ];
    // },

    /* Apply the specified filter */
    applyFilter(filterName) {
      // Set the filter
      this.crossfilterDimensions[filterName].filter(
        this.currentFilters[filterName]
      );

      // Set the filtered data
      this.filteredData = this.crossfilter.allFiltered();
    },
  },
};
</script>

<style>
.full-page-loader.vld-overlay {
  align-items: flex-start !important;
}
.full-page-loader .vld-icon {
  margin-top: 50px !important;
}
.filterable-map-wrapper {
  display: flex;
  margin-top: 100px;
  margin-bottom: 20px;
  border: 5px solid #868b8e;
}

@media only screen and (max-width: 767px) {
  .filterable-map-wrapper {
    flex-direction: column;
  }
}
</style>
