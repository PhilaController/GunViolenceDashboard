<template>
  <div></div>
</template>


<script>
import L from "leaflet";
import "leaflet.heat";
import { findRealParent } from "@/utils/utils.js";

export default {
  name: "HeatmapLayer",
  props: { data: Array, name: String, label: String },
  data() {
    return { parentContainer: null, layer: null };
  },
  created() {
    // Get the parent container and add this layer to it
    this.parentContainer = findRealParent(this.$parent);
    this.parentContainer.addLayer(this);
  },
  computed: {
    coords() {
      return this.data.map((feature) =>
        feature.geometry.coordinates.slice().reverse().concat([1.0])
      );
    },
  },
  methods: {
    add(map) {
      this.layer = L.heatLayer(this.coords, {
        radius: 25,
        minOpacity: this.data.length > 500 ? 0.1 : 0.4,
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
    remove(map) {
      if (this.layer !== null && map.hasLayer(this.layer))
        map.removeLayer(this.layer);
    },
  },
};
</script>

<style>
</style>