<template>
  <div class="shootings-map-sidebar">
    <div class="sidebar-header">
      <div class="data-size-message mt-3">
        Showing locations for
        <span style="color: #7ab5e5">{{ formatNumber(pointsOnMap) }}</span>
        shooting victim<span v-if="pointsOnMap !== 1">s</span>
      </div>
      <!-- <div class="sidebar-note" v-bind:class="{ hide: missingPoints == 0 }">
        Note: {{ missingPoints }} victim<span v-if="missingPoints > 1">s</span>
        not shown due to missing locations
      </div> -->
    </div>

    <!-- Scrollable content -->
    <div class="sidebar-inner-content">
      <!-- All the panels -->
      <v-expansion-panels flat accordion multiple dark>
        <!-- Fatal vs Nonfatal -->
        <v-expansion-panel class="dark-theme">
          <v-expansion-panel-header
            hide-actions
            style="
              display: flex;
              flex-direction: column;
              justify-content: center;
              align-items: flex-start;
            "
          >
            <v-switch
              v-model="fatalOnly"
              label="Fatal shootings only"
              :ripple="false"
              color="#7ab5e5"
              hide-details
            ></v-switch>

            <v-switch
              v-model="arrestsOnly"
              label="Incidents with court cases"
              :ripple="false"
              color="#7ab5e5"
              hide-details
            ></v-switch>
          </v-expansion-panel-header>
        </v-expansion-panel>

        <!-- Map Layers -->
        <v-expansion-panel class="dark-theme">
          <v-expansion-panel-header>Map Layers</v-expansion-panel-header>
          <v-expansion-panel-content>
            <v-hover v-for="layerName in allowedLayers" :key="layerName">
              <v-checkbox
                slot-scope="{ hover }"
                :value="layerName"
                v-model="selectedLayers"
                color="#7ab5e5"
                hide-details
                multiple
                :ripple="false"
                :disabled="mapLayersDisabled"
                @click.native.capture="handleCheckboxClick"
              >
                <template v-slot:label>
                  <div>
                    {{ getAlias(layerName, "layer") }}
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
          </v-expansion-panel-content>
        </v-expansion-panel>

        <!-- Aggregation Layers -->
        <v-expansion-panel class="dark-theme">
          <v-expansion-panel-header
            ><div class="header-content">Aggregation Layers</div>
            <div
              v-if="showReset('aggLayer')"
              class="reset-link"
              @click.capture="handleResetClick($event, 'aggLayer')"
            >
              Reset
            </div>
          </v-expansion-panel-header>
          <v-expansion-panel-content>
            <v-radio-group v-model="selectedAggLayers">
              <v-radio
                v-for="layerName in allowedAggLayers"
                :key="layerName"
                :label="getAlias(layerName, 'aggLayer')"
                :value="layerName"
                color="#7ab5e5"
                hide-details
                :ripple="false"
                @click.native.capture="handleCheckboxClick"
              >
              </v-radio>
            </v-radio-group>
          </v-expansion-panel-content>
        </v-expansion-panel>

        <!-- Date Filter -->
        <v-expansion-panel class="dark-theme">
          <v-expansion-panel-header
            ><div class="header-content">Date</div>
            <div
              v-if="showReset('date')"
              class="reset-link"
              @click.capture="handleResetClick($event, 'date')"
            >
              Reset
            </div>
          </v-expansion-panel-header>
          <v-expansion-panel-content>
            <vue-slider
              class="date-slider"
              v-model="dateRange"
              :min="allowedDateRange[0]"
              :max="allowedDateRange[1]"
              :lazy="true"
              :tooltip-placement="dateTooltipPlacement"
              tooltip="always"
              :enableCross="false"
              @drag-end="sendDateUpdate"
              :tooltip-formatter="formatSliderTooltip"
              width="80%"
              :clickable="false"
            ></vue-slider>
          </v-expansion-panel-content>
        </v-expansion-panel>

        <!-- Time Filter -->
        <v-expansion-panel class="dark-theme">
          <v-expansion-panel-header
            ><div class="header-content">Time</div>
            <div
              v-if="showReset('time')"
              class="reset-link"
              @click.capture="handleResetClick($event, 'time')"
            >
              Reset
            </div>
          </v-expansion-panel-header>
          <v-expansion-panel-content>
            <vue-slider
              class="time-slider"
              v-model="timeRange"
              :min="allowedTimeRange[0]"
              :max="allowedTimeRange[1]"
              :lazy="true"
              tooltip="always"
              :enableCross="false"
              @drag-end="sendTimeUpdate"
              :tooltip-placement="timeTooltipPlacement"
              :tooltip-formatter="formatTimeSliderTooltip"
              width="80%"
              :clickable="false"
            ></vue-slider>
          </v-expansion-panel-content>
        </v-expansion-panel>

        <!-- Race/Ethnicity -->
        <v-expansion-panel class="dark-theme">
          <v-expansion-panel-header
            ><div class="header-content">Race/Ethnicity</div>
            <div
              v-if="showReset('race')"
              class="reset-link"
              @click.capture="handleResetClick($event, 'race')"
            >
              Reset
            </div>
          </v-expansion-panel-header>
          <v-expansion-panel-content>
            <v-hover v-for="raceValue in allowedRaces" :key="raceValue">
              <v-checkbox
                slot-scope="{ hover }"
                :value="raceValue"
                v-model="selectedRaces"
                color="#7ab5e5"
                hide-details
                multiple
                :ripple="false"
                @click.native.capture="handleCheckboxClick"
              >
                <template v-slot:label>
                  <div>
                    {{ getAlias(raceValue, "race") }}
                    <span
                      v-if="hover"
                      class="only-link"
                      v-on:click.stop="handleOnlyClickRace($event, raceValue)"
                      >only</span
                    >
                  </div>
                </template>
              </v-checkbox>
            </v-hover>
          </v-expansion-panel-content>
        </v-expansion-panel>

        <!-- Gender -->
        <v-expansion-panel class="dark-theme">
          <v-expansion-panel-header
            ><div class="header-content">Gender</div>
            <div
              v-if="showReset('sex')"
              class="reset-link"
              @click.capture="handleResetClick($event, 'sex')"
            >
              Reset
            </div>
          </v-expansion-panel-header>
          <v-expansion-panel-content>
            <v-hover v-for="genderValue in allowedGenders" :key="genderValue">
              <v-checkbox
                slot-scope="{ hover }"
                :value="genderValue"
                v-model="selectedGenders"
                color="#7ab5e5"
                hide-details
                multiple
                :ripple="false"
                @click.native.capture="handleCheckboxClick"
              >
                <template v-slot:label>
                  <div>
                    {{ getAlias(genderValue, "gender") }}
                    <span
                      v-if="hover"
                      class="only-link"
                      v-on:click.stop="
                        handleOnlyClickGender($event, genderValue)
                      "
                      >only</span
                    >
                  </div>
                </template>
              </v-checkbox>
            </v-hover>
          </v-expansion-panel-content>
        </v-expansion-panel>

        <!-- Age Filter -->
        <v-expansion-panel class="dark-theme">
          <v-expansion-panel-header
            ><div class="header-content">Age</div>
            <div
              v-if="showReset('age')"
              class="reset-link"
              @click.capture="handleResetClick($event, 'age')"
            >
              Reset
            </div>
          </v-expansion-panel-header>
          <v-expansion-panel-content>
            <vue-slider
              class="age-slider"
              v-model="ageRange"
              :min="allowedAgeRange[0]"
              :max="allowedAgeRange[1]"
              :lazy="true"
              :tooltip-placement="ageTooltipPlacement"
              tooltip="always"
              :enableCross="false"
              @drag-end="sendAgeUpdate"
              width="80%"
              :clickable="false"
            ></vue-slider>
          </v-expansion-panel-content>
        </v-expansion-panel>
      </v-expansion-panels>

      <v-btn
        class="reset-all-button"
        @click="resetAllFilters"
        outlined
        color="white"
        :disabled="showResetAllButton"
        dark
        :ripple="false"
      >
        <i class="fas fa-undo"></i
        ><span class="ml-3">Reset All Filters</span></v-btn
      >
    </div>
  </div>
</template>

<script>
import {
  getDayOfYear,
  dateFromDay,
  formatDate,
  msToTimeString,
} from "@/tools.js";
import {
  VExpansionPanels,
  VExpansionPanel,
  VExpansionPanelHeader,
  VCheckbox,
  VHover,
  VSwitch,
  VRadio,
  VRadioGroup,
} from "vuetify/lib";
import VueSlider from "vue-slider-component";
import "vue-slider-component/theme/default.css";

export default {
  props: [
    "pointsOnMap",
    "filteredSize",
    "selectedYear",
    "allowedAgeRange",
    "allowedDateRange",
    "currentFilters",
  ],
  components: {
    VExpansionPanels,
    VExpansionPanel,
    VExpansionPanelHeader,
    VCheckbox,
    VHover,
    VueSlider,
    VSwitch,
    VRadioGroup,
    VRadio,
  },
  data() {
    return {
      scrollable: true,
      openPanels: [0],
      onlyClick: false,
      allowedRaces: ["W", "B", "H", "Other/Unknown"],
      allowedGenders: ["M", "F"],
      allowedTimeRange: [0, 86399999],
      allowedLayers: ["points", "heatmap", "streets"],
      allowedAggLayers: ["council", "zip", "police", "hood"],
      fatalOnly: false,
      arrestsOnly: false,
      selectedLayers: ["points"],
      selectedAggLayers: null,
      selectedRaces: ["W", "B", "H", "Other/Unknown"],
      selectedGenders: ["M", "F"],
      mapLayersDisabled: false,
      ageRange: [0, 100],
      dateRange: [1, 366],
      timeRange: [0, 86399999],
      aliases: {
        race: {
          W: "White (Non-Hispanic)",
          B: "Black (Non-Hispanic)",
          H: "Hispanic (Black or White)",
        },
        gender: {
          M: "Male",
          F: "Female",
        },
        layer: {
          points: "Point locations",
          heatmap: "Heat map",
          streets: "Hot spots by street block",
        },
        aggLayer: {
          council: "Council District",
          police: "Police District",
          zip: "ZIP Code",
          hood: "Neighborhood",
        },
      },
    };
  },

  watch: {
    allowedAgeRange(nextValue, prevValue) {
      this.ageRange = nextValue;
    },
    allowedDateRange(nextValue, prevValue) {
      this.dateRange = nextValue;
    },
    fatalOnly(nextValue, prevValue) {
      this.$emit("update-fatal", nextValue);
    },
    arrestsOnly(nextValue, prevValue) {
      this.$emit("update-arrests", nextValue);
    },
    selectedLayers(nextValue, prevValue) {
      this.$emit("update-layer", nextValue);
    },
    selectedAggLayers(nextValue, prevValue) {
      this.$emit("update-agg-layer", nextValue);

      if (nextValue !== null) {
        this.mapLayersDisabled = true;
        if (this.selectedLayers.length > 0) this.selectedLayers = [];
      } else this.mapLayersDisabled = false;
    },
    selectedRaces(nextValue, prevValue) {
      this.$emit("update-race", nextValue);
    },
    selectedGenders(nextValue, prevValue) {
      this.$emit("update-gender", nextValue);
    },
    minAge(nextValue, prevValue) {
      this.sendAgeUpdate();
    },
    maxAge(nextValue, prevValue) {
      this.sendAgeUpdate();
    },
  },

  methods: {
    resetAllFilters(filterName) {
      let filters = ["race", "age", "date", "sex", "fatal", "has_court_case"];
      for (let i = 0; i < filters.length; i++) {
        this.$emit("reset", filters[i]);
        this.resetFilter(filters[i]);
      }
    },
    showReset(filterName) {
      if (filterName == "race") {
        for (let i = 0; i < this.allowedRaces.length; i++) {
          if (this.selectedRaces.indexOf(this.allowedRaces[i]) == -1)
            return true;
        }
        return false;
      } else if (filterName == "sex") {
        for (let i = 0; i < this.allowedGenders.length; i++) {
          if (this.selectedGenders.indexOf(this.allowedGenders[i]) == -1)
            return true;
        }
        return false;
      } else if (filterName == "date") {
        if (
          (this.dateRange[0] != this.allowedDateRange[0]) |
          (this.dateRange[1] != this.allowedDateRange[1])
        )
          return true;
        else return false;
      } else if (filterName == "age") {
        if (
          (this.ageRange[0] != this.allowedAgeRange[0]) |
          (this.ageRange[1] != this.allowedAgeRange[1])
        )
          return true;
        else return false;
      } else if (filterName == "aggLayer")
        return this.selectedAggLayers !== null;
      else return this.currentFilters[filterName] !== null;
    },
    setDateSlider(value) {
      this.dateRange = value;
    },
    setAgeSlider(value) {
      this.ageRange = value;
    },
    formatSliderTooltip(day) {
      return formatDate(this.selectedYear, day);
    },
    formatTimeSliderTooltip(msSinceMidnight) {
      return msToTimeString(msSinceMidnight);
    },
    updateDateSlider(value) {
      this.$emit("update-date", value);
    },
    handleCheckboxClick(event) {
      if (this.onlyClick) {
        event.stopPropagation();
        event.preventDefault();
        this.onlyClick = false;
      }
    },
    handleResetClick(event, filterName) {
      // Stop button from expanding
      event.stopPropagation();
      event.preventDefault();

      if (filterName == "aggLayer") {
        this.selectedAggLayers = null;
        this.selectedLayers = ["points"];
        this.mapLayersDisabled = false;
        return;
      }

      // Send the reset event
      this.$emit("reset", filterName);

      // Reset filter
      this.resetFilter(filterName);
    },
    resetFilter(filterName) {
      // Update the filters
      if (filterName == "date") this.dateRange = this.allowedDateRange;
      else if (filterName == "age") this.ageRange = this.allowedAgeRange;
      else if (filterName == "time") this.timeRange = this.allowedTimeRange;
      else if (filterName == "sex") this.selectedGenders = ["M", "F"];
      else if (filterName == "race")
        this.selectedRaces = ["W", "B", "H", "Other/Unknown"];
      else if (filterName == "fatal") this.fatalOnly = false;
      else if (filterName == "has_court_case") this.arrestsOnly = false;
      else throw "This should not happen";
    },
    handleOnlyClickRace(event, value) {
      this.onlyClick = true;
      this.selectedRaces = [value];
    },
    handleOnlyClickLayer(event, value) {
      this.onlyClick = true;
      this.selectedLayers = [value];
    },
    handleOnlyClickAggLayer(event, value) {
      this.onlyClick = true;
      this.selectedAggLayers = value;
    },
    handleOnlyClickGender(event, value) {
      this.onlyClick = true;
      this.selectedGenders = [value];
    },
    getAlias(value, kind) {
      let out = this.aliases[kind][value];
      if (out) return out;
      else return value;
    },
    sendDateUpdate() {
      this.$emit("update-date", this.dateRange);
    },
    sendTimeUpdate() {
      this.$emit("update-time", this.timeRange);
    },
    sendAgeUpdate() {
      this.$emit("update-age", this.ageRange);
    },
    formatNumber(d) {
      return d.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    },
  },
  computed: {
    showResetAllButton() {
      if (this.showReset("race")) return false;
      if (this.showReset("age")) return false;
      if (this.showReset("date")) return false;
      if (this.showReset("sex")) return false;
      if (this.fatalOnly) return false;
      if (this.arrestsOnly) return false;
      return true;
    },
    timeTooltipPlacement() {
      if (this.timeRange[1] - this.timeRange[0] < 8 * 60 * 60 * 1000)
        return ["top", "bottom"];
      else return ["bottom", "bottom"];
    },
    dateTooltipPlacement() {
      if (this.dateRange[1] - this.dateRange[0] < 60) return ["top", "bottom"];
      else return ["bottom", "bottom"];
    },
    ageTooltipPlacement() {
      if (this.ageRange[1] - this.ageRange[0] < 20) return ["top", "bottom"];
      else return ["bottom", "bottom"];
    },
    missingPoints() {
      return this.filteredSize - this.pointsOnMap;
    },
    minDate() {
      return this.$store.state.minFormattedDate;
    },
    maxDate() {
      return this.$store.state.maxFormattedDate;
    },
  },
};
</script>

<style>
/* Reset all button */
.reset-all-button:hover {
  color: black !important;
  border-color: white;
}
.reset-all-button {
  margin-bottom: 30px;
}

/* Total sidebar */
.shootings-map-sidebar {
  width: 30%;
  min-width: 300px;
  height: 600px;
  display: flex;
  flex-direction: column;
}
@media only screen and (max-width: 767px) {
  .shootings-map-sidebar {
    width: 100%;
    height: 500px;
  }
}
.sidebar-inner-content {
  background-color: #353d42;
  overflow-y: scroll;
}

/* Header */
.sidebar-header {
  text-align: center;
  padding: 5px;
  border-bottom: 3px solid #cfcfcf;
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

/* Panel config */
button:focus {
  outline: 0 !important;
  background-color: #353d42 !important;
  border-color: #353d42 !important;
  color: #fff !important;
  -webkit-tap-highlight-color: #fff !important;
}

.v-expansion-panel-header {
  font-size: 1.1rem !important;
  display: flex;
}
.v-expansion-panel-header:hover {
  background-color: #353d42 !important;
  border-color: #353d42 !important;
  color: #fff;
}

.dark-theme {
  background-color: #353d42 !important;
  border-color: #353d42 !important;
  color: #fff !important;
}

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
.age-slider,
.date-slider,
.time-slider {
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

.v-expansion-panel:last-of-type {
  padding-bottom: 30px;
}

.hide {
  opacity: 0;
}
</style>