<template>
  <div class="filterable-map-sidebar">
    <!-- Show the overlay when map is loading -->
    <v-overlay :value="showOverlay" absolute opacity="0.5" color="#353d42" />

    <!--------------------------------------->
    <!------------ Sidebar header ----------->
    <!--------------------------------------->
    <div class="sidebar-header">
      <!-- Data size message -->
      <div id="data-size-section">
        <div class="data-size-message mt-3">
          Showing locations for
          <span style="color: #7ab5e5">{{ formatNumber(pointsOnMap) }}</span>
          {{ markerTitle }}<span v-if="pointsOnMap !== 1">s</span>
        </div>
        <div class="sidebar-note" v-bind:class="{ hide: missingPoints == 0 }">
          Note: {{ missingPoints }} {{ markerShortTitle
          }}<span v-if="missingPoints > 1">s</span>
          not shown due to missing locations
        </div>
      </div>

      <!-- Download and reset button -->
      <div
        id="buttons-section"
        class="d-flex justify-content-center flex-column align-items-center mt-5"
      >
        <!-- Download data -->
        <download-button
          :overlay-layer-names="overlayLayerNames"
          @download-data="$emit('download-data', $event)"
        />

        <!-- Reset all filters -->
        <v-btn
          id="reset-all-button"
          class="ml-5 mr-5 mt-3 mb-5"
          @click="resetAllFilters"
          outlined
          color="white"
          :disabled="!showResetAllButton"
          dark
          :ripple="false"
        >
          <i class="fas fa-undo"></i
          ><span class="ml-3">Reset All Filters</span></v-btn
        >
      </div>
    </div>

    <!-- Scrollable content -->
    <div class="sidebar-inner-content">
      <!--------------------------------------->
      <!-- Map Layers ------------------------->
      <!--------------------------------------->
      <v-container class="sidebar__layers">
        <div class="map-layers__inner" v-if="toggleableLayerNames.length > 1">
          <div class="text-center mt-3 sidebar-subtitle">Map Layers</div>
          <v-divider class="my-divider" />

          <!-- Checkboxes for layers -->
          <v-hover
            v-slot="{ hover }"
            v-for="layerName in toggleableLayerNames"
            :key="layerName"
          >
            <v-checkbox
              v-model="selectedLayers"
              :value="layerName"
              color="#7ab5e5"
              hide-details
              multiple
              dark
              dense
              :ripple="false"
              @click.native.capture="handleCheckboxClick"
              :disabled="selectedOverlay !== null"
            >
              <template v-slot:label>
                <div>
                  {{ layerName }}
                  <span
                    v-if="hover"
                    class="only-link"
                    v-on:click.stop="handleOnlyClickLayer($event, layerName)"
                    >only</span
                  >
                </div>
              </template>
            </v-checkbox>
          </v-hover>
        </div>

        <!--------------------------------------->
        <!-- Aggregation Layers ----------------->
        <!--------------------------------------->
        <div class="map-layers__overlay" v-if="overlayLayerNames.length > 0">
          <div id="aggregate-select-wrapper">
            <v-select
              id="aggregate-select"
              :items="overlayLayerNames"
              label="Aggregation Layer"
              hint="Choose a geography to aggregate the data by"
              persistent-hint
              clearable
              dark
              :ripple="false"
              v-model="selectedOverlay"
            />
          </div>

          <!-- Opacity slider -->
          <div class="d-flex flex-row align-items-center justify-content-start">
            <v-subheader class="pl-0" id="opacityLabel">Opacity</v-subheader>
            <vue-slider
              class="opacity-slider"
              :disabled="selectedOverlay === null"
              v-model="overlayOpacity"
              :lazy="true"
              :tooltip="'none'"
              :enableCross="false"
              @drag-end="
                $emit('update:opacity', selectedOverlay, overlayOpacity / 100)
              "
              width="50%"
              :clickable="false"
              :max="50"
              :min="0"
              aria-labelledby="opacityLabel"
            />
          </div>
        </div>
      </v-container>

      <!--------------------------------------->
      <!-- Filters Section ------------------->
      <!--------------------------------------->
      <v-container class="sidebar__filters">
        <div class="text-center sidebar-subtitle">Filters</div>
        <v-divider class="my-divider" />

        <v-expansion-panels accordion multiple dark v-model="expandedPanels">
          <!--------------------------------------->
          <!-- FILTER: Switches ------->
          <!--------------------------------------->
          <v-expansion-panel class="dark-theme">
            <v-expansion-panel-header
              hide-actions
              class="d-flex flex-column justify-content-center align-items-start"
            >
              <v-switch
                v-for="(item, i) in switchFilters"
                :key="`${item.name}-filter`"
                :class="i == 0 ? 'mt-0' : ''"
                v-model="selectedValues[item.name]"
                :label="item.label"
                :ripple="false"
                color="#7ab5e5"
                hide-details
                @change="handleFilterChange(item.name, $event)"
              />
            </v-expansion-panel-header>
          </v-expansion-panel>

          <!--------------------------------------->
          <!-- FILTER: Checkboxes ----------------->
          <!--------------------------------------->
          <v-expansion-panel
            v-for="item in checkboxFilters"
            class="dark-theme"
            :key="`${item.name}-panel`"
          >
            <v-expansion-panel-header
              ><div class="header-content">{{ item.label }}</div>
              <div
                v-if="showReset(item.name)"
                class="reset-link"
                @click.capture="handleResetClick($event, item.name)"
              >
                Reset
              </div>
            </v-expansion-panel-header>
            <v-expansion-panel-content class="my-checkbox-wrapper">
              <v-hover
                v-slot="{ hover }"
                v-for="category in item.categories"
                :key="`${item.name}-${category.value}`"
              >
                <v-checkbox
                  :value="category.value"
                  v-model="selectedValues[item.name]"
                  :style="getMinWidthForCheckboxFilter(item.ncol || 1)"
                  color="#7ab5e5"
                  hide-details
                  multiple
                  :ripple="false"
                  @click.native.capture="handleCheckboxClick"
                  @change="handleFilterChange(item.name, $event)"
                >
                  <template v-slot:label>
                    <div>
                      {{ category.text }}
                      <span
                        v-if="hover"
                        class="only-link"
                        v-on:click.stop="
                          handleOnlyClick($event, item.name, category.value)
                        "
                        >only</span
                      >
                    </div>
                  </template>
                </v-checkbox>
              </v-hover>
            </v-expansion-panel-content>
          </v-expansion-panel>

          <!--------------------------------------->
          <!-- FILTER: Sliders ------->
          <!--------------------------------------->
          <v-expansion-panel
            v-for="item in sliderFilters"
            class="dark-theme"
            :key="`${item.name}-panel`"
          >
            <v-expansion-panel-header
              ><div class="header-content">{{ item.label }}</div>
              <div
                v-if="showReset(item.name)"
                class="reset-link"
                @click.capture="handleResetClick($event, item.name)"
              >
                Reset
              </div>
            </v-expansion-panel-header>
            <v-expansion-panel-content>
              <!--Histogram  -->
              <SliderHistogramChart
                height="100"
                v-if="histograms[item.name] && selectedValues[item.name]"
                :width="getHistogramWidth()"
                :data="histograms[item.name]"
                :lower="selectedValues[item.name][0]"
                :upper="selectedValues[item.name][1]"
                :xmin="item.default[0]"
                :xmax="item.default[1]"
              />

              <!-- Slider -->
              <vue-slider
                :class="`${item.name}-slider`"
                v-model="selectedValues[item.name]"
                :min="item.default[0]"
                :max="item.default[1]"
                :lazy="true"
                tooltip="always"
                :enableCross="false"
                width="80%"
                :clickable="false"
                @drag-end="
                  handleFilterChange(item.name, selectedValues[item.name])
                "
                :tooltip-formatter="item.tooltip.formatter"
                :tooltip-placement="tooltipPlacements[item.name]"
              />

              <!-- Switch for unknown values -->
              <v-switch
                v-if="
                  Object.prototype.hasOwnProperty.call(
                    excludeMissingValues,
                    item.name
                  )
                "
                class="mt-5 pt-5"
                v-model="excludeMissingValues[item.name]"
                label="Exclude unknown"
                :ripple="false"
                color="#7ab5e5"
                hide-details
                @change="
                  handleFilterChange(item.name, selectedValues[item.name])
                "
              />
            </v-expansion-panel-content>
          </v-expansion-panel>
        </v-expansion-panels>
      </v-container>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";

// Internal
import SliderHistogramChart from "./SliderHistogramChart.vue";
import DownloadButton from "./DownloadButton.vue";

// Types
import {
  FilterConfig,
  CheckboxFilterConfig,
  SliderFilterConfig,
  SwitchFilterConfig,
} from "@/types/Filters";

// External
import VueSlider from "vue-slider-component";
import $ from "jquery";
import { format } from "d3-format";
import qs from "qs";

/**
 * Utility to decode the query string
 */
function queryStringDecoder(str: string, decoder: any, charset: string) {
  const strWithoutPlus = str.replace(/\+/g, " ");
  if (charset === "iso-8859-1") {
    // unescape never throws, no try...catch needed:
    return strWithoutPlus.replace(/%[0-9a-f]{2}/gi, unescape);
  }

  if (/^(\d+|\d*\.\d+)$/.test(str)) {
    return parseFloat(str);
  }

  const keywords: { [index: string]: any } = {
    true: true,
    false: false,
    null: null,
    undefined,
  };
  if (str in keywords) {
    return keywords[str];
  }

  // utf-8
  try {
    return decodeURIComponent(strWithoutPlus);
  } catch (e) {
    return strWithoutPlus;
  }
}

// Make objects indexable
type indexable = { [index: string]: any };

export default defineComponent({
  components: { VueSlider, SliderHistogramChart, DownloadButton },
  props: {
    /**
     * Array of configuration options different map filters
     */
    filters: { type: Array as PropType<FilterConfig[]>, required: true },

    /**
     * The default toggled layer names (shown on start)
     */
    defaultToggledLayerNames: {
      type: Array as PropType<string[]>,
      default: () => [],
    },

    /**
     * The names of the toggeable layers on the map
     */
    toggleableLayerNames: {
      type: Array as PropType<string[]>,
      default: () => [],
    },

    /**
     * The names of the overlay layers on the map
     */
    overlayLayerNames: { type: Array as PropType<string[]>, default: () => [] },

    /**
     * Total size of filtered data set
     */
    filteredSize: { type: Number, required: true },

    /**
     * Number of points on the map (non-null geometry)
     */
    pointsOnMap: { type: Number, required: true },

    /**
     * Keep track of histograms of each dimension
     */
    histograms: { type: Object, required: true },

    /**
     * Default opacity value for overlay layers
     */
    defaultOverlayOpacity: { type: Number, default: 50 },

    /**
     * Whether to show the overlay layer
     */
    showOverlay: { type: Boolean, required: true },

    /**
     * Title to use for markers
     */
    markerTitle: { type: String, required: true },

    /**
     * Short title to use for markers
     */
    markerShortTitle: { type: String, required: true },

    /**
     * Is the map ready
     */
    mapReady: { type: Boolean, required: true },
  },

  data() {
    return {
      /**
       * Which sidebar panels are expanded
       */
      expandedPanels: [] as number[],

      /**
       * Opacity of overlay layer
       */
      overlayOpacity: 50,

      /**
       * Selected layers
       */
      selectedLayers: [] as string[],

      /**
       * Selected overlay aggregation layer
       */
      selectedOverlay: null as null | string,

      /**
       * Selected values for each filter
       */
      selectedValues: {} as indexable,

      /**
       * Whether to exclude unknown values
       */
      excludeMissingValues: {} as indexable,

      /**
       * Placement of tooltip for each slider filter
       */
      tooltipPlacements: {} as indexable,

      /**
       * Save any initial query string parameters
       */
      initialQuery: {} as indexable,

      /**
       * Whether the filter is set to its default
       */
      isDefault: {} as indexable,

      /**
       * Has an "Only" button been clicked
       */
      onlyClick: false,
    };
  },

  /**
   * When mounted:
   *  - Set defaults
   *  - Parse initial query string
   *  - Initialize filters and sliders
   *  - Set default selected layers
   */
  mounted() {
    // Set default opacity for overlays
    this.overlayOpacity = this.defaultOverlayOpacity;

    // Get the initial filters passed via query string
    this.parseInitialQuery();

    // Initialize filters and sliders
    this.initializeFilters();
    this.initializeSliders();

    // Set the default selected layer
    this.selectedLayers = this.defaultToggledLayerNames;
  },

  watch: {
    /**
     * When the map is ready, update based on the initial query string
     */
    mapReady(isReady) {
      if (isReady) {
        // Get the initial filters
        let filters = this.initialQuery["f"];

        // Set any initial filters
        if (filters) {
          for (let f in filters) {
            this.selectedValues[f] = filters[f];
            this.handleFilterChange(f, filters[f]);
          }
        }

        // Initial exclude unknown values
        let exclude = this.initialQuery["excludeMissing"];
        if (exclude) {
          for (let e in exclude) {
            this.excludeMissingValues[e] = true;
            this.handleFilterChange(e, this.selectedValues[e]);
          }
        }

        // Initial layers
        let layers = this.initialQuery["layers"];
        if (layers) this.selectedLayers = layers;

        // Initial overlay
        let overlay = this.initialQuery["overlay"];
        if (overlay) this.selectedOverlay = overlay;
      }
    },

    /**
     * Watch for updates to the selected layers
     */
    selectedLayers(nextValue, prevValue) {
      // No updates if map isn't ready yet (values are default)
      if (this.mapReady === false) return;

      // These are new active layers
      for (let i = 0; i < nextValue.length; i++) {
        if (!prevValue.includes(nextValue[i])) {
          this.$emit("update:filter", "layer", {
            layerName: nextValue[i],
            show: true,
          });
        }
      }

      // Layers to remove
      for (let i = 0; i < prevValue.length; i++) {
        if (!nextValue.includes(prevValue[i])) {
          this.$emit("update:filter", "layer", {
            layerName: prevValue[i],
            show: false,
          });
        }
      }

      // Add query param to the path
      this.addQueryParam("layers", `${nextValue}`);
    },

    /**
     * Handle updates to the selected overlay layer
     */
    selectedOverlay(nextValue, prevValue) {
      // Do nothing if it didn't change
      if (prevValue === nextValue) return;

      // Remove old agg layer
      if (prevValue !== null)
        this.$emit("update:filter", "layer", {
          layerName: prevValue,
          show: false,
        });

      // No agg layers selected now
      if (nextValue == null) {
        // Restore any selected non-agg layers
        for (let i = 0; i < this.selectedLayers.length; i++) {
          this.$emit("update:filter", "layer", {
            layerName: this.selectedLayers[i],
            show: true,
          });
        }
      }
      // New agg layer selected, add new
      else {
        this.$emit("update:filter", "layer", {
          layerName: nextValue,
          show: true,
        });

        // New agg layer means we need to hide old selected layers from map
        if (prevValue === null) {
          for (let i = 0; i < this.selectedLayers.length; i++) {
            this.$emit("update:filter", "layer", {
              layerName: this.selectedLayers[i],
              show: false,
            });
          }
        }
      }

      // Add query param to the path
      if (nextValue !== null) this.addQueryParam("overlay", nextValue);
      else this.removeQueryParam("overlay");
    },
  },
  methods: {
    /**
     * Add the specified query parameter to the URL
     */
    addQueryParam(key: string, value: string) {
      // Copy existing query
      let q = Object.assign({}, this.$route.query);

      // Only update if it's different
      if (value !== this.$route.query[key]) {
        // Set and push
        q[key] = value;
        this.$router.push({ query: q }).catch((error) => {
          if (error.name !== "NavigationDuplicated") {
            throw error;
          }
        });
      }
    },

    /**
     * Remove a query parameter from the URL
     */
    removeQueryParam(key: string) {
      // Copy and delete
      let q = Object.assign({}, this.$route.query);

      // Update if it exists
      if (q[key]) {
        delete q[key];
        this.$router.push({ query: q }).catch((error) => {
          if (error.name !== "NavigationDuplicated") {
            throw error;
          }
        });
      }
    },

    /**
     * Parse the initial query string parameters
     */
    parseInitialQuery() {
      // The allowed keys
      let keys = ["layers", "overlay", "f", "excludeMissing"];

      // Parse each one
      for (let i = 0; i < keys.length; i++) {
        let key = keys[i];

        // Get the parsed value
        let value = this.$route.query[key] as string;
        if (value) {
          if (key == "overlay") this.initialQuery[key] = value;
          else if (key == "layers") this.initialQuery[key] = value.split(",");
          else
            this.initialQuery[key] = qs.parse(value, {
              ignoreQueryPrefix: true,
              arrayFormat: "bracket",
              decoder: queryStringDecoder,
            } as qs.IParseOptions);
        }
      }
    },

    /**
     * Based on sidebar width, get the width of the histogram
     */
    getHistogramWidth() {
      let width = $(".sidebar-inner-content").width();
      if (width) return (width - 48) * 0.85;
    },

    /**
     * Get the min-width css parameter for checkbox lists
     */
    getMinWidthForCheckboxFilter(ncol: number) {
      let p = 100 / ncol;
      return `min-width: ${p}%`;
    },

    /**
     * Initialize the filters
     */
    initializeFilters() {
      for (let i = 0; i < this.filters.length; i++) {
        // Set the default value
        let item = this.filters[i];
        this.$set(this.selectedValues, item.name, item.default);
        this.$set(this.isDefault, item.name, true);

        // Set the exclude unknown value
        if ("excludeMissing" in item && item.excludeMissing) {
          this.$set(this.excludeMissingValues, item.name, false);

          // Watch for changes
          this.$watch(
            () => this.excludeMissingValues[item.name],
            () => {
              // Update query string with non-default parameters
              let newValue = {} as indexable;
              for (let name in this.excludeMissingValues) {
                if (this.excludeMissingValues[name]) newValue[name] = true;
              }
              let newValueString = qs.stringify(newValue);

              // Update route with new query string
              if (newValueString !== this.$route.query["excludeMissing"]) {
                if (Object.keys(newValue).length > 0)
                  this.addQueryParam("excludeMissing", newValueString);
                else this.removeQueryParam("excludeMissing");
              }
            }
          );
        }

        // Watch each parameter
        this.$watch(
          () => this.selectedValues[item.name],
          (value) => {
            // Update default array
            this.$set(
              this.isDefault,
              item.name,
              !this.isNotDefault(item.default, value)
            );

            // Update query string with non-default parameters
            let newValue = {} as indexable;
            for (let name in this.selectedValues) {
              if (!this.isDefault[name])
                newValue[name] = this.selectedValues[name];
            }
            let newValueString = qs.stringify(newValue);

            // Update route with new query string
            if (newValueString !== this.$route.query["f"]) {
              if (Object.keys(newValue).length > 0)
                this.addQueryParam("f", newValueString);
              else this.removeQueryParam("f");
            }
          }
        );
      }
    },

    /**
     * Determine the slider tooltips based on slider width vs. default width
     */
    getTooltipPlacement(name: string) {
      // Values
      let value = this.selectedValues[name];
      let defaultValue = this.getDefaultValue(name);

      // Make sure it's an array
      if (Array.isArray(defaultValue)) {
        // We have two numbers
        defaultValue = defaultValue as number[];

        let width = defaultValue[1] - defaultValue[0];
        let f = (value[1] - value[0]) / width;
        if (f < 0.35) return ["top", "bottom"];
        else return ["bottom", "bottom"];
      }
    },

    /*------
    Initialize slider filters
    -------*/
    initializeSliders() {
      for (let i = 0; i < this.sliderFilters.length; i++) {
        let item = this.sliderFilters[i];

        // Set the default placement and make it reactive
        this.$set(
          this.tooltipPlacements,
          item.name,
          this.getTooltipPlacement(item.name)
        );

        // Update the placement when the value changes
        this.$watch(
          () => this.selectedValues[item.name],
          () => {
            this.$set(
              this.tooltipPlacements,
              item.name,
              this.getTooltipPlacement(item.name)
            );
          }
        );
      }
    },

    /**
     * Emit a filter event when filter changes
     */
    handleFilterChange(filterName: string, value: any) {
      // Include excluded values flag
      if (
        Object.prototype.hasOwnProperty.call(
          this.excludeMissingValues,
          filterName
        )
      ) {
        this.$emit("update:filter", filterName, {
          value: value,
          excludeMissing: this.excludeMissingValues[filterName],
        });
      }
      // Just send the updated value
      else this.$emit("update:filter", filterName, { value: value });
    },

    /**
     * Reset all of the filters to their default values
     */
    resetAllFilters() {
      // These are the filters that can be reset
      let filters = this.resetableFilters;

      // Keep track of those we reset
      let filtersToReset = [];

      // Loop over each available filter
      for (let i = 0; i < this.filters.length; i++) {
        let filter = this.filters[i];

        // Is this filter resetable?
        if (filters.indexOf(filter.name) > -1) {
          // Reset the selected value if it's not already the default
          if (!this.isDefault[filter.name]) {
            this.selectedValues[filter.name] = filter.default;
            filtersToReset.push(filter.name);
          }

          // Reset the exclude unknown value
          if ("excludeMissing" in filter && filter.excludeMissing) {
            this.excludeMissingValues[filter.name] = false;
            filtersToReset.push(filter.name);
          }
        }
      }

      // Send the filter update events
      filtersToReset.forEach((filterName) => {
        this.handleFilterChange(filterName, this.selectedValues[filterName]);
      });
    },

    /**
     * Check if the input value is the same as the default
     */
    isNotDefault(defaultValue: any, value: any) {
      // No value, then it's got to be default
      if (value == null || value == undefined) return false;

      // Object is an array
      if (Array.isArray(defaultValue)) {
        for (let i = 0; i < defaultValue.length; i++) {
          if (value.indexOf(defaultValue[i]) == -1) return true;
        }
        return false;
      } else return defaultValue !== value;
    },

    /**
     * Should we show the reset link for the specific filter
     */
    showReset(filterName: string) {
      // Test for exclude values
      if (
        Object.prototype.hasOwnProperty.call(
          this.excludeMissingValues,
          filterName
        )
      ) {
        if (this.excludeMissingValues[filterName]) return true;
      }

      // Test for default value
      return !this.isDefault[filterName];
    },

    /**
     * Handle the click on a checkbox
     */
    handleCheckboxClick(event: Event) {
      if (this.onlyClick) {
        event.stopPropagation();
        event.preventDefault();
        this.onlyClick = false;
      }
    },

    /**
     * Handle the click on a reset link
     */
    handleResetClick(event: Event, filterName: string) {
      // Stop button from expanding
      event.stopPropagation();
      event.preventDefault();
      this.resetFilter(filterName);
    },

    /**
     * Reset the specified filter
     */
    resetFilter(filterName: string) {
      // Reset filter
      this.selectedValues[filterName] = this.getDefaultValue(filterName);

      // Reset the exclude unknown value
      if (
        Object.prototype.hasOwnProperty.call(
          this.excludeMissingValues,
          filterName
        )
      ) {
        this.excludeMissingValues[filterName] = false;
      }

      // Handle filter value change
      this.handleFilterChange(filterName, this.selectedValues[filterName]);
    },

    /**
     * Get the default value
     */
    getDefaultValue(filterName: string) {
      let filter = this.filters.find((filter) => filter.name === filterName);
      if (filter) return filter.default;
    },

    /**
     * Handle click to the "Only" button
     */
    handleOnlyClick(event: Event, filterName: string, value: any) {
      this.onlyClick = true;
      this.selectedValues[filterName] = [value];
      this.handleFilterChange(filterName, [value]);
    },

    /**
     * Handle click to the "Only" button for layers
     */
    handleOnlyClickLayer(event: Event, value: any) {
      this.onlyClick = true;
      this.selectedLayers = [value];
    },

    /**
     * Utility to format a number
     */
    formatNumber(d: number) {
      return format(",.0f")(d);
    },
  },

  computed: {
    /**
     * Determine which filters can be reset
     */
    resetableFilters(): string[] {
      let filters = [
        this.switchFilters,
        this.checkboxFilters,
        this.sliderFilters,
      ];
      let out = [];
      for (let i = 0; i < filters.length; i++) {
        for (let j = 0; j < filters[i].length; j++) {
          out.push(filters[i][j].name);
        }
      }
      return out;
    },

    /**
     * The switch filters
     */
    switchFilters(): SwitchFilterConfig[] {
      return this.filters.filter(
        (d) => d.kind == "switch"
      ) as SwitchFilterConfig[];
    },

    /**
     * The checkbox filters
     */
    checkboxFilters(): CheckboxFilterConfig<number | string>[] {
      return this.filters.filter(
        (d) => d.kind == "checkbox"
      ) as CheckboxFilterConfig<number | string>[];
    },

    /**
     * The slider filters
     */
    sliderFilters(): SliderFilterConfig[] {
      return this.filters.filter(
        (d) => d.kind == "slider"
      ) as SliderFilterConfig[];
    },

    /**
     * Should we show the reset all button?
     */
    showResetAllButton() {
      for (let i = 0; i < this.resetableFilters.length; i++) {
        let name = this.resetableFilters[i];
        if (this.showReset(name)) return true;
      }
      return false;
    },

    /**
     * How many points are missing?
     */
    missingPoints(): number {
      return this.filteredSize - this.pointsOnMap;
    },
  },
});
</script>

<style>
@import "~vue-slider-component/theme/default.css";

.sidebar-subtitle {
  font-size: 1.6rem;
  font-weight: 500;
  margin-bottom: 0.5rem;
}

.sidebar__filters {
  margin-top: 0px !important;
}

.sidebar__layers {
  padding: 16px 24px !important;
}
input#aggregate-select:focus {
  background-color: transparent;
}
#aggregate-select-wrapper {
  margin-top: 1.5rem;
}
.my-divider {
  border-top: 2px solid #7ab5e5 !important;
  margin: auto !important;
}
.sidebar-inner-content .v-expansion-panel:before {
  box-shadow: none !important;
}

#opacityLabel {
  color: rgba(255, 255, 255, 0.7);
}
.v-input--radio-group {
  margin-top: 0px !important;
  padding-top: 0px !important;
}
/* Reset all button */
#reset-all-button,
#download-data-button {
  width: 100%;
  max-width: 300px;
}

/* Total sidebar */
.filterable-map-sidebar {
  width: 30%;
  min-width: 300px;
  height: 800px;
  display: flex;
  flex-direction: column;
  border-left: 5px solid #868b8e;
  position: relative;
}
@media only screen and (max-width: 767px) {
  .filterable-map-sidebar {
    width: 100%;
    height: 800px;
  }
}
.sidebar-inner-content {
  background-color: #353d42;
  overflow-y: scroll;
}

