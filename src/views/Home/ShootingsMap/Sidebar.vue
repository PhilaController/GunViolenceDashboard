<template>
  <div class="shootings-map-sidebar">
    <!--------------------------------------->
    <!-- TOP: Side bar header message -->
    <!--------------------------------------->
    <div class="sidebar-header">
      <div class="data-size-message mt-3">
        Showing locations for
        <span style="color: #7ab5e5">{{ formatNumber(pointsOnMap) }}</span>
        shooting victim<span v-if="pointsOnMap !== 1">s</span>
      </div>
      <div class="sidebar-note" v-bind:class="{ hide: missingPoints == 0 }">
        Note: {{ missingPoints }} victim<span v-if="missingPoints > 1">s</span>
        not shown due to missing locations
      </div>
    </div>

    <!-- Scrollable content -->
    <div class="sidebar-inner-content">
      <!-- All the panels -->
      <v-expansion-panels accordion multiple dark v-model="expandedPanels">
        <!--------------------------------------->
        <!-- FILTER #1: Fatal vs Nonfatal ------->
        <!--------------------------------------->
        <v-expansion-panel class="dark-theme">
          <v-expansion-panel-header
            hide-actions
            class="d-flex flex-column justify-content-center align-items-start"
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

        <!--------------------------------------->
        <!-- FILTER #2: Map Layers -------------->
        <!--------------------------------------->
        <v-expansion-panel class="dark-theme">
          <v-expansion-panel-header
            ><div>Map Layers</div>
            <div
              v-if="showReset('mapLayer')"
              class="reset-link"
              @click.capture="handleResetClick($event, 'mapLayer')"
            >
              Clear
            </div>
          </v-expansion-panel-header>
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

        <!--------------------------------------->
        <!-- FILTER #3: Aggregation Layers ------>
        <!--------------------------------------->
        <v-expansion-panel class="dark-theme">
          <v-expansion-panel-header
            ><div class="header-content">Aggregation Layers</div>
            <div
              v-if="showReset('aggLayer')"
              class="reset-link"
              @click.capture="handleResetClick($event, 'aggLayer')"
            >
              Clear
            </div>
          </v-expansion-panel-header>
          <v-expansion-panel-content>
            <!-- Layer options -->
            <v-radio-group v-model="selectedAggLayers" id="aggLayerRadioGroup">
              <v-radio
                v-for="layerName in allowedAggLayers"
                :key="layerName"
                :label="getAlias(layerName, 'aggLayer')"
                :value="layerName"
                color="#7ab5e5"
                hide-details
                :ripple="false"
                @click.native.capture="handleCheckboxClick"
                id="aggLayerRadio"
              >
              </v-radio>
            </v-radio-group>

            <!-- Opacity slider -->
            <div
              :style="{ opacity: selectedAggLayers !== null ? 1 : 0 }"
              class="d-flex flex-row align-items-center"
            >
              <span class="mr-3" id="opacityLabel">Layer Opacity</span>
              <vue-slider
                class="opacity-slider"
                v-model="aggLayerOpacity"
                :lazy="true"
                :tooltip="'none'"
                :enableCross="false"
                @drag-end="$emit('opacity-change', aggLayerOpacity / 100)"
                width="50%"
                :clickable="false"
                :max="50"
                :min="0"
                aria-labelledby="opacityLabel"
              />
            </div>
          </v-expansion-panel-content>
        </v-expansion-panel>

        <!--------------------------------------->
        <!-- FILTER #4: Date Filter ------------->
        <!--------------------------------------->
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
            <SliderHistogramChart
              height="100"
              v-if="histograms['date']"
              :width="getHistogramWidth()"
              :data="histograms['date']"
              :lower="getLowerAgeMs()"
              :upper="getUpperAgeMs()"
            />

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

        <!--------------------------------------->
        <!-- FILTER #5: Time -------------------->
        <!--------------------------------------->
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
            <SliderHistogramChart
              height="100"
              v-if="histograms['time']"
              :width="getHistogramWidth()"
              :data="histograms['time']"
              :lower="timeRange[0]"
              :upper="timeRange[1]"
            />

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

        <!--------------------------------------->
        <!-- FILTER #6: Day of week ---------->
        <!--------------------------------------->
        <v-expansion-panel class="dark-theme">
          <v-expansion-panel-header
            ><div class="header-content">Day of Week</div>
            <div
              v-if="showReset('weekday')"
              class="reset-link"
              @click.capture="handleResetClick($event, 'weekday')"
            >
              Reset
            </div>
          </v-expansion-panel-header>
          <v-expansion-panel-content>
            <v-row>
              <template
                v-for="(item, i) in [
                  { lower: 0, upper: 4 },
                  { lower: 4, upper: 7 },
                ]"
              >
                <v-col
                  cols="12"
                  sm="12"
                  md="6"
                  lg="6"
                  :key="`col-${item.lower}-${item.upper}`"
                  :class="getMultiColumnClass(i)"
                >
                  <v-hover
                    v-for="weekday in allowedWeekdays.slice(
                      item.lower,
                      item.upper
                    )"
                    :key="weekday"
                  >
                    <v-checkbox
                      slot-scope="{ hover }"
                      :value="weekday"
                      v-model="selectedWeekdays"
                      color="#7ab5e5"
                      hide-details
                      multiple
                      :ripple="false"
                      @click.native.capture="handleCheckboxClick"
                    >
                      <template v-slot:label>
                        <div>
                          {{ getAlias(weekday, "weekday") }}
                          <span
                            v-if="hover"
                            class="only-link"
                            v-on:click.stop="
                              handleOnlyClickWeekday($event, weekday)
                            "
                            >only</span
                          >
                        </div>
                      </template>
                    </v-checkbox>
                  </v-hover>
                </v-col>
              </template>
            </v-row>
          </v-expansion-panel-content>
        </v-expansion-panel>

        <!--------------------------------------->
        <!-- FILTER #7: Race/Ethnicity ---------->
        <!--------------------------------------->
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

        <!--------------------------------------->
        <!-- FILTER #8: Gender ------------------>
        <!--------------------------------------->
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

        <!--------------------------------------->
        <!-- FILTER #9: Age --------------------->
        <!--------------------------------------->
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
            <!-- Test -->

            <SliderHistogramChart
              height="100"
              v-if="histograms['age']"
              :width="getHistogramWidth()"
              :data="histograms['age']"
              :lower="ageRange[0]"
              :upper="ageRange[1]"
            />

            <!-- Age slider -->
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
            />

            <!-- How to handle unknown ages? -->
            <v-switch
              class="mt-5 pt-5"
              v-model="excludeUnknownAges"
              label="Exclude unknown ages"
              :ripple="false"
              color="#7ab5e5"
              hide-details
            ></v-switch>
          </v-expansion-panel-content>
        </v-expansion-panel>
      </v-expansion-panels>

      <!-- Reset all filters -->
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
// Internal
import { formatDate, msToTimeString, dateFromDay } from "@/tools.js";
import SliderHistogramChart from "./SliderHistogramChart";

// Vue slider
import VueSlider from "vue-slider-component";
import "vue-slider-component/theme/default.css";

// External
import $ from "jquery";

export default {
  components: { VueSlider, SliderHistogramChart },
  props: [
    "pointsOnMap",
    "filteredSize",
    "selectedYear",
    "allowedAgeRange",
    "allowedDateRange",
    "currentFilters",
    "histograms",
  ],
  data() {
    return {
      expandedPanels: [1],
      aggLayerOpacity: 50,
      excludeUnknownAges: false,
      scrollable: true,
      openPanels: [0],
      onlyClick: false,
      allowedRaces: ["W", "B", "H", "A", "Other/Unknown"],
      allowedWeekdays: [0, 1, 2, 3, 4, 5, 6],
      allowedGenders: ["M", "F"],
      allowedTimeRange: [0, 86399999],
      allowedLayers: ["points", "heatmap", "streets"],
      allowedAggLayers: [
        "council",
        "zip",
        "police",
        "hood",
        "house_district",
        "school",
      ],
      fatalOnly: false,
      arrestsOnly: false,
      selectedLayers: ["points"],
      selectedAggLayers: null,
      selectedRaces: ["W", "B", "H", "A", "Other/Unknown"],
      selectedWeekdays: [0, 1, 2, 3, 4, 5, 6],
      selectedGenders: ["M", "F"],
      ageRange: [0, 100],
      dateRange: [1, 366],
      timeRange: [0, 86399999],
      aliases: {
        weekday: {
          0: "Sunday",
          1: "Monday",
          2: "Tuesday",
          3: "Wednesday",
          4: "Thursday",
          5: "Friday",
          6: "Saturday",
        },
        race: {
          W: "White (Non-Hispanic)",
          B: "Black (Non-Hispanic)",
          H: "Hispanic (Black or White)",
          A: "Asian",
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
          council: "Council Districts",
          police: "Police Districts",
          zip: "ZIP Codes",
          hood: "Neighborhoods",
          school: "Elementary School Catchments",
          house_district: "PA House Districts",
        },
      },
    };
  },
  watch: {
    allowedAgeRange(nextValue) {
      this.ageRange = nextValue;
    },
    allowedDateRange(nextValue) {
      this.dateRange = nextValue;
    },
    fatalOnly(nextValue) {
      this.$emit("update-fatal", nextValue);
    },
    arrestsOnly(nextValue) {
      this.$emit("update-arrests", nextValue);
    },
    selectedLayers(nextValue) {
      this.$emit("update-layer", nextValue);
    },
    selectedAggLayers(nextValue) {
      this.$emit("update-agg-layer", nextValue);
    },
    selectedRaces(nextValue) {
      this.$emit("update-race", nextValue);
    },
    selectedWeekdays(nextValue) {
      this.$emit("update-weekday", nextValue);
    },
    selectedGenders(nextValue) {
      this.$emit("update-gender", nextValue);
    },
    minAge() {
      this.sendAgeUpdate();
    },
    maxAge() {
      this.sendAgeUpdate();
    },
    excludeUnknownAges() {
      this.sendAgeUpdate();
    },
  },

  methods: {
    getUpperAgeMs() {
      return +dateFromDay(this.selectedYear, this.dateRange[1] + 1);
    },
    getLowerAgeMs() {
      return +dateFromDay(this.selectedYear, this.dateRange[0] - 1);
    },
    getHistogramWidth() {
      return ($(".sidebar-inner-content").width() - 48) * 0.85;
    },
    getMultiColumnClass(i) {
      if (this.$vuetify.breakpoint.smAndDown) {
        return i == 0 ? "mb-0 pb-0" : "mt-0 pt-0";
      }
      return "";
    },
    resetAllFilters() {
      let filters = [
        "race",
        "age",
        "date",
        "time",
        "sex",
        "fatal",
        "has_court_case",
        "weekday",
      ];
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
      } else if (filterName == "weekday") {
        for (let i = 0; i < this.allowedWeekdays.length; i++) {
          if (this.selectedWeekdays.indexOf(this.allowedWeekdays[i]) == -1)
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
          this.excludeUnknownAges |
          (this.ageRange[0] != this.allowedAgeRange[0]) |
          (this.ageRange[1] != this.allowedAgeRange[1])
        )
          return true;
        else return false;
      } else if (filterName == "aggLayer")
        return this.selectedAggLayers !== null;
      else if (filterName == "mapLayer") return this.selectedLayers.length > 0;
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
        return;
      } else if (filterName == "mapLayer") {
        this.selectedLayers = [];
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
      else if (filterName == "age") {
        this.ageRange = this.allowedAgeRange;
        this.excludeUnknownAges = false;
      } else if (filterName == "time") this.timeRange = this.allowedTimeRange;
      else if (filterName == "sex") this.selectedGenders = this.allowedGenders;
      else if (filterName == "race") this.selectedRaces = this.allowedRaces;
      else if (filterName == "weekday")
        this.selectedWeekdays = this.allowedWeekdays;
      else if (filterName == "fatal") this.fatalOnly = false;
      else if (filterName == "has_court_case") this.arrestsOnly = false;
      else throw "This should not happen";
    },
    handleOnlyClickRace(event, value) {
      this.onlyClick = true;
      this.selectedRaces = [value];
    },
    handleOnlyClickWeekday(event, value) {
      this.onlyClick = true;
      this.selectedWeekdays = [value];
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
      this.$emit("update-age", this.ageRange, this.excludeUnknownAges);
    },
    formatNumber(d) {
      return d.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    },
  },
  computed: {
    showResetAllButton() {
      if (this.showReset("race")) return false;
      if (this.showReset("weekday")) return false;
      if (this.showReset("age")) return false;
      if (this.showReset("date")) return false;
      if (this.showReset("time")) return false;
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
.v-expansion-panel:before {
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