<template>
  <l-geo-json :visible="active" :geojson="data" :options="pointOptions" />
</template>

<script>
import L from "leaflet";
import * as Vue2Leaflet from "vue2-leaflet";
import { findRealParent } from "@/utils/utils.js";

export default {
  name: "MarkerLayer",
  components: { "l-geo-json": Vue2Leaflet.LGeoJson },
  props: {
    data: Array,
    name: String,
    label: String,
    styleFunction: {
      type: Function,
      default: () => {
        return {
          radius: 6,
          fillColor: "#d84545",
          color: "#af2828",
          weight: 1,
          opacity: 1,
          fillOpacity: 0.7,
        };
      },
    },
    onEachFeatureFunction: {
      type: Function,
      default: () => {
        return () => {};
      },
    },
  },
  data() {
    return { parentContainer: null, active: true };
  },
  created() {
    // Get the parent container and add this layer to it
    this.parentContainer = findRealParent(this.$parent);
    this.parentContainer.addLayer(this);
  },
  computed: {
    pointOptions() {
      return {
        onEachFeature: this.onEachFeatureFunction,
        pointToLayer: (feature, latlng) => {
          return L.circleMarker(latlng, this.styleFunction(feature));
        },
      };
    },
  },
  methods: {
    add() {
      this.active = true;
    },
    remove() {
      this.active = false;
    },
  },
};
</script>

<style>
</style>