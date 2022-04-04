<template>
  <div></div>
</template>

<script>
import { findRealParent } from "@/utils/utils.js";
import { max, rollup } from "d3-array";
import { scaleSequential } from "d3-scale";

// Import esri-leaflet too
const esri = require("esri-leaflet");

const d3ScaleChromatic = require("d3-scale-chromatic");

export default {
  name: "AggregationLayer",
  props: {
    data: Array,
    url: String,
    geoid: String,
    label: String,
    name: String,
    colorScheme: { type: String, default: "interpolateReds" },
    opacity: { type: Number, default: 0.5 },
  },
  data() {
    return { parentContainer: null, layer: null };
  },
  mounted() {
    // Get the parent container
    this.parentContainer = findRealParent(this.$parent);
    this.parentContainer.addLayer(this, true);

    // Check the color scheme value
    if (d3ScaleChromatic[this.colorScheme] === undefined) {
      throw console.error(
        `The color scheme ${this.colorScheme} is not supported.`
      );
    }
  },
  computed: {
    extent() {
      if (this.counts) return [0, max(this.counts, (d) => d[1])];
      else return null;
    },
    counts() {
      if (this.data !== null) {
        return rollup(
          this.data,
          (v) => v.length,
          (d) => d.properties[this.name]
        );
      } else return null;
    },
    colorScale() {
      return scaleSequential(d3ScaleChromatic[this.colorScheme]).domain(
        this.extent
      );
    },
  },
  methods: {
    setOpacity(opacity) {
      this.opacity = opacity;
    },
    getTooltip(feature) {
      // The name of each geographic region
      let key = feature.properties[this.geoid];

      // Get the total count
      let count = this.counts.get(key) || 0;

      // Determine the title to show
      let title;
      if (
        (this.name == "council") |
        (this.name == "police") |
        (this.name == "house_district")
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
    styleFunction(feature) {
      let key = feature.properties[this.geoid];

      let color = this.colorScale(this.counts.get(key) || 0);
      return {
        color: "#cfcfcf",
        fillColor: color,
        weight: 1,
        opacity: 1,
        fillOpacity: this.opacity,
      };
    },
    onEachFeatureFunction(feature, layer) {
      layer.bindTooltip(this.getTooltip(layer.feature), {
        permanent: false,
        sticky: true,
        opacity: 1.0,
      });
    },
    add(map) {
      // Update legend color scale
      this.legendColorScale = d3ScaleChromatic[this.colorScheme];
      this.legendRange = [0, 1];

      if (this.layer == null) {
        this.layer = esri.featureLayer({
          url: this.url,
          style: this.styleFunction,
          onEachFeature: this.onEachFeatureFunction,
          pane: "aggLayers",
        });
      }

      // Add new layer
      if (!map.hasLayer(this.layer)) {
        map.addLayer(this.layer);
      }
    },
    remove(map) {
      if (this.layer !== null && map.hasLayer(this.layer))
        map.removeLayer(this.layer);
    },
    update() {
      // If we have an agg layer, update the colors
      // Update style
      let aggLayer = this.layer;
      if (aggLayer) {
        aggLayer.setStyle(this.styleFunction);

        // Update tooltip
        aggLayer.eachFeature((layer) => {
          layer.bindTooltip(this.getTooltip(layer.feature), {
            permanent: false,
            sticky: true,
            opacity: 1.0,
          });
        });
      }
    },
  },
};
</script>

<style>
</style>