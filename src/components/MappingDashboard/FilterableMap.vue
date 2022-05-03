<template>
  <div class="filterable-map__container">
    <!-- Container for map -->
    <div id="map"></div>

    <!-- Loading circle -->
    <div class="map-overlay">
      <div class="map-overlay__inner" v-if="dataLoading || showLoader_">
        <v-progress-circular indeterminate size="32" color="#fff" />
      </div>
    </div>

    <!-- Map Legend -->
    <MapLegend
      :width="250"
      :barHeight="15"
      :tickSize="12"
      tickFormat=",.0f"
      ref="MapLegend"
    />
  </div>
</template>

<script>
import MapLegend from "./MapLegend";
import maplibregl from "maplibre-gl";
import { queryFeatureServer, queryFeatureServerBatch } from "@/utils/io";
import { extent, rollup } from "d3-array";

const d3Scale = require("d3-scale");
const d3ScaleChromatic = require("d3-scale-chromatic");

const TAG = " (User)";

export default {
  props: {
    filteredData: Array,
    aggregatedData: Object,
    sources: Array,
    layers: Array,
    title: String,
    mapOptions: {
      type: Object,
      default: () => {
        return {
          maxZoom: 16,
          minZoom: 10,
          zoom: 11,
          center: [-75.15, 39.985],
        };
      },
    },
    defaultOverlayOpacity: { type: Number, default: 50 },
  },
  components: { MapLegend },
  data() {
    return {
      mapLoaded: false, // Map loaded
      dataLoading: false, // Is data loading?
      showLoader_: false, // Force the loader to show
      activeLayers: [], // Names of layers that are active on the map
      showLegend_: false, // Whether to show the legend
      sourcesCopy: [], // Copy of sources
    };
  },
  created() {
    // Store the map
    this.map = null;

    // Set sources copy
    this.sourcesCopy = [];
    for (let i = 0; i < this.sources.length; i++) {
      this.sourcesCopy.push(Object.assign({}, this.sources[i]));
    }
  },

  /*------ 
  When mounted, initialize the map
  -------*/
  mounted() {
    // the map container
    let mapContainer = document.getElementById("map");

    //  Add the map if the container exists
    if (mapContainer !== null) {
      // Create the map
      let map = new maplibregl.Map({
        container: mapContainer,
        style: require("@/data/style.json"),
        center: this.mapOptions.center,
        zoom: this.mapOptions.zoom,
        maxZoom: this.mapOptions.maxZoom,
        minZoom: this.mapOptions.minZoom,
      });

      // Add control
      let nav = new maplibregl.NavigationControl({ showCompass: false });
      map.addControl(nav, "top-right");

      // Add initial layers & sources
      map.on("load", async () => {
        // Loop over default layers
        for (let layerName of this.layerNamesDefault) {
          this.setActiveLayers(layerName, true);
        }
        // Ready for first time
        if (!this.mapLoaded) {
          this.mapLoaded = true;
          this.$emit("map:ready");
        }
      });

      // Show spinner when data is loading
      map.on("dataloading", () => {
        this.dataLoading = true;
      });

      // When data is idle, data loading is done
      map.on("idle", () => {
        this.dataLoading = false;
      });

      // Save it
      this.map = map;
    }
  },

  computed: {
    /*------ 
    The default layers
    -------*/
    layerNamesDefault() {
      return this.layers.filter((l) => l.showOnStart).map((l) => l.name);
    },
  },

  methods: {
    /*------ 
     Add/remove an active layer 
    -------*/
    addActiveLayer(layerName) {
      if (!this.activeLayers.includes(layerName))
        this.activeLayers.push(layerName);
    },
    removeActiveLayer(layerName) {
      let index = this.activeLayers.findIndex((name) => name === layerName);
      if (index === -1)
        throw Error(`Active layer ${layerName} not found when removing`);
      this.activeLayers.splice(index, 1);
    },

    /*------ 
     Show the specified layer on the map
    -------*/
    showLayer(map, layerName) {
      if (map.getLayer(layerName + TAG))
        map.setLayoutProperty(layerName + TAG, "visibility", "visible");
      else
        throw Error(`Cannot show layer '${layerName}'; layer does not exist`);
    },

    /*------ 
     Hide the specified layer on the map
    -------*/
    hideLayer(map, layerName) {
      if (map.getLayer(layerName + TAG))
        map.setLayoutProperty(layerName + TAG, "visibility", "none");
      else
        throw Error(`Cannot show layer '${layerName}'; layer does not exist`);
    },

    /*------ 
    Update the data for an aggregated data source
    -------*/
    updateAggregatedSource(layer) {
      // Aggregate the data
      let aggData = rollup(
        this.filteredData.filter((d) => d.properties[layer.column]),
        (v) => v.length,
        (d) => d.properties[layer.column]
      );

      // Get the source
      let source = this.sourcesCopy.find((d) => d.name == layer.source);

      // Get the legend info
      let legend = layer.legend || {};

      // The color scheme
      let colorScheme = legend.colorScheme || "Reds";
      let colorScale = d3ScaleChromatic[`interpolate${colorScheme}`];

      // Range
      let range = legend.colorRange || [0, 1];
      let domain = extent(aggData, (d) => d[1]);

      // Type of scale
      let scaleName = legend.scaleName || "Sequential";

      // Check the scale
      if (d3Scale[`scale${scaleName}`] === undefined)
        throw Error(`Scale ${scaleName} does not exist`);
      let scale = d3Scale[`scale${scaleName}`]().domain(domain).range(range);

      // Update the legend
      this.$refs.MapLegend.show({
        colorScheme,
        range,
        domain,
        title: this.title,
      });

      // Function that returns the color
      const getColor = (value) => colorScale(scale(value));

      // Loop over each source feature
      for (let i = 0; i < source.data.features.length; i++) {
        // The feature
        let feature = source.data.features[i];

        // The value of the geoid column
        let id = feature.properties[layer.geoid];

        // Get the count and colr
        let count = aggData.get(id) || 0;
        let color = getColor(count);

        // Update the data
        feature.properties["color"] = color;
        feature.properties["count"] = count;
      }

      // Update the map's data source
      this.map.getSource(layer.source + TAG).setData(source.data);
    },

    /*------ 
    Query the data source
    -------*/
    async queryDataSource(source) {
      let batch_size = source.batch_size;
      let data;

      // Single query
      if (batch_size === undefined) {
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

        // The corresponding values
        let values = Array.from(
          new Set(
            this.filteredData
              .map((d) => d.properties[where_key])
              .filter((d) => d)
          )
        );

        // Return the query
        data = await queryFeatureServerBatch({
          url: source.url,
          where_key: where_key,
          where_value: values,
          outFields: source.outFields,
          geometryPrecision: source.geometryPrecision,
          batch_size: batch_size,
        });
      }

      // Format
      if (source.formatter) {
        for (let i = 0; i < data.features.length; i++) {
          for (let key in source.formatter) {
            let val = data.features[i].properties[key];
            data.features[i].properties[key] = source.formatter[key](val);
          }
        }
      }

      return data;
    },

    /*------ 
     Update data source and clear filters on related layers
    -------*/
    updateDataSource(sourceName, data) {
      if (this.map.getSource(sourceName + TAG))
        this.map.getSource(sourceName + TAG).setData(data);

      // Clear any filters on layers with this source
      for (let i = 0; i < this.layers.length; i++) {
        let layer = this.layers[i];
        if (layer.source === sourceName && this.map.getLayer(layer.name + TAG))
          this.setFilter(layer.name, true);
      }
    },

    /*------ 
     Async function to add layer (and source if needed) to the map
    -------*/
    async addLayer(map, layer) {
      // Show the loader
      this.showLoader();

      // Find the source
      let source = this.sourcesCopy.find((d) => d.name == layer.source);
      if (source === undefined)
        throw Error(`Cannot find source with name '${layer.source}'`);

      // Add the source if we need to
      if (!map.getSource(source.name + TAG)) {
        // Do we need to query the data?
        if (source.url) {
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
        paint[`${layer.type}-color`] = ["get", "color"];
      }

      // Opacity for overlays
      if (layer.overlay) {
        paint["fill-opacity"] = this.defaultOverlayOpacity / 100;
      }

      // Add the layer too
      map.addLayer({
        id: layer.name + TAG,
        type: layer.type,
        source: layer.source + TAG,
        layout: {},
        paint: paint,
      });

      // Add a popup
      if (layer.tooltip) {
        if (layer.tooltip.formatter) {
          // Initialize the popup
          let popup = new maplibregl.Popup({
            closeButton: false,
            closeOnClick: false,
          });

          let on = layer.tooltip.on || "mouseenter";
          if (on === "mouseenter") {
            map.on("mouseenter", layer.name + TAG, (e) => {
              // Change the cursor style as a UI indicator.
              map.getCanvas().style.cursor = "pointer";

              // Add popup
              popup
                .setLngLat(e.lngLat)
                .setHTML(layer.tooltip.formatter(e.features[0].properties))
                .addTo(map);
            });

            // Remove it
            map.on("mouseleave", layer.name + TAG, () => {
              map.getCanvas().style.cursor = "";
              popup.remove();
            });
          } else if (on === "mousemove") {
            map.on("mousemove", layer.name + TAG, (e) => {
              // Add popup
              popup
                .setLngLat(e.lngLat)
                .setHTML(layer.tooltip.formatter(e.features[0].properties))
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
      this.hideLoader(layer.name);
    },

    /*------ 
     Force the loader to show/hide
    -------*/
    showLoader() {
      this.showLoader_ = true;
    },
    hideLoader() {
      this.showLoader_ = false;
    },

    /*------ 
     Set the specified paint property on the map
    -------*/
    setPaintProperty(name, key, value) {
      if (this.map) this.map.setPaintProperty(name + TAG, key, value);
    },

    /*------ 
     Set the specified filter on the map
    -------*/
    setFilter(name, value) {
      if (this.map) this.map.setFilter(name + TAG, value);
    },

    removeLayer(name) {
      if (this.map) this.map.removeLayer(name + TAG);
    },

    getLayer(name) {
      if (this.map) return this.map.getLayer(name + TAG);
    },

    /*------ 
     Set the active layers on the map
    -------*/
    async setActiveLayers(layerName, show) {
      // The layer and source configs
      let layer = this.layers.find((l) => l.name == layerName);
      let source = this.sourcesCopy.find((d) => d.name == layer.source);

      // Remove from map
      if (show) {
        // Where column
        if (source.whereColumn && source.data) {
          let existingValues = new Set(
            source.data.features.map((d) => d.properties[source.whereColumn])
          );
          let newValues = new Set(
            this.filteredData.map((d) => d.properties[source.whereColumn])
          );

          // Take difference
          let missing = new Set(
            [...newValues].filter((x) => !existingValues.has(x))
          );

          if (missing.size > 0) {
            this.map.removeLayer(layerName + TAG);
            this.map.removeSource(layer.source + TAG);
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
          this.updateAggregatedSource(layer);
        }

        // Track it
        this.addActiveLayer(layerName);

        // Remove this layer
      } else {
        // Hide the layer
        if (this.map.getLayer(layerName + TAG))
          this.hideLayer(this.map, layerName);

        // Hide the legend
        if (layer.aggregated) this.$refs.MapLegend.hide();

        // Track it
        this.removeActiveLayer(layerName);
      }
    },
  },
};
</script>

<style>
@import "~maplibre-gl/dist/maplibre-gl.css";

.filterable-map__container {
  flex: 1 1;
  display: flex;
  position: relative;
}

#map {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 100%;
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


