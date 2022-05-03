<template>
  <div class="filterable-map-sidebar">
    <!--------------------------------------->
    <!------------ Sidebar header ----------->
    <!--------------------------------------->
    <div class="sidebar-header">
      <!-- Slot for the header -->
      <slot name="header">
        <!-- Data size message -->
        <div id="data-size-section">
          <div class="data-size-message mt-3">
            Showing locations for
            <span style="color: #7ab5e5">{{ formatNumber(pointsOnMap) }}</span>
            shooting victim<span v-if="pointsOnMap !== 1">s</span>
          </div>
          <div class="sidebar-note" v-bind:class="{ hide: missingPoints == 0 }">
            Note: {{ missingPoints }} victim<span v-if="missingPoints > 1"
              >s</span
            >
            not shown due to missing locations
          </div>
        </div>

        <!-- Download and reset button -->
        <div
          id="buttons-section"
          class="
            d-flex
            justify-content-center
            flex-column
            align-items-center
            mt-5
          "
        >
          <!-- Download data -->
          <DownloadButton
            :overlayLayerNames="overlayLayerNames"
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
      </slot>
    </div>

    <!-- Scrollable content -->
    <div class="sidebar-inner-content">
      <!--------------------------------------->
      <!-- Map Layers ------------------------->
      <!--------------------------------------->
      <v-container id="map-layers-section">
        <div class="map-layers__inner" v-if="layerNames.length > 1">
          <div class="text-center mt-3 sidebar-subtitle">Map Layers</div>
          <v-divider class="my-divider" />

          <!-- Checkboxes for layers -->
          <v-hover v-for="layerName in layerNames" :key="layerName">
            <v-checkbox
              slot-scope="{ hover }"
              :value="layerName"
              v-model="selectedLayers"
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
      <v-container id="filters-section">
        <div class="text-center sidebar-subtitle">Filters</div>
        <v-divider class="my-divider" />

        <v-expansion-panels accordion multiple dark v-model="expandedPanels">
          <!--------------------------------------->
          <!-- FILTER: Switches ------->
          <!--------------------------------------->
          <v-expansion-panel class="dark-theme">
            <v-expansion-panel-header
              hide-actions
              class="
                d-flex
                flex-column
                justify-content-center
                align-items-start
              "
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
                v-if="showReset(item.default, item.name)"
                class="reset-link"
                @click.capture="handleResetClick($event, item.name)"
              >
                Reset
              </div>
            </v-expansion-panel-header>
            <v-expansion-panel-content class="my-checkbox-wrapper">
              <v-hover
                v-for="category in item.categories"
                :key="`${item.name}-${category.value}`"
              >
                <v-checkbox
                  slot-scope="{ hover }"
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
                v-if="showReset(item.default, item.name)"
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
                    excludeUnknownValues,
                    item.name
                  )
                "
                class="mt-5 pt-5"
                v-model="excludeUnknownValues[item.name]"
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

<script>
import SliderHistogramChart from "./SliderHistogramChart";
import DownloadButton from "./DownloadButton";
import VueSlider from "vue-slider-component";
import $ from "jquery";
import { format } from "d3-format";

