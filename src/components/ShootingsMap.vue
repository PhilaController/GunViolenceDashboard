<template>
  <div id="shootingsMapContainer">
    <l-map
      :options="mapOptions"
      :zoom="zoom"
      :center="center"
      ref="shootingsMap"
      :style="`height: ${height}px; z-index: 1;`"
      class="map-pane"
    >
      <l-geo-json :geojson="geojson" :options="options" />
    </l-map>
  </div>
</template>

<script>
import L from "leaflet";
import * as Vue2Leaflet from "vue2-leaflet";
const esri = require("esri-leaflet");

function styleFunction(feature, i) {
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
    "l-tilelayer": Vue2Leaflet.LTileLayer,
    "l-circle-marker": Vue2Leaflet.LCircleMarker,
    "l-geo-json": Vue2Leaflet.LGeoJson,
  },
  props: ["geojson", "height"],
  data() {
    return {
      mapOptions: { maxZoom: 16, minZoom: 11, zoomControl: false },
      zoom: 12,
      center: [39.9854507, -75.15],
      homeBounds: null,
      layers: {},
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
    options() {
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
        // convert the "date_" field to a Javascript Date object
        let dt = feature.properties.date;

        // define the popup content
        let content = `<div>Victim's Age: ${feature.properties.age}</div>
            <div>Date: ${dt.toDateString()}</div>`;

        // bind the popup to the layer
        layer.bindTooltip(content, {
          permanent: false,
          sticky: true,
          opacity: 1.0,
        });
      };
    },
  },
  watch: {},
  mounted() {
    this.$nextTick(() => {
      // the leaflet basemap
      let map = this.$refs.shootingsMap.mapObject;

      // set zoom home bounds
      this.homeBounds = map.getBounds();

      //add zoom control with your options
      L.control
        .zoom({
          position: "topright",
        })
        .addTo(map);

      // add a home button to the control bar
      let button = $(`<a class="leaflet-control-zoom-in" title="Recenter Map" role="button" aria-label="Recenter Map">
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
      this.layers.cityLimits = esri.featureLayer({
        url:
          "https://services.arcgis.com/fLeGjb7u4uXqeF9q/arcgis/rest/services/City_Limits/FeatureServer/0",
        style: () => {
          return { fill: false, color: "#fff", weight: 4 };
        },
      });
      map.addLayer(this.layers.cityLimits);
    });
  },
  methods: {
    zoomHome() {
      this.$refs.shootingsMap.mapObject.flyToBounds(this.homeBounds);
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
}
.fa-home {
  color: #000;
}
</style>


