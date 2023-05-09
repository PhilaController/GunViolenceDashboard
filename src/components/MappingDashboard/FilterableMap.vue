<template>
  <div class="filterable-map__container">
    <!-- Container for map -->
    <div class="filterable-map__container__inner">
      <div id="map"></div>

      <!-- Loading circle -->
      <div class="map-overlay">
        <div class="map-overlay__inner" v-if="showLoadingSpinner">
          <v-progress-circular indeterminate size="32" color="#fff" />
        </div>
      </div>

      <!-- Map Legend -->
      <map-legend
        :width="250"
        :barHeight="15"
        :tickSize="12"
        tickFormat=",.0f"
        ref="MapLegend"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";

import MapLegend from "./MapLegend.vue";
import maplibregl from "maplibre-gl";
import { queryFeatureServer, queryFeatureServerBatch } from "@/utils/io";
import { extent, rollup } from "d3-array";

// Types
import { LayerConfig, AggregatedLayerConfig } from "@/types/Layers";
import {
  SourceConfig,
  ArcgisSourceConfig,
  BatchArcgisSourceConfig,
  DataFeatureCollection,
} from "@/types/Sources";

import { GenericFeature } from "@/types/Data";

// d3 modules
import * as d3Scale from "d3-scale";
import * as d3ScaleChromatic from "d3-scale-chromatic";

const TAG = " (User)";

type indexable = { [index: string]: any };

export default defineComponent({
  name: "FilterableMap",
  props: {
    /**
     * The array of filtered features
     */
    filteredData: {
      type: Array as PropType<GenericFeature[] | null>,
      required: true,
    },

    /**
     * Array of configuration options for loading source data for map
     */
    sources: { type: Array as PropType<SourceConfig[]>, required: true },

    /**
     * Array of configuration options for map layers
     */
    layers: { type: Array as PropType<LayerConfig[]>, required: true },

    /**
     * The default layer names (shown on start)
     */
    defaultLayerNames: {
      type: Array as PropType<string[]>,
      default: () => [],
    },

    /**
     * Map title
     */
    title: { type: String, required: true },

    /** Default maplibre map options */
    mapOptions: {
      type: Object as PropType<Partial<maplibregl.MapOptions>>,
      default: () => {
        return {
          maxZoom: 16,
          minZoom: 10,
          zoom: 11,
          center: [-75.15, 39.985],
          maxPitch: 0,
          pitchWithRotate: false,
          dragRotate: false,
          touchPitch: false,
        };
      },
    },

    /**
     * Default opacity value for overlay layers
     */
    defaultOverlayOpacity: { type: Number, default: 50 },
  },
  components: { MapLegend },
  data() {
    // Reactive properties
    let data = {
      /** Whether the map has been fully loaded */
      mapLoaded: false,

      /** Whether the data sources have all been loaded */
      dataLoading: false,

      /** Force the spinning loader to show  */
      showLoader_: false,

      /**  Names of layers that are active on the map */
      activeLayers: [] as string[],

      /** Whether to show the legend */
      showLegend_: false,

      /** Copy of sources  */
      sourcesCopy: [] as SourceConfig[],

      /** The current zoom level for map */
      zoom: null as number | null,

      /** The current center of map */
      center: null as maplibregl.LngLatLike | null,
    };

    // Return reactive plus nonreactive Map
    return data as typeof data & { map: any };
  },

  /**
   * When created, check for initial query params and initialize map
   */
  created() {
    // Get the map query param and set initial values
    if (this.$route.query.map) {
      let map = this.$route.query.map as string; // this is a string parameter
      let hash = map.split("/");

      // Store the zoom and center
      this.zoom = parseFloat(hash[0]);
      this.center = [parseFloat(hash[2]), parseFloat(hash[1])];
    }

    // Initialize the map
    this.map = null;

    // Set sources copy
    this.sourcesCopy = [];
    for (let i = 0; i < this.sources.length; i++) {
      this.sourcesCopy.push(Object.assign({}, this.sources[i]));
    }
  },

  /**
   * When mounted, initialize the map
   */
  mounted() {
    // the map container
    let mapContainer = document.getElementById("map");

    //  Add the map if the container exists
    if (mapContainer !== null) {
      // The map options
      let options = {
        ...this.mapOptions,
        container: mapContainer,
        style: require("@/data/style.json"),
      };

      // Add initial query param
      if (this.zoom !== null) {
        options.zoom = this.zoom;
      }
      if (this.center !== null) {
        options.center = this.center;
      }

      // Initialize the map
      let map = new maplibregl.Map(options);

      // Add control
      let nav = new maplibregl.NavigationControl({ showCompass: false });
      map.addControl(nav, "top-right");

      // disable map rotation using right click + drag
      map.dragRotate.disable();

      // disable map rotation using touch rotation gesture
      map.touchZoomRotate.disableRotation();

      // Save it
      this.map = map;

      // Add initial layers & sources
      map.on("load", async () => {
        // Zoom & center
        this.zoom = map.getZoom();
        this.center = map.getCenter();

        // Loop over default layers and set active layers
        for (let layerName of this.defaultLayerNames) {
          await this.setActiveLayers(layerName, true);
        }
        // Ready for first time
        if (!this.mapLoaded) {
          this.mapLoaded = true;
          this.$emit("map:ready");
        }
      });

      // Track center and zoom
      map.on("move", () => {
        this.center = map.getCenter();
      });
      map.on("zoom", () => {
        this.zoom = map.getZoom();
      });

      // Show spinner when data is loading
      map.on("dataloading", () => {
        this.dataLoading = true;
      });

      // When data is idle, data loading is done
      map.on("idle", () => {
        this.dataLoading = false;
      });
    }
  },

  computed: {
    /**
     * Whether to show the loading spinner on the map
     */
    showLoadingSpinner(): boolean {
      return this.dataLoading || this.showLoader_;
    },

    /**
     * The map hash:
     *
     * /zoom/lat/lng
     */
    mapHash(): string {
      if (this.zoom == null || this.center == null) {
        return "";
      } else {
        // Get the center in a typesafe way
        let center = maplibregl.LngLat.convert(this.center);
        let lat = center.lat;
        let lng = center.lng;

        //  Output the hash
        return `${this.zoom.toFixed(2)}/${lat.toFixed(5)}/${lng.toFixed(5)}`;
      }
    },
  },

  watch: {
    /**
     * When we are showing/hiding the loading spinner, emit a corresponding event
     */
    showLoadingSpinner(newVal) {
      this.$emit("showOverlay", newVal);
    },

    /**
     * When the map hash changes, update the query url
     */
    mapHash(newVal, prevVal) {
      // Do nothing if it's the same
      if (newVal === prevVal || newVal === "") return;

      // Update the query params
      let q = Object.assign({}, this.$route.query);
      q["map"] = newVal;
      this.$router.push({ query: q }).catch((error) => {
        if (error.name !== "NavigationDuplicated") {
          throw error;
        }
      });
    },
  },

  methods: {
    /**
     * Return the layer config with the specific name
     */
    getLayer(layerName: string): LayerConfig {
      let layer = this.layers.find((l) => l.name == layerName);
      if (layer === undefined)
        throw Error(`Cannot find layer with name '${layerName}'`);
      else return layer;
    },

    /**
     * Get the source (from the copy) for the input layer
     */
    getSource(layer: LayerConfig): SourceConfig {
      let source = this.sourcesCopy.find((s) => s.name == layer.source);
      if (source === undefined)
        throw Error(`Cannot find source '${layer.source}' for download`);
      else return source;
    },

    /**
     * Add an active layer
     */
    addActiveLayer(layerName: string) {
      if (!this.activeLayers.includes(layerName))
        this.activeLayers.push(layerName);
    },

    /**
     * Remove an active layer
     */
    removeActiveLayer(layerName: string) {
      let index = this.activeLayers.findIndex((name) => name === layerName);
      if (index === -1)
        throw Error(`Active layer ${layerName} not found when removing`);
      this.activeLayers.splice(index, 1);
    },

    /**
     * Show the specified layer on the map
     */
    showLayer(map: maplibregl.Map, layerName: string) {
      if (map.getLayer(layerName + TAG))
        map.setLayoutProperty(layerName + TAG, "visibility", "visible");
      else
        throw Error(`Cannot show layer '${layerName}'; layer does not exist`);
    },

    /**
     * Hide the specified layer on the map
     */
    hideLayer(map: maplibregl.Map, layerName: string) {
      if (map.getLayer(layerName + TAG))
        map.setLayoutProperty(layerName + TAG, "visibility", "none");
      else
        throw Error(`Cannot show layer '${layerName}'; layer does not exist`);
    },

    /**
     * Update the data for an aggregated data source
     */
    updateAggregatedSource(layer: AggregatedLayerConfig) {
      // Do nothing if null data
      if (this.filteredData === null) return;

      // Aggregate the data
      let aggData = rollup(
        this.filteredData.filter((d) => d.properties[layer.column]),
        (v) => v.length,
        (d) => d.properties[layer.column]
      );

      // Get the source and its data
      let source = this.getSource(layer);
      let geodata = source.data!; // We know that data exists on source

      // Get the legend info
      let legend = layer.legend;

      // The color scheme
      let colorScheme;
      if (legend) colorScheme = legend.colorScheme;
      else colorScheme = "Reds";

      // Get the colorscale object from d3
      let key = `interpolate${colorScheme}`;
      let colorScale = (d3ScaleChromatic as indexable)[key];

      // Range
      let range;
      if (legend) range = legend.colorRange;
      else range = [0, 1];

      // Domain
      let domain = extent(aggData, (d) => d[1]);
      if (domain[0] === undefined || domain[1] === undefined)
        throw Error("Undefined legend domain values, cannot proceed!");

      // Type of scale
      let scaleName;
      if (legend) scaleName = legend.scaleName;
      else scaleName = "Sequential";

      // Get the scale object
      key = `scale${scaleName}`;
      let scaleFunction = (d3Scale as indexable)[key];

      // Make sure it exists and then initializ it
      if (scaleFunction === undefined)
        throw Error(`Scale ${scaleName} does not exist`);
      let scale = scaleFunction().domain(domain).range(range);

      // Update the legend
      let mapLegend = this.$refs.MapLegend as InstanceType<typeof MapLegend>;
      mapLegend.show({
        colorScheme,
        range,
        domain,
        title: this.title,
      });

      // Function that returns the color
      const getColor = (value: number) => colorScale(scale(value));

      // Loop over all features
      geodata.features.map((feature) => {
        // The value of the geoid column
        let id = feature.properties[layer.geoid];

        // Get the count and colr
        let count = aggData.get(id) || 0;
        let color = getColor(count);

        // Update the data
        feature.properties["color"] = color;
        feature.properties["count"] = count;
      });

      // Update the map's data source
      this.map.getSource(layer.source + TAG).setData(source.data);
    },

    /**
     * Query the data source
     */
    async queryDataSource(
      source: ArcgisSourceConfig | BatchArcgisSourceConfig
    ) {
      // Data
      let data;

      // Single query
      if (!("batchSize" in source)) {
        data = await queryFeatureServer({
          url: source.url,
          outFields: source.outFields,
          where: source.where,
          geometryPrecision: source.geometryPrecision,
        });
      }
      // Multiple queries
      else {
        let where_key = source.whereColumn;
        if (where_key === undefined)
          throw Error("Please define 'whereColumn' if batch mode enabled");

        // Filtered Data (we know it exists)
        let fd = this.filteredData!;

        // The corresponding values
        let values = Array.from(
          new Set(fd.map((d) => d.properties[where_key]).filter((d) => d))
        );

        // Return the query
        data = await queryFeatureServerBatch({
          url: source.url,
          where_key: where_key,
          where_value: values,
          outFields: source.outFields,
          geometryPrecision: source.geometryPrecision,
          batch_size: source.batchSize,
        });
      }

      // Format specific columns

      if (source.formatter) {
        data.features.map((feature) => {
          for (let key in source.formatter) {
            let props = feature.properties;
            if (props) {
              let val = props[key];
              (feature.properties as indexable)[key] = (
                source.formatter as indexable
              )[key](val);
            }
          }
        });

        for (let i = 0; i < data.features.length; i++) {
          for (let key in source.formatter) {
            let d = data.features[i].properties;
            if (d) {
              let val = d[key];
              (data.features[i].properties as { [index: string]: any })[key] = (
                source.formatter as { [index: string]: any }
              )[key](val);
            }
          }
        }
      }

      return data;
    },

    /**
     * Update data source and clear filters on related layers
     */
    updateDataSource(sourceName: string, data: DataFeatureCollection) {
      // Set the data
      if (this.map.getSource(sourceName + TAG))
        this.map.getSource(sourceName + TAG).setData(data);

      // Clear any filters on layers with this source
      for (let i = 0; i < this.layers.length; i++) {
        let layer = this.layers[i];
        if (layer.source === sourceName && this.map.getLayer(layer.name + TAG))
          this.setFilter(layer.name, true);
      }
    },

    /**
     * Async function to add layer (and source if needed) to the map
     */
    async addLayer(map: maplibregl.Map, layer: LayerConfig) {
      // Show the loader
      this.showLoader();

      // Find the source
      let source = this.getSource(layer);

      // Add the source if we need to
      if (!map.getSource(source.name + TAG)) {
        // Do we need to query the data?
        if ("url" in source) {
          source.data = await this.queryDataSource(source);
        }

        // Make sure we have data
        if (source.data === undefined)
          throw Error(`No data for source '${source.name}'`);

        // Add the source to the map
        map.addSource(source.name + TAG, {
          type: "geojson",
          data: source.data,
        });
      }

      // Make sure paint is correct
      let paint = layer.paint;
      if (paint === undefined) paint = {};

      // Add the color styling
      if (layer.aggregated) {
        paint = { ...paint };
        (paint as indexable)[`${layer.type}-color`] = ["get", "color"];
      }

      // Opacity for overlays
      if (layer.overlay) {
        (paint as indexable)["fill-opacity"] = this.defaultOverlayOpacity / 100;
      }

      // Add the layer too
      let beforeId = layer.beforeId;
      if (beforeId) beforeId = beforeId + TAG;
      map.addLayer(
        {
          id: layer.name + TAG,
          type: layer.type,
          source: layer.source + TAG,
          layout: {},
          paint: paint,
        },
        beforeId
      );

      // Add a popup
      if (layer.tooltip) {
        if (layer.tooltip.formatter) {
          // The html formatter
          let formatter = layer.tooltip.formatter;

          // Initialize the popup
          let popup = new maplibregl.Popup({
            closeButton: false,
            closeOnClick: false,
          });

          if (layer.tooltip.on === "mouseenter") {
            map.on("mouseenter", layer.name + TAG, (e) => {
              // The feature
              let features = e.features;
              if (features === undefined) return;

              // Change the cursor style as a UI indicator.
              map.getCanvas().style.cursor = "pointer";

              // Add popup
              popup
                .setLngLat(e.lngLat)
                .setHTML(formatter(features[0].properties))
                .addTo(map);
            });

            // Remove it
            map.on("mouseleave", layer.name + TAG, () => {
              map.getCanvas().style.cursor = "";
              popup.remove();
            });
          } else if (layer.tooltip.on === "mousemove") {
            map.on("mousemove", layer.name + TAG, (e) => {
              // The feature
              let features = e.features;
              if (features === undefined) return;

              // Add popup
              popup
                .setLngLat(e.lngLat)
                .setHTML(formatter(features[0].properties))
                .addTo(map);
            });

            // Remove it
            map.on("mouseleave", layer.name + TAG, () => {
              popup.remove();
            });
          } else
            throw Error(
              "Unsupported tooltip 'on'; should be 'mouseenter' or 'mousemove'"
            );
        }
      }

      // Hide the loader
      this.hideLoader();
    },

    /**
     * Force the loader to show
     */
    showLoader() {
      this.showLoader_ = true;
    },

    /**
     * Force the loader to hide
     */
    hideLoader() {
      this.showLoader_ = false;
    },

    /**
     * Set the specified paint property on the map
     */
    setPaintProperty(name: string, key: string, value: any) {
      if (this.map) this.map.setPaintProperty(name + TAG, key, value);
    },

    /**
     * Set the specified filter on the map
     */
    setFilter(name: string, value: any) {
      if (this.map) this.map.setFilter(name + TAG, value);
    },

    /**
     * Set the active layers on the map
     */
    async setActiveLayers(layerName: string, show: boolean) {
      // The layer and source configs
      let layer = this.getLayer(layerName);
      let source = this.getSource(layer);

      // Remove from map
      if (show) {
        // Need to check if layer is loaded in batch mode
        // and remove it completely if it is
        if ("whereColumn" in source) {
          //
          let whereColumn = source.whereColumn;
          if (source.data && this.filteredData) {
            // Existing features on map
            let existingValues = new Set(
              source.data.features.map((d) => d.properties[whereColumn])
            );

            // New features to show
            let newValues = new Set(
              this.filteredData.map((d) => d.properties[whereColumn])
            );

            // Take difference
            let missing = new Set(
              [...newValues].filter((x) => !existingValues.has(x))
            );

            // If we are missing some, remove the whole layer and source
            // so we can re-add
            if (missing.size > 0) {
              this.map.removeLayer(layerName + TAG);
              this.map.removeSource(layer.source + TAG);
            }
          }
        }

        // Add it to map, or just show it
        if (this.map.getLayer(layerName + TAG)) {
          this.showLayer(this.map, layerName);
        } else {
          await this.addLayer(this.map, layer);
        }

        // Update the source if aggregated
        if (layer.aggregated) {
          this.updateAggregatedSource(layer as AggregatedLayerConfig);
        }

        // Track it
        this.addActiveLayer(layerName);

        // Remove this layer
      } else {
        // Hide the layer
        if (this.map.getLayer(layerName + TAG))
          this.hideLayer(this.map, layerName);

        // Hide the legend
        if (layer.aggregated) (this.$refs.MapLegend! as any).hide();

        // Track it
        this.removeActiveLayer(layerName);
      }
    },
  },
});
</script>

<style>
@import "~maplibre-gl/dist/maplibre-gl.css";

.filterable-map__container {
  flex: 1 1;
  display: flex;
  width: 100% !important;
  position: relative;
}

#map {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 100%;
  height: 100%;
}

@media screen and (max-width: 767.98px) {
  .filterable-map__container__inner {
    height: 60vh !important;
  }

  .maplibregl-ctrl-attrib {
    display: none !important;
  }
}

.map-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  text-align: right;
  padding-top: 100px !important;
}

.map-overlay .map-overlay__inner {
  padding: 10px;
  margin-bottom: 10px;
}
</style>
