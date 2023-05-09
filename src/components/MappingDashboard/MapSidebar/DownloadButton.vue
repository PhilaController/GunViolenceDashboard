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
          hide-details
        >
          <v-radio
            v-for="(item, i) in selectionGroups"
            :key="item"
            :label="item"
            :value="i"
          ></v-radio>
        </v-radio-group>

        <!-- Download Format -->
        <v-radio-group
          hide-details
          class="mt-5"
          label="Download Format"
          v-model="formatRadio"
          row
        >
          <v-radio
            v-for="(item, i) in formatGroups"
            :key="item"
            :label="item"
            :value="i"
          ></v-radio>
        </v-radio-group>

        <!-- Select for Aggregation Download -->
        <div id="aggregate-select-wrapper" v-if="overlayLayerNames.length > 0">
          <v-select
            id="aggregate-select"
            class="mb-5"
            :items="overlayLayerNames"
            label="Aggregate By (Optional)"
            clearable
            v-model="selectedAgg"
            hide-details
            :ripple="false"
          />
        </div>
      </v-card-text>

      <v-divider class="my-divider"></v-divider>

      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn
          color="primary"
          :ripple="false"
          text
          @click="handleDownloadClick"
        >
          Download
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";

export default defineComponent({
  props: {
    /**
     * The names of the overlay layers on the map
     */
    overlayLayerNames: { type: Array as PropType<string[]>, default: () => [] },
  },
  data() {
    return {
      /**
       * Is the dialog open?
       */
      downloadDialog: false,

      /**
       * Which selection radio button is selected?
       */
      selectionRadio: 0,

      /**
       * Includes or excludes filters
       */
      selectionGroups: ["Include Filters", "Ignore Filters"],

      /**
       * Which format radio button is selected?
       */
      formatRadio: 0,

      /**
       * CSV or GeoJSON
       */
      formatGroups: ["CSV", "GeoJSON"],

      /**
       * Is there a selected agg layer?
       */
      selectedAgg: null,
    };
  },
  computed: {
    /**
     * Overlay items
     */
    aggLayerItems(): { value: string; text: string }[] {
      let out = [];
      for (let key in this.overlayLayerNames) {
        out.push({ value: key, text: this.overlayLayerNames[key] });
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
    handleDownloadClick() {
      // Emit event with the parameters
      let params = {
        aggLayer: this.selectedAgg,
        ignoreFilters: this.selectionRadio == 1,
        outputType: this.formatGroups[this.formatRadio],
      };
      this.$emit("download-data", params);

      // Close the dialog
      this.downloadDialog = false;
    },
  },
});
</script>

<style>
#aggregate-select-wrapper {
  margin-top: 1.2rem;
}
</style>