export default {
  components: { VueSlider, SliderHistogramChart, DownloadButton },
  props: [
    "filters",
    "layerNamesDefault",
    "layerNames",
    "overlayLayerNames",
    "filteredSize",
    "pointsOnMap",
    "histograms",
    "defaultOverlayOpacity",
  ],
  data() {
    return {
      expandedPanels: [], // Which sidebar panels are expanded
      overlayOpacity: 50, // Opacity of overlay layer

      // Filter values
      selectedLayers: undefined, // Selected layers
      selectedOverlay: null, // Selected aggregation layer
      selectedValues: {}, // Selected values for each filter
      excludeUnknownValues: {}, // Whether to exclude unknown values
      tooltipPlacements: {}, // Placement of tooltip for each slider filter
    };
  },
  mounted() {
    // Set default opacity for overlays
    this.overlayOpacity = this.defaultOverlayOpacity;

    // Initialize filters and sliders
    this.initializeFilters();
    this.initializeSliders();

    // Set the default selected layer
    this.selectedLayers = this.layerNamesDefault;
  },
  watch: {
    /* Handle updates to the selected layers */
    selectedLayers(nextValue, prevValue) {
      // No updates needed the first time (values are default)
      if (prevValue === undefined) return;

      // These are new active layers
      for (let i = 0; i < nextValue.length; i++) {
        if (!prevValue.includes(nextValue[i])) {
          this.$emit("update:filter", "layer", nextValue[i], true);
        }
      }

      // Layers to remove
      for (let i = 0; i < prevValue.length; i++) {
        if (!nextValue.includes(prevValue[i])) {
          this.$emit("update:filter", "layer", prevValue[i], false);
        }
      }
    },

    /* Handle updates to the selected agg layers */
    selectedOverlay(nextValue, prevValue) {
      // Do nothing if it didn't change
      if (prevValue === nextValue) return;

      // Remove old agg layer
      if (prevValue !== null)
        this.$emit("update:filter", "layer", prevValue, false);

      // No agg layers selected now
      if (nextValue == null) {
        // Restore any selected non-agg layers
        for (let i = 0; i < this.selectedLayers.length; i++) {
          this.$emit("update:filter", "layer", this.selectedLayers[i], true);
        }
      }
      // New agg layer selected, add new
      else {
        this.$emit("update:filter", "layer", nextValue, true);

        // New agg layer means we need to hide old selected layers from map
        if (prevValue === null) {
          for (let i = 0; i < this.selectedLayers.length; i++) {
            this.$emit("update:filter", "layer", this.selectedLayers[i], false);
          }
        }
      }
    },
  },
  methods: {
    /* Get the width of the histogram */
    getHistogramWidth() {
      return ($(".sidebar-inner-content").width() - 48) * 0.85;
    },

    /* Get the min width of the checkbox filter*/
    getMinWidthForCheckboxFilter(ncol) {
      let p = 100 / ncol;
      return `min-width: ${p}%`;
    },

    /* Set default values for each filter */
    initializeFilters() {
      for (let i = 0; i < this.filters.length; i++) {
        // Set the default value
        let item = this.filters[i];
        this.$set(this.selectedValues, item.name, item.default);

        // Set the exclude unknown value
        if (item.excludeUnknown) {
          this.$set(this.excludeUnknownValues, item.name, false);
        }
      }
    },

    getTooltipPlacement(name) {
      let value = this.selectedValues[name];
      let defaultValue = this.getDefaultValue(name);

      let width = defaultValue[1] - defaultValue[0];
      let f = (value[1] - value[0]) / width;
      if (f < 0.35) return ["top", "bottom"];
      else return ["bottom", "bottom"];
    },

    /* Initialize each slider filter */
    initializeSliders() {
      // Loop over each slider tooltip
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

    /* Handle the filter change */
    handleFilterChange(filterName, value) {
      // Include excluded values flag
      if (
        Object.prototype.hasOwnProperty.call(
          this.excludeUnknownValues,
          filterName
        )
      ) {
        this.$emit(
          "update:filter",
          filterName,
          value,
          this.excludeUnknownValues[filterName]
        );
      }
      // Just send the updated value
      else this.$emit("update:filter", filterName, value);
    },

    /* Reset all of the filters */
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
          let notDefault = this.isNotDefault(
            filter.default,
            this.selectedValues[filter.name]
          );
          if (notDefault) {
            this.selectedValues[filter.name] = filter.default;
            filtersToReset.push(filter.name);
          }

          // Reset the exclude unknown value
          if (filter.excludeUnknown) {
            this.excludeUnknownValues[filter.name] = false;
            filtersToReset.push(filter.name);
          }
        }
      }

      // Send the filter update events
      filtersToReset.forEach((filterName) => {
        this.handleFilterChange(filterName, this.selectedValues[filterName]);
      });
    },

    /* Check if the value is not the default */
    isNotDefault(defaultValue, value) {
      if (value == null || value == undefined) return false;

      // Object is an array
      if (Array.isArray(defaultValue)) {
        for (let i = 0; i < defaultValue.length; i++) {
          if (value.indexOf(defaultValue[i]) == -1) return true;
        }
        return false;
      } else return defaultValue !== value;
    },

    /* Whether to show the reset button */
    showReset(defaultValue, filterName) {
      // Test for exclude values
      if (
        Object.prototype.hasOwnProperty.call(
          this.excludeUnknownValues,
          filterName
        )
      ) {
        if (this.excludeUnknownValues[filterName]) return true;
      }

      // Test for default value
      return this.isNotDefault(defaultValue, this.selectedValues[filterName]);
    },

    /* Handle the click on a checkbox */
    handleCheckboxClick(event) {
      if (this.onlyClick) {
        event.stopPropagation();
        event.preventDefault();
        this.onlyClick = false;
      }
    },

    /* Handle the reset click */
    handleResetClick(event, filterName) {
      // Stop button from expanding
      event.stopPropagation();
      event.preventDefault();
      this.resetFilter(filterName);
    },

    /* Reset a filter */
    resetFilter(filterName) {
      // Reset filter
      this.selectedValues[filterName] = this.getDefaultValue(filterName);

      // Reset the exclude unknown value
      if (
        Object.prototype.hasOwnProperty.call(
          this.excludeUnknownValues,
          filterName
        )
      ) {
        this.excludeUnknownValues[filterName] = false;
      }

      // Handle filter value change
      this.handleFilterChange(filterName, this.selectedValues[filterName]);
    },

    /* Get the default value */
    getDefaultValue(filterName) {
      return this.filters.find((filter) => filter.name === filterName).default;
    },

    /* Handle click to the "Only" button */
    handleOnlyClick(event, filterName, value) {
      this.onlyClick = true;
      this.selectedValues[filterName] = [value];
      this.handleFilterChange(filterName, [value]);
    },

    /* Handle click to the "Only" button for layers */
    handleOnlyClickLayer(event, value) {
      this.onlyClick = true;
      this.selectedLayers = [value];
    },

    /* Format number */
    formatNumber(d) {
      return format(",.0f")(d);
    },
  },
  computed: {
    /* Get the filters that can be reset */
    resetableFilters() {
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

    /* Switch filters */
    switchFilters() {
      return this.filters.filter((d) => d.kind == "switch");
    },

    /* Checkbox filters */
    checkboxFilters() {
      return this.filters.filter((d) => d.kind == "checkbox");
    },

    /* Slider filters */
    sliderFilters() {
      return this.filters.filter((d) => d.kind == "slider");
    },

    /* Should we show the reset all button */
    showResetAllButton() {
      for (let i = 0; i < this.resetableFilters.length; i++) {
        let name = this.resetableFilters[i];
        if (this.showReset(this.getDefaultValue(name), name)) return true;
      }
      return false;
    },

    /* How many points are missing? */
    missingPoints() {
      return this.filteredSize - this.pointsOnMap;
    },
  },
};
</script>

<style>
@import "~vue-slider-component/theme/default.css";

.sidebar-subtitle {
  font-size: 1.6rem;
  font-weight: 500;
  margin-bottom: 0.5rem;
}
#filters-section {
  margin-top: 0px;
}
#map-layers-section {
  padding: 16px 24px;
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