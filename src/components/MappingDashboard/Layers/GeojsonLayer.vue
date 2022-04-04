<template>
  <div></div>
</template>

<script>
export default {
  name: "GeojsonLayer",
  // streetCounts() {
  //   if (this.isActive("streets")) {
  //     return rollup(
  //       this.geojson.filter((el) => el.properties.segment_id !== ""),
  //       (v) => v.length,
  //       (d) => d.properties.segment_id
  //     );
  //   } else return null;
  // },
  // uniqueStreets() {
  //   if (this.streetCounts) return Array.from(this.streetCounts.keys());
  //   else return null;
  // },
  // scale() {
  //   return scaleLog()
  //     .domain([this.minStreetCount, this.maxStreetCount])
  //     .range([0.5, 1]);
  // },

  // minStreetCount() {
  //   if (this.streetCounts) return min(this.streetCounts.values());
  //   else return null;
  // },
  // maxStreetCount() {
  //   if (this.streetCounts) return max(this.streetCounts.values());
  //   else return null;
  // },
  methods: {
    streetStyleFunction(feature) {
      return {
        weight: this.getWeightBasedOnZoom(),
        color: this.getColor(feature.properties),
      };
    },

    onEachFeatureStreets(feature, layer) {
      layer.bindTooltip(this.getStreetTooltip(layer.feature.properties), {
        permanent: false,
        sticky: true,
        opacity: 1.0,
      });
    },
    getColor(props) {
      return SCALE(this.scale(this.streetCounts.get(`${props.segment_id}`)));
    },
    addStreetHotSpots() {
      let map = this.mapObject;
      if (map.hasLayer(this.layers.streets))
        map.removeLayer(this.layers.streets);

      // Update legend color scale
      this.legendColorScale = interpolatePlasma;
      this.legendRange = [0.5, 1.0];

      this.layers.streets = esri.featureLayer({
        url: this.streetsURL,
        precision: 5,
        simplifyFactor: 0.5,
        where: `segment_id in (${this.uniqueStreets})`,
        onEachFeature: this.onEachFeatureStreets,
        style: this.streetStyleFunction,
        pane: "streets",
      });

      // when done loading, hide the spinner
      this.layers.streets.on("loading", () => {
        this.isLoading = true;
      });
      this.layers.streets.on("load", () => {
        this.isLoading = false;
      });

      // Add to map
      this.layers.streets.addTo(map);
    },
    getStreetTooltip(data) {
      // Get the count for this street
      let count = this.streetCounts.get(`${data.segment_id}`);

      let text = `<div class="tooltip-title">${data.block_number} ${data.street_name}</div>
                  <table class="w-100">
                  <tbody>`;
      // Add shootings count
      text += ` <tr class="tooltip-line">
                <td class="tooltip-line-header">Shooting Victims</td>
              <td>${count.toFixed(0)}</td>
              </tr>`;

      text += `</tbody>
              </table>`;
      return text;
    },
  },
};
</script>

<style>
</style>