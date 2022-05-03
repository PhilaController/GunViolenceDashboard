<template>
  <!-- Map wrapper -->
  <div class="mapping-dashboard">
    <!-- Add the Filterable Map -->
    <FilterableMap
      ref="FilterableMap"
      :filteredData="filteredData"
      :sources="sources"
      :layers="layers"
      :defaultOverlayOpacity="defaultOverlayOpacity"
      :title="title"
      @map:ready="$emit('map:ready')"
    />

    <!-- Sidebar -->
    <MapSidebar
      ref="MapSidebar"
      :filters="filtersCopy"
      :layerNamesDefault="layerNamesDefault"
      :layerNames="layerNames"
      :overlayLayerNames="overlayLayerNames"
      :filteredSize="filteredSize"
      :pointsOnMap="totalPointsOnMap"
      :histograms="histograms"
      :defaultOverlayOpacity="defaultOverlayOpacity"
      @update:filter="handleFilterUpdate"
      @update:opacity="handleOpacityChange"
      @download-data="handleDownload"
    />
  </div>
</template>

<script>
import FilterableMap from "./FilterableMap";
import MapSidebar from "./MapSidebar";
import { downloadFile, jsonToCSV, jsonToGeoJson } from "@/utils/io";

import * as Papa from "papaparse";
import crossfilter from "crossfilter2";
import { bin, rollup } from "d3-array";

export default {
  name: "MappingDashboard",
  components: {
    MapSidebar,
    FilterableMap,
  },
  props: {
    data: Object,
    sources: Array,
    filters: Array,
    layers: Array,
    histogramBins: { type: Number, default: 50 },
    title: String,
    downloadConfig: Object,
  },

  data() {
    return {
      crossfilter: null, // Crossfilter instance
      crossfilterConfig: {}, // Crossfilter dimensions
      filteredData: null, // Filtered data array
      currentFilters: {}, // Current filters
      histograms: {}, // Histograms for each dimension
      preventMapUpdate: false, // Prevent map update
      defaultOverlayOpacity: 50,
      filtersCopy: [], // Internal copy to avoid overwriting
    };
  },
  created() {
    // Set filters copy
    this.filtersCopy = [];
    for (let i = 0; i < this.filters.length; i++) {
      this.filtersCopy.push(Object.assign({}, this.filters[i]));
    }

    if (this.sources[0].filterColumn === undefined)
      throw Error(
        "Field 'FilterColumn' must be defined for first (main) data source"
      );

    // Initialize the dashboard
    this.initializeDashboard();
  },
  computed: {
    /*------ 
    Toggeable layer names
    -------*/
    layerNames() {
      return this.layers
        .filter((l) => !l.overlay && !l.static)
        .map((l) => l.name);
    },
    /*------ 
    Default toggeable layer names
    -------*/
    layerNamesDefault() {
      return this.layerNames.filter(
        (name) => this.layers.find((l) => l.name == name).showOnStart
      );
    },
    /*------ 
    Overlay layer names
    -------*/
    overlayLayerNames() {
      return this.layers.filter((l) => l.overlay).map((l) => l.name);
    },

    /*------ 
    Aggregated layer names
    -------*/
    aggLayerNames() {
      return this.layers.filter((l) => l.aggregated).map((l) => l.name);
    },

    /*------ 
    Number of points on the map (non-null geometry)
    -------*/
    totalPointsOnMap() {
      if (this.filteredData)
        return this.filteredData.filter((d) => d.geometry != null).length;
      else return 0;
    },

    /*------ 
    Total size of filtered data set
    -------*/
    filteredSize() {
      if (this.filteredData) return this.filteredData.length;
      else return 0;
    },
  },
  watch: {
    filteredSize() {
      this.$emit("update:filteredData", this.filteredData);
    },
    data(newData, oldData) {
      console.log(newData, oldData);
      // Initialize the dashboard
      this.initializeDashboard();

      // Update the main data source
      let map = this.$refs.FilterableMap;
      if (map) {
        map.updateDataSource(this.sources[0].name, newData);
      }
    },
  },
  methods: {
    initializeDashboard() {
      // Set up the cross filter
      this.setupCrossfilter();

      // Set the filtered data
      this.filteredData = this.crossfilter.allFiltered();

      // Initialize slider filters
      // NOTE: Do this after all filters are initially set;
      this.setDefaultSliderRanges();
      this.initializeHistograms();
    },
    /*------ 
    Initialize the crossfilter and its dimensions
    -------*/
    setupCrossfilter() {
      // Create and save crossfilter from GeoJSON features
      this.crossfilter = crossfilter(this.data.features);

      // Loop over each filter
      for (let i = 0; i < this.filters.length; i++) {
        let filter = this.filters[i];
        let dim = filter.name;

        // This is the crossfilter dimension
        this.crossfilterConfig[dim] = this.crossfilter.dimension(
          (d) => d.properties[dim]
        );

        // Set default value
        this.currentFilters[dim] = null;
        if (filter.default)
          this.currentFilters[dim] = filter.getFilter(filter.default);

        // Set the default filter
        this.crossfilterConfig[dim].filter(this.currentFilters[dim]);
      }
    },

    /*------ 
    Initialize the histograms for slider filters
    -------*/
    initializeHistograms() {
      for (let i = 0; i < this.filtersCopy.length; i++) {
        let filter = this.filtersCopy[i];
        let dim = filter.name;

        // Update histograms for sliders with showHistogram==true
        if (filter.kind === "slider" && filter.showHistogram) {
          this.$set(
            this.histograms,
            dim,
            this.getHistogram(
              this.crossfilter.allFiltered([this.crossfilterConfig[dim]]),
              dim
            )
          );
        }
      }
    },

    /*------ 
    Set default slider ranges
    -------*/
    setDefaultSliderRanges() {
      // Loop over all filters
      for (let i = 0; i < this.filtersCopy.length; i++) {
        let filter = this.filtersCopy[i];
        let dim = filter.name;

        // Sliders with auto-limits
        if (filter.kind === "slider" && filter.autoLimits) {
          // Min/max values
          let top = this.crossfilterConfig[dim].top(1);
          let bottom = this.crossfilterConfig[dim].bottom(1);

          // Set the default value
          filter.default = [bottom[0].properties[dim], top[0].properties[dim]];

          // Reset value if the sidebar has been initialized
          // This will reset values on filter
          if (this.$refs.MapSidebar) this.resetFilter(dim);
        }
      }
    },

    /*------ 
    Reset the dashboard filters and layers
    -------*/
    resetDashboard() {
      // Do not need to propagate update to map right away
      this.preventMapUpdate = true;

      // Reset all filters
      this.resetAllFilters();

      // Reset all layers
      this.resetAllLayers();

      // After updating, set to false
      // Run the post filter updates
      this.$nextTick(() => {
        this.postFilterMapUpdate();
        this.preventMapUpdate = false;
      });
    },

    /*------ 
    Reset all filters in the sidebar
    -------*/
    resetAllFilters() {
      this.$refs.MapSidebar.resetAllFilters();
    },

    /*------ 
    Reset all layers to defaults
    -------*/
    resetAllLayers() {
      this.setLayers(this.layerNamesDefault);
      this.setOverlayLayer(null);
    },

    /*------ 
    Set the specified layers in the sidebar
    -------*/
    setLayers(layerNames) {
      this.$refs.MapSidebar.selectedLayers = layerNames;
    },

    /*------ 
    Set the specified overlay layer in the sidebar
    -------*/
    setOverlayLayer(layerName) {
      this.$refs.MapSidebar.selectedOverlayLayer = layerName;
    },

    /*------ 
    Reset a specific filter in the sidebar
    -------*/
    resetFilter(filterName) {
      this.$refs.MapSidebar.resetFilter(filterName);
    },

    /*------ 
    Handle aggregated download
    -------*/
    handleAggregatedDataDownload(layer, data, outputType) {
      // Aggregate input data
      let aggCounts = rollup(
        data,
        (v) => v.length,
        (d) => d.properties[layer.column]
      );

      // Initialize
      let content, fileName, contentType;

      // Handle CSV
      if (outputType == "CSV") {
        // Convert Map to an array of objects
        aggCounts = Array.from(aggCounts, ([name, count]) => {
          let out = {};
          out[layer.name] = name;
          out["count"] = count;
          return out;
        }).filter((d) => d[layer.name]); // Remove empty

        // Get the content
        content = Papa.unparse(aggCounts);

        // File and content
        fileName = `Aggregated Data (${layer.name}).csv`;
        contentType = "text/plain";

        // Download it
        downloadFile(content, contentType, fileName);
      } else {
        // Initialize the empty collection
        let collection = { type: "FeatureCollection", features: [] };

        // Get the source
        let source = this.sources.find((s) => s.name == layer.source);
        let geodata = source.data;

        // Loop over all features
        geodata.features.map((feature) => {
          // Get the name and count
          let name = feature.properties[layer.geoid];
          let count = aggCounts.get(name) || 0;

          // Create the properties
          feature.properties = {};
          feature.properties[layer.name] = name;
          feature.properties["count"] = count;

          // Add to our collectiom
          collection.features.push(feature);
        });

        // Download as geojson
        content = JSON.stringify(collection);
        fileName = `Aggregated Data (${layer.name}).geojson`;
        contentType = "text/json";

        // Download it
        downloadFile(content, contentType, fileName);
      }
    },

    /*------ 
    Handle download click
    -------*/
    handleDownload(params) {
      let aggLayer = params["aggLayer"];
      let ignoreFilters = params["ignoreFilters"];
      let outputType = params["outputType"];

      // Determine the content to download
      let data = ignoreFilters ? this.data.features : this.filteredData;

      //  Download specifics
      let fileName, contentType, content;

      // Handle aggregated download
      if (aggLayer !== null) {
        let layer = this.layers.find((l) => l.name === aggLayer);
        this.handleAggregatedDataDownload(layer, data, outputType);

        // Download raw data
      } else {
        // Format output
        let downloadConfig = this.downloadConfig || {};
        let exclude = downloadConfig.exclude || [];
        let formatters = downloadConfig.formatters || {};

        let toFormat = Object.keys(formatters);
        if (exclude.length || toFormat.length > 0) {
          data.map((d) => {
            // Remove excluded properties
            exclude.map((e) => {
              delete d.properties[e];
            });

            // Format properties
            Object.keys(formatters).map((k) => {
              d.properties[k] = formatters[k](d.properties[k]);
            });
          });
        }

        //   CSV
        if (outputType == "CSV") {
          content = jsonToCSV(data);
          fileName = "data.csv";
          contentType = "text/plain";
          // GeoJSON
        } else {
          content = jsonToGeoJson(data);
          fileName = "data.geojson";
          contentType = "text/json";
        }

        // Download it
        downloadFile(content, contentType, fileName);
      }
    },

    /*------ 
    Handle the opacity change event
    -------*/
    handleOpacityChange(layerName, opacity) {
      this.$refs.FilterableMap.setPaintProperty(
        layerName,
        "fill-opacity",
        opacity
      );
    },

    /*------ 
    Set the filter on the specified source
    -------*/
    filterMapSource(layerName, source) {
      // Get the values
      let values = this.filteredData.map(
        (d) => d.properties[source.filterColumn]
      );

      // Make them unique
      values = Array.from(new Set(values));

      let filter;
      if (values.length > 0) {
        filter = ["match", ["get", source.filterColumn], values, true, false];
      } else filter = false;

      // Set the filter
      this.$refs.FilterableMap.setFilter(layerName, filter);
    },

    /*------ 
    Handle the update:filter event from the side bar
    This is the main function reponsible for controlling filter updates
    -------*/
    async handleFilterUpdate(filterName, ...args) {
      // Update layers
      if (filterName == "layer") {
        // The layer name and whether we are showing or hiding
        let layerName = args[0];
        let show = args[1];

        // This is the full layer config
        let layer = this.layers.find((l) => l.name == layerName);
        let source = this.sources.find((s) => s.name == layer.source);

        // Set the active layer on the map
        // If aggregated, this will make sure agg data is up to date
        await this.$refs.FilterableMap.setActiveLayers(layerName, show);

        // Filter by the specified column
        if (source.filterColumn) this.filterMapSource(layerName, source);
      }
      // Handle a filter change
      else {
        // Get the filter value
        let filter = this.filtersCopy.find((d) => d.name == filterName);

        // Create the current filter function
        let currentFilter = filter.getFilter(...args);

        // Set it as the current filter for this dimension
        this.currentFilters[filterName] = currentFilter;

        // Apply the filter
        this.applyFilter(filterName);
      }

      // Emit the update filter event
      this.$emit("update:filter", filterName, ...args);
    },

    /*------ 
    Calculate a histogram of the input data
    -------*/
    getHistogram(values, dimension) {
      return bin()
        .thresholds(this.histogramBins)
        .value((d) => +d.properties[dimension])(values);
    },

    /*------ 
    Update the histograms
    -------*/
    updateHistograms() {
      for (let filterName in this.histograms) {
        this.$set(
          this.histograms,
          filterName,
          this.getHistogram(
            this.crossfilter.allFiltered([this.crossfilterConfig[filterName]]),
            filterName
          )
        );
      }
    },
    /*------ 
    Apply the current filter 
    -------*/
    applyFilter(filterName) {
      // Set the filter on this dimension
      this.crossfilterConfig[filterName].filter(
        this.currentFilters[filterName]
      );

      // Set the filtered data
      let oldLength = this.filteredData.length;
      this.filteredData = this.crossfilter.allFiltered();

      // Run the post-update hooks if filtered data length changed
      this.$nextTick(() => {
        if (oldLength != this.filteredData.length && !this.preventMapUpdate)
          this.postFilterMapUpdate();
      });
    },

    /*------ 
    Run the post-filter updates
    -------*/
    postFilterMapUpdate() {
      // Map
      let map = this.$refs.FilterableMap;

      // Active layers
      let activeLayers = map.activeLayers;

      // Handle all active layers
      for (let layerName of activeLayers) {
        // The full layer and source configs
        let layer = this.layers.find((l) => l.name == layerName);
        let source = this.sources.find((s) => s.name == layer.source);

        // Filter by the specified column
        if (source.filterColumn) this.filterMapSource(layerName, source);

        // Update any aggregated data
        if (layer.aggregated) map.updateAggregatedSource(layer);
      }

      // Update slider histograms
      this.updateHistograms();
    },

    /*------ 
    Remove the specified filter by setting filter to null
    -------*/
    removeFilter(filterName) {
      this.currentFilters[filterName] = null;
      this.applyFilter(filterName);
    },
  },
};
</script>

<style>
.mapping-dashboard {
  position: relative;
  display: flex;
  margin-top: 100px;
  margin-bottom: 20px;
  border: 5px solid #868b8e;
}

@media screen and (max-width: 767.98px) {
  .mapping-dashboard {
    flex-direction: column !important;
  }
}
</style>