/* Header section */
.sidebar-header {
  text-align: center;
  padding: 5px;
}
.data-size-message {
  font-style: italic;
  padding-bottom: 5px;
}
.sidebar-note {
  font-size: 0.8rem;
  font-style: italic;
  padding-top: 0.25rem;
}

#buttons-section {
  border-bottom: 5px solid #868b8e;
}

/* Panel config */
.sidebar-inner-content button:focus {
  outline: 0 !important;
  background-color: #353d42 !important;
  border-color: #353d42 !important;
  color: #fff !important;
  -webkit-tap-highlight-color: #fff !important;
}

.sidebar-inner-content .v-expansion-panel-header {
  font-size: 1.1rem !important;
  display: flex;
}
.sidebar-inner-content .v-expansion-panel-header:hover {
  background-color: #353d42 !important;
  border-color: #353d42 !important;
  color: #fff;
}

.dark-theme {
  background-color: #353d42 !important;
  border-color: #353d42 !important;
  color: #fff !important;
}

/* Links */
.reset-link {
  color: #7ab5e5;
  font-weight: 500;
  text-align: right;
  margin-right: 1rem;
}
.reset-link:hover {
  text-decoration: underline;
}
.only-link {
  color: #fff;
  font-weight: 500;
}
.only-link:hover {
  text-decoration: underline;
}

.v-label {
  margin-bottom: 0rem !important;
}

/* Sliders */
[class$="-slider"] {
  margin-top: 30px;
  margin-bottom: 40px;
  margin-left: auto;
  margin-right: auto;
}
.vue-slider-dot-tooltip-inner {
  font-size: 1.2rem;
}
.vue-slider-rail {
  background-color: #ccc;
}
.vue-slider-dot-tooltip-inner {
  background-color: #868b8e;
  border-color: #868b8e;
}
.vue-slider-process {
  background-color: #7ab5e5;
}

.sidebar-inner-content .v-expansion-panel:last-of-type {
  padding-bottom: 30px;
}

.hide {
  opacity: 0;
}

@media only screen and (max-width: 767px) {
  .filterable-map-sidebar {
    border-top: 5px solid #868b8e;
    border-left-width: 0px;
  }
}

.my-checkbox-wrapper .v-expansion-panel-content__wrap {
  display: flex;
  flex-wrap: wrap;
}
.my-checkbox {
  min-width: 50%;
}
</style>
