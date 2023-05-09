<template>
  <!-- Map wrapper -->
  <div class="mapping-dashboard">
    <!-- Add the Filterable Map -->
    <filterable-map
      ref="FilterableMap"
      :filtered-data="filteredData"
      :sources="sources"
      :layers="layers"
      :default-layer-names="defaultLayerNames"
      :default-overlay-opacity="defaultOverlayOpacity"
      :title="title"
      @map:ready="
        mapReady = true;
        $emit('map:ready');
      "
      @showOverlay="showSidebarOverlay = $event"
    />

    <!-- Sidebar -->
    <map-sidebar
      ref="MapSidebar"
      :filters="filtersCopy"
      :default-toggled-layer-names="defaultToggledLayerNames"
      :toggleable-layer-names="toggleableLayerNames"
      :overlay-layer-names="overlayLayerNames"
      :filtered-size="filteredSize"
      :points-on-map="totalPointsOnMap"
      :histograms="histograms"
      :default-overlay-opacity="defaultOverlayOpacity"
      :show-overlay="showSidebarOverlay"
      :marker-title="markerTitle"
      :marker-short-title="markerShortTitle"
      :map-ready="mapReady"
      @update:filter="handleFilterUpdate"
      @update:opacity="handleOpacityChange"
      @download-data="handleDownload"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";

// Local imports
import FilterableMap from "./FilterableMap.vue";
import MapSidebar from "./MapSidebar/index.vue";
import { downloadFile, jsonToCSV, jsonToGeoJson } from "@/utils/io";

// External
import * as Papa from "papaparse";
import crossfilter from "crossfilter2";
import { bin, rollup } from "d3-array";

// Types
import { LayerConfig, AggregatedLayerConfig } from "@/types/Layers";
import { SourceConfig } from "@/types/Sources";
import { FilterConfig, FilterValue, CrossfilterTypes } from "@/types/Filters";
import { DownloadConfig, DataDownloadParams } from "@/types/DownloadConfig";
import {
  GenericFeature,
  GenericFeatureCollection,
  UnionToIntersection,
  CrossfilterDimensions,
} from "@/types/Data";

export default defineComponent({
  name: "MappingDashboard",
  components: {
    MapSidebar,
    FilterableMap,
  },
  props: {
    /**
     * The input Geojson feature collection
     */
    data: {
      type: Object as PropType<GenericFeatureCollection | null>,
      required: true,
    },

    /**
     * Array of configuration options for loading source data for map
     */
    sources: { type: Array as PropType<SourceConfig[]>, required: true },

    /**
     * Array of configuration options different map filters
     */
    filters: { type: Array as PropType<FilterConfig[]>, required: true },

    /**
     * Array of configuration options for map layers
     */
    layers: { type: Array as PropType<LayerConfig[]>, required: true },

    /**
     * Number of bins to use when showing histograms for map filters
     */
    histogramBins: { type: Number, default: 50 },

    /**
     * Map title
     */
    title: { type: String, required: true },

    /**
     * Configuration options for when data is downloaded
     */
    downloadConfig: {
      type: Object as PropType<DownloadConfig>,
      required: true,
    },

    /**
     * Title for points on map
     */
    markerTitle: { type: String, default: "marker" },

    /**
     * Short title for points on map
     */
    markerShortTitle: { type: String, default: "marker" },
  },

  data() {
    return {
      /**
       * Show an overlay over the sidebar
       */
      showSidebarOverlay: false,

      /**
       * The main crossfilter instance
       */
      crossfilter: null as crossfilter.Crossfilter<GenericFeature> | null,

      /**
       * The crossfilter dimensions for each filter
       */
      dimensions: {} as CrossfilterDimensions,

      /**
       * The array of filtered features
       */
      filteredData: null as GenericFeature[] | null,

      /**
       * The currently applied filters
       */
      currentFilters: {} as { [key: string]: FilterValue | null },

      /**
       * Keep track of histograms of each dimension
       */
      histograms: {},

      /**
       * Whether we should prevent the map from updating
       */
      preventMapUpdate: false,

      /**
       * Default opacity value for overlay layers
       */
      defaultOverlayOpacity: 50,

      /**
       * Is the map ready?
       */
      mapReady: false,

      /**
       * Internal copy of filters
       */
      filtersCopy: [] as FilterConfig[],
    };
  },

  /**
   * Run the initialization steps for the dashboard
   */
  created() {
    // Copy and save each filter config
    this.filtersCopy = [];
    for (let i = 0; i < this.filters.length; i++) {
      this.filtersCopy.push(Object.assign({}, this.filters[i]));
    }

    // Make sure we have the filter column for main data source
    if (this.sources[0].filterColumn === undefined)
      throw Error(
        "Field 'FilterColumn' must be defined for first (main) data source"
      );

    // Initialize the dashboard
    this.initializeDashboard();
  },
  computed: {
    /**
     * The toggeable layers on the map
     *
     * This DOES NOT include overlays or static layers
     */
    toggleableLayers(): LayerConfig[] {
      return this.layers.filter((l) => !l.overlay && !l.static);
    },

    /**
     * The names of the toggeable layers on the map
     */
    toggleableLayerNames(): string[] {
      return this.toggleableLayers.map((l) => l.name);
    },

    /**
     * The default toggled layer names (shown on start)
     */
    defaultToggledLayerNames(): string[] {
      return this.toggleableLayers
        .filter((l) => l.showOnStart)
        .map((l) => l.name);
    },

    /**
     * All default layer names (shown on start), including static and toggeable
     */
    defaultLayerNames(): string[] {
      return this.layers.filter((l) => l.showOnStart).map((l) => l.name);
    },

    /**
     * The overlay layers on the map
     */
    overlayLayers(): LayerConfig[] {
      return this.layers.filter((l) => l.overlay);
    },

    /**
     * The names of the overlay layers on the map
     */
    overlayLayerNames(): string[] {
      return this.overlayLayers.map((l) => l.name);
    },

    /**
     * The aggregated layers on the map
     */
    aggLayers(): AggregatedLayerConfig[] {
      return this.layers.filter((l) => l.aggregated) as AggregatedLayerConfig[];
    },

    /**
     * The names of the aggregated layers on the map
     */
    aggLayerNames(): string[] {
      return this.aggLayers.map((l) => l.name);
    },

    /**
     * Number of points on the map (non-null geometry)
     */
    totalPointsOnMap(): number {
      if (this.filteredData)
        return this.filteredData.filter((d) => d.geometry != null).length;
      else return 0;
    },

    /**
     * Total size of filtered data set
     */
    filteredSize(): number {
      if (this.filteredData) return this.filteredData.length;
      else return 0;
    },
  },
  watch: {
    /**
     * When the size of the filtered data changes, emit an update event
     *
     * @event update:filtered-data
     */
    filteredSize() {
      this.$emit("update:filtered-data", this.filteredData);
    },

    /**
     * When the data changes, re-initialize the dashboard
     */
    data(newData) {
      // Initialize the dashboard with new data
      this.initializeDashboard();

      // Update the main data source
      let map = this.$refs.FilterableMap as InstanceType<typeof FilterableMap>;
      if (map) {
        map.updateDataSource(this.sources[0].name, newData);
      }
    },
  },
  methods: {
    getLayer(layerName: string): LayerConfig {
      let layer = this.layers.find((l) => l.name == layerName);
      if (layer === undefined)
        throw Error(`Cannot find layer with name '${layerName}'`);
      else return layer;
    },
    getSource(layer: LayerConfig): SourceConfig {
      let source = this.sources.find((s) => s.name == layer.source);
      if (source === undefined)
        throw Error(`Cannot find source '${layer.source}' for download`);
      else return source;
    },

    /**
     * Initialize the dashboard by:
     *    - Setting up the crossfilter instance
     *    - Setting the initial filtered data set
     *    - Initialize slider filter ranges
     *    - Set histograms for slider filters
     */
    initializeDashboard() {
      // Create and save crossfilter from GeoJSON features
      this.crossfilter = crossfilter(this.data!.features);

      // Loop over each filter
      for (let i = 0; i < this.filters.length; i++) {
        let filter = this.filters[i];
        let dim = filter.name;

        // Create and store the crossfilter dimension for this filter
        this.dimensions[dim] = this.crossfilter.dimension(
          (d: GenericFeature) => d.properties[dim]
        );

        // Set default non-null value
        if (filter.default) {
          // Set filter value
          // NOTE: because of how typescript handles overloads, we need to convert
          // the getFilter argument to an intersection
          let filterValue = filter.getFilter(
            filter.default as UnionToIntersection<crossfilter.ComparableValue>
          ) as UnionToIntersection<FilterValue>;

          // Set the dimension filter
          this.dimensions[dim].filter(filterValue);

          // Save the current filter
          this.currentFilters[dim] = filterValue;
        }
        // Reset filter by removing it
        else {
          // Clear filter value
          this.dimensions[dim].filterAll();

          // Set current filter to null
          this.currentFilters[dim] = null;
        }
      }

      // Set the filtered data
      this.filteredData = this.crossfilter.allFiltered();

      // Initialize slider filters
      // NOTE: Do this after all filters are initially set;
      this.setDefaultSliderRanges();
      this.initializeHistograms();
    },

    /**
     * Initialize the histograms for slider filters
     */
    initializeHistograms() {
      // Iterate over all filters
      for (let i = 0; i < this.filtersCopy.length; i++) {
        let filter = this.filtersCopy[i];
        let dim = filter.name;

        // Update histograms for sliders with showHistogram==true
        if (
          filter.kind === "slider" &&
          filter.showHistogram &&
          this.crossfilter !== null
        ) {
          // Ignore the current dimension
          let ignoreDimensions = [this.dimensions[dim]];

          // Get all filtered data, but exclude filters on current dimension
          // @ts-expect-error bug in crossfilter definitions
          let filteredData = this.crossfilter.allFiltered(ignoreDimensions);

          // Get the histogram and set it so vue tracks it
          let hist = this.getHistogram(filteredData, dim);
          this.$set(this.histograms, dim, hist);
        }
      }
    },

    /**
     * Set default slider ranges for slider filters
     */
    setDefaultSliderRanges() {
      // Loop over all filters
      for (let i = 0; i < this.filtersCopy.length; i++) {
        let filter = this.filtersCopy[i];
        let dim = filter.name;

        // Sliders with auto-limits
        if (filter.kind === "slider" && filter.autoLimits) {
          // Min/max values
          let top = this.dimensions[dim].top(1);
          let bottom = this.dimensions[dim].bottom(1);

          // Set the default value
          filter.default = [bottom[0].properties[dim], top[0].properties[dim]];

          // Reset value if the sidebar has been initialized
          // This will reset values on filter
          if (this.$refs.MapSidebar) this.resetFilter(dim);
        }
      }
    },

    /**
     * Reset the dashboard filters and layers
     */
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

    /**
     * Reset all filters in the sidebar
     */
    resetAllFilters() {
      let sidebar = this.$refs.MapSidebar as InstanceType<typeof MapSidebar>;
      sidebar.resetAllFilters();
    },

    /**
     * Reset all layers to defaults
     */
    resetAllLayers() {
      this.setLayers(this.defaultToggledLayerNames);
      this.setOverlayLayer(null);
    },

    /**
     * Set the specified layers in the sidebar
     */
    setLayers(layerNames: string[]) {
      let sidebar = this.$refs.MapSidebar as InstanceType<typeof MapSidebar>;
      sidebar.selectedLayers = layerNames;
    },

    /**
     * Set the specified overlay layer in the sidebar
     */
    setOverlayLayer(layerName: string | null) {
      let sidebar = this.$refs.MapSidebar as InstanceType<typeof MapSidebar>;
      sidebar.selectedOverlay = layerName;
    },

    /**
     * Reset a specific filter in the sidebar
     */
    resetFilter(filterName: string) {
      let sidebar = this.$refs.MapSidebar as InstanceType<typeof MapSidebar>;
      sidebar.resetFilter(filterName);
    },

    /**
     * Handle aggregated download
     */
    handleAggregatedDataDownload(
      layer: AggregatedLayerConfig,
      data: GenericFeature[],
      outputType: "CSV" | "GeoJSON"
    ) {
      // Aggregate input data
      let aggCountMap = rollup(
        data,
        (v) => v.length,
        (d) => d.properties[layer.column]
      );

      // Initialize
      let content, fileName, contentType;

      // Handle CSV
      if (outputType == "CSV") {
        // Convert Map to an array of objects
        let aggCounts = Array.from(
          aggCountMap,
          ([name, count]: [name: string, count: number]) => {
            let out: { [k: string]: string | number } = {};
            out[layer.name] = name;
            out["count"] = count;
            return out;
          }
        ).filter((d) => d[layer.name]); // Remove empty

        // Get the content
        content = Papa.unparse(aggCounts);

        // File and content
        fileName = `Aggregated Data (${layer.name}).csv`;
        contentType = "text/plain";

        // Download it
        downloadFile(content, contentType, fileName);

        // Handle GeoJson
      } else {
        // Initialize the empty collection
        let collection: GenericFeatureCollection = {
          type: "FeatureCollection",
          features: [],
        };

        // Get the source and its data
        let source = this.getSource(layer);
        let geodata = source.data!; // We know that data exists on source

        // Loop over all features
        geodata.features.map((feature) => {
          // Get the name and count
          let name = feature.properties[layer.geoid];
          let count = aggCountMap.get(name) || 0;

          // Overwrite the properties
          feature.properties = {};
          feature.properties[layer.name] = name;
          feature.properties["count"] = count;

          // Add to our collectiom
          collection.features.push(feature as GenericFeature);
        });

        // Download as geojson
        content = JSON.stringify(collection);
        fileName = `Aggregated Data (${layer.name}).geojson`;
        contentType = "text/json";

        // Download it
        downloadFile(content, contentType, fileName);
      }
    },

    /**
     * Handle download click
     *
     * @param params data download parameters from the download button
     */
    handleDownload(params: DataDownloadParams) {
      // Determine the content to download
      let data = params.ignoreFilters
        ? this.data!.features
        : this.filteredData!;

      //  Download specifics
      let fileName, contentType, content;

      // Handle aggregated download
      if (params.aggLayer !== null) {
        let layer = this.aggLayers.find((l) => l.name === params.aggLayer);
        if (layer)
          this.handleAggregatedDataDownload(layer, data, params.outputType);

        // Download raw data
      } else {
        // Format output
        let downloadConfig = this.downloadConfig || {};
        let exclude = downloadConfig.exclude || [];
        let formatters = downloadConfig.formatters || {};
        let renames = downloadConfig.rename || {};

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

            // Rename properties
            Object.keys(renames).map((k) => {
              d.properties[renames[k]] = d.properties[k];
              delete d.properties[k];
            });
          });
        }

        //   CSV
        if (params.outputType == "CSV") {
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

    /**
     * Handle the change in opacity event
     */
    handleOpacityChange(layerName: string, opacity: number) {
      let map = this.$refs.FilterableMap as InstanceType<typeof FilterableMap>;
      map.setPaintProperty(layerName, "fill-opacity", opacity);
    },

    /**
     * Set the filter on the specified source (if it has a filter column defined)
     */
    filterMapSource(layerName: string, source: SourceConfig) {
      if (this.filteredData && source.filterColumn) {
        // Get the values
        let values = this.filteredData
          .map((d) => d.properties[source.filterColumn!])
          .filter((d) => d !== undefined && d !== null);

        // Make them unique
        values = Array.from(new Set(values));

        // Generate the maplibre match condition
        let filter;
        if (values.length > 0) {
          filter = ["match", ["get", source.filterColumn], values, true, false];
        } else filter = false;

        // Set the filter
        let map = this.$refs.FilterableMap as InstanceType<
          typeof FilterableMap
        >;
        map.setFilter(layerName, filter);
      }
    },

    /**
     * Handle the update:filter event from the side bar.
     * This is the main function reponsible for controlling filter updates
     *
     * If filter name is "layer" is updates the map, otherwise it will update
     * one of the user-specified filters
     *
     * @param filterName "layer" or one of the filter names
     * @param args
     * @event update:filter
     */
    async handleFilterUpdate(
      filterName: string,
      args:
        | { layerName: string; show: boolean }
        | {
            value: CrossfilterTypes;
            excludeMissing?: boolean;
          }
    ) {
      // Update map layers
      if (filterName == "layer") {
        // Cast args appropriately
        args = args as { layerName: string; show: boolean };

        // Await the update
        await this.handleLayerFilterUpdate(args.layerName, args.show);
      }
      // Handle changes to the user-defined filters
      else {
        // Cast args appropriately
        args = args as {
          value: CrossfilterTypes;
          excludeMissing?: boolean;
        };

        // Call the update
        this.handleUserFilterUpdate(
          filterName,
          args.value,
          args.excludeMissing
        );
      }

      // Emit the update filter event
      this.$emit("update:filter", filterName, args);
    },

    /**
     * Handle the update when the user changes which layers are active
     *
     * @param layerName the name of the layer that changed
     * @param show whether the layer is now being shown or not
     */
    async handleLayerFilterUpdate(layerName: string, show: boolean) {
      // This is the full layer and source configs
      let layer = this.getLayer(layerName);
      let source = this.getSource(layer);

      // Set the active layer on the map
      // If the layer is aggregated, this will make sure agg data is up to date
      let map = this.$refs.FilterableMap as InstanceType<typeof FilterableMap>;
      await map.setActiveLayers(layerName, show);

      // Try to filter by the specified column
      this.filterMapSource(layerName, source);
    },

    /* Handle the update when the user changes a user-defined filter
     *
     */
    handleUserFilterUpdate(
      filterName: string,
      filterValue: CrossfilterTypes,
      excludeMissing?: boolean
    ) {
      // Get the filter
      // This will always work: filterName is internal
      let filter = this.filtersCopy.find((d) => d.name == filterName)!;

      // Create the current filter function
      // NOTE: Have to fix union to intersection because of typescript overloads
      let currentFilter = filter.getFilter(
        filterValue as UnionToIntersection<crossfilter.ComparableValue>,
        excludeMissing
      ) as UnionToIntersection<FilterValue>;

      // Set it as the current filter for this dimension
      this.currentFilters[filterName] = currentFilter;

      // Apply the filter
      this.applyFilter(filterName);
    },

    /**
     * Calculate a histogram of the input data
     */
    getHistogram(values: GenericFeature[], dimension: string) {
      let data = values.map((feature) => +feature.properties[dimension]);
      return bin().thresholds(this.histogramBins)(data);
    },

    /**
     *  Update the histograms
     */
    updateHistograms() {
      for (let filterName in this.histograms) {
        // Get the filtered data
        let ignoreDimensions = [this.dimensions[filterName]];
        // @ts-expect-error bug in crossfilter definitions
        let data = this.crossfilter.allFiltered(ignoreDimensions);

        this.$set(
          this.histograms,
          filterName,
          this.getHistogram(data, filterName)
        );
      }
    },

    /**
     * Apply the current filter
     */
    applyFilter(filterName: string) {
      // Set the filter on this dimension
      let currentFilter = this.currentFilters[filterName];
      if (currentFilter !== null)
        this.dimensions[filterName].filter(currentFilter);
      else this.dimensions[filterName].filterAll();

      // Set the filtered data
      let oldLength = this.filteredData!.length;
      this.filteredData = this.crossfilter!.allFiltered();

      // Run the post-update hooks if filtered data length changed
      this.$nextTick(() => {
        if (oldLength != this.filteredData!.length && !this.preventMapUpdate) {
          this.postFilterMapUpdate();
        }
      });
    },

    /**
     * Run the post-filter updates
     */
    postFilterMapUpdate() {
      // Map
      let map = this.$refs.FilterableMap as InstanceType<typeof FilterableMap>;

      // Active layers
      let activeLayers = map.activeLayers;

      // Handle all active layers
      for (let layerName of activeLayers) {
        // The full layer and source configs
        let layer = this.getLayer(layerName);
        let source = this.getSource(layer);

        // Filter by the specified column
        if (source.filterColumn) this.filterMapSource(layerName, source);

        // Update any aggregated data
        if (layer.aggregated)
          map.updateAggregatedSource(layer as AggregatedLayerConfig);
      }

      // Update slider histograms
      this.updateHistograms();
    },
  },
});
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
