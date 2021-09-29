<template>
  <v-dialog v-model="downloadDialog" width="500" class="download-dialog">
    <template v-slot:activator="{ on, attrs }">
      <v-btn
        id="download-data-button"
        class="ml-5 mr-5"
        outlined
        color="white"
        dark
        :ripple="false"
        v-bind="attrs"
        v-on="on"
      >
        <i class="fas fa-download"></i
        ><span class="ml-3">Download Data</span></v-btn
      >
    </template>

    <v-card>
      <v-card-title class="text-h5 grey lighten-2">
        Download Data
      </v-card-title>

      <v-card-text>
        <!-- Selection -->
        <v-radio-group
          class="mt-5"
          label="Data Selection"
          v-model="selectionRadio"
          row
        >
          <v-radio
            v-for="(item, i) in selectionGroups"
            :key="item"
            :label="item"
            :value="i"
          ></v-radio>
        </v-radio-group>

        <!-- Download Format -->
        <v-radio-group label="Download Format" v-model="formatRadio" row>
          <v-radio
            v-for="(item, i) in formatGroups"
            :key="item"
            :label="item"
            :value="i"
          ></v-radio>
        </v-radio-group>

        <!-- Select for Aggregation Download -->
        <v-select
          id="aggregate-select"
          :items="aggLayerItems"
          label="Aggregate By"
          clearable
          v-model="selectedAgg"
        ></v-select>
      </v-card-text>

      <v-divider></v-divider>

      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="primary" text @click="downloadData"> Download </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import { downloadFile, jsonToCSV, jsonToGeoJson } from "@/tools";

export default {
  props: ["data", "filteredData", "aggLayers", "selectedYear"],
  data() {
    return {
      expandedPanels: [],
      downloadDialog: false,
      selectionRadio: 0,
      selectionGroups: ["Current Selection", `All ${this.selectedYear} Data`],
      formatRadio: 0,
      formatGroups: ["CSV", "GeoJSON"],
      columnHeaders: [
        "dc_key",
        "race",
        "sex",
        "age",
        "latino",
        "fatal",
        "date",
        "block_number",
        "street_name",
        "has_court_case",
        "zip",
        "council",
        "police",
        "hood",
        "school",
        "house_district",
        "lat",
        "lng",
      ],
      selectedAgg: null,
    };
  },
  computed: {
    aggLayerItems() {
      let out = [];
      for (let key in this.aggLayers) {
        out.push({ value: key, text: this.aggLayers[key] });
      }
      return out;
    },
  },
  watch: {
    downloadDialog(value) {
      if (value == false) {
        this.selectionRadio = 0;
        this.selectedAgg = null;
        this.formatRadio = 0;
      }
    },
  },
  methods: {
    downloadData() {
      // Determine the content to download
      let data = this.selectionRadio == 0 ? this.filteredData : this.data;

      //  Download specifics
      let fileName, contentType, content;

      //   Emit the agg event and return
      if (this.selectedAgg !== null) {
        this.$emit("download-agg", this.selectedAgg, this.formatRadio, data);
        this.downloadDialog = false;
        return;
      }

      //   CSV
      if (this.formatRadio === 0) {
        content = jsonToCSV(data, this.columnHeaders);
        fileName = `shooting-victims-data.csv`;
        contentType = "text/plain";
        // GeoJSON
      } else {
        content = jsonToGeoJson(data, this.columnHeaders);
        fileName = `shooting-victims-data.geojson`;
        contentType = "text/json";
      }

      // Download it
      downloadFile(content, contentType, fileName);

      // Reset and close the dialog
      this.downloadDialog = false;
    },
  },
};
</script>

<style>
</style>