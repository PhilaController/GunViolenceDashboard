<template>
  <div id="app">
    <!-- Year selector -->
    <div class="year-message-wrapper">
      <div class="year-message-content">
        Viewing data for
        <div class="green font-weight-bold year-dropdown">
          <button
            class="btn green dropdown-toggle year-dropdown-toggle"
            type="button"
            id="dropdownMenuButton"
            data-toggle="dropdown"
            aria-haspopup="true"
            aria-expanded="false"
          >
            {{ selectedYear }}
          </button>
          <div class="dropdown-menu green" aria-labelledby="downMenuButton">
            <a
              v-for="year in dataYears"
              :key="year"
              class="dropdown-item"
              @click="handleYearSelection(year)"
              >{{ year }}</a
            >
          </div>
        </div>
      </div>
    </div>

    <!-- Header message -->
    <div class="header-message-wrapper">
      <HeaderMessage
        ref="headerMessage"
        class="header-message"
        :fatal="fatalCount"
        :nonfatal="nonfatalCount"
        :dateRange="currentFilters.date"
        :selectedYear="selectedYear"
      />
    </div>

    <!-- Date Slider -->
    <DateSlider
      ref="dateSlider"
      :fullYearData="fullYearData"
      :width="500"
      :selectedYear="selectedYear"
      :maxAllowedValue="maxAllowedValue"
      @update="updateDateFilter"
    />

    <!-- Weekly shootings chart -->
    <WeeklyShootingsChart
      :data="fullYearData"
      :selectedYear="selectedYear"
      :dateRange="currentFilters.date"
    />

    <!-- Shootings map -->
    <div class="shootings-map-section mt-5">
      <div class="section-header">Shooting Locations</div>

      <div class="shootings-map-wrapper">
        <ShootingsMap
          class="shootings-map"
          :geojson="filteredData"
          :height="600"
        />
        <ShootingsMapSidebar
          @update-fatal="updateFatalFilter"
          @update-race="updateRaceFilter"
          @update-gender="updateGenderFilter"
          @update-age="updateAgeFilter"
          :pointsOnMap="pointsOnMap"
          :filteredSize="filteredSize"
          :dataSize="dataSize"
          :selectedYear="selectedYear"
        />
      </div>
    </div>

    <!-- Cumulative shootings -->
    <CumulativeDailyShootings />
  </div>
</template>

<script>
import { getDayOfYear, dateFromDay } from "@/tools.js";
import ShootingsMap from "@/components/ShootingsMap.vue";
import ShootingsMapSidebar from "@/components/ShootingsMapSidebar.vue";
import HeaderMessage from "@/components/HeaderMessage.vue";
import DateSlider from "@/components/DateSlider.vue";
import WeeklyShootingsChart from "@/components/WeeklyShootingsChart.vue";
import CumulativeDailyShootings from "@/components/CumulativeDailyShootings.vue";
import crossfilter from "crossfilter2";
import { max } from "d3-array";

export default {
  name: "App",
  components: {
    ShootingsMap,
    HeaderMessage,
    CumulativeDailyShootings,
    ShootingsMapSidebar,
    DateSlider,
    WeeklyShootingsChart,
  },
  data() {
    return {
      fullYearData: null,
      filteredData: null,
      crossfilters: {},
      dimensions: { date: {}, fatal: {}, race: {}, age: {}, sex: {} },
      minYear: 2015,
      selectedYear: 2020,
      currentYear: new Date().getFullYear(),
      fatalCount: 0,
      nonfatalCount: 0,
      currentFilters: { date: null },
    };
  },
  computed: {
    dataSize() {
      return this.fatalCount + this.nonfatalCount;
    },
    pointsOnMap() {
      if (this.filteredData)
        return this.filteredData.filter((d) => d.geometry != null).length;
      else return 0;
    },
    filteredSize() {
      if (this.filteredData) return this.filteredData.length;
      else return 0;
    },
    dataYears() {
      let out = [];
      for (let year = this.minYear; year <= this.currentYear; year++) {
        out.push(year);
      }
      return out;
    },
    latestDate() {
      if (this.fullYearData) {
        if (this.currentYear == this.selectedYear)
          return max(this.fullYearData.map((el) => el.properties["date"]));
        else return new Date(`December 31, ${this.selectedYear}`);
      }
    },
    maxAllowedValue() {
      if (this.latestDate) return getDayOfYear(this.latestDate);
    },
  },
  methods: {
    setDateSliderValue() {
      let year = this.selectedYear;

      // Get min/max date
      let minDate = new Date(
        `${this.$refs.headerMessage.formattedMinDate}, ${year}`
      );
      let maxDate = new Date(
        `${this.$refs.headerMessage.formattedMaxDate}, ${year}`
      );

      // Update the value
      this.$refs.dateSlider.value = [
        getDayOfYear(minDate),
        getDayOfYear(maxDate),
      ];
    },
    updateAgeFilter(value) {
      this.currentFilters.age = value;
      this.applySingleFilter("age", false);
    },
    updateGenderFilter(value) {
      this.currentFilters.sex = (d) => value.indexOf(d) !== -1;
      this.applySingleFilter("sex", false);
    },
    updateRaceFilter(value) {
      this.currentFilters.race = (d) => value.indexOf(d) !== -1;
      this.applySingleFilter("race", false);
    },
    updateFatalFilter(value) {
      if (value) {
        this.currentFilters.fatal = 1;
      } else this.currentFilters.fatal = null;
      this.applySingleFilter("fatal", false);
    },
    updateDateFilter(value) {
      this.currentFilters.date = [
        dateFromDay(this.selectedYear, value[0]),
        dateFromDay(this.selectedYear, value[1] + 1),
      ];
      this.applySingleFilter("date", true);
      this.calculateShootingCounts();

      // Update all filters but date
      this.$nextTick(() => {
        for (let filterName in this.currentFilters) {
          if (filterName != "date") this.applySingleFilter(filterName, false);
        }
      });
    },
    calculateShootingCounts() {
      let d = this.filteredData;
      let fatal = 0;
      for (let i = 0; i < d.length; i++) {
        fatal += d[i].properties.fatal;
      }
      this.fatalCount = fatal;
      this.nonfatalCount = d.length - fatal;
    },
    applySingleFilter(filterName, resetFilters) {
      // Reset filters
      if (resetFilters) {
        for (let dim in this.dimensions) {
          this.dimensions[dim][this.selectedYear].filterAll();
        }
      }

      // Filter by the date
      this.dimensions[filterName][this.selectedYear].filter(
        this.currentFilters[filterName]
      );

      // Set filtered data
      this.filteredData = this.crossfilters[this.selectedYear].allFiltered();
    },
    handleYearSelection(year) {
      // Update selected year
      this.selectedYear = year;

      // Fetch data
      if (!this.crossfilters[year]) {
        this.fetchData(year, this.setDateSliderValue);
      } else {
        // Change full year data
        this.fullYearData = this.$store.state[year];

        // call callback
        this.setDateSliderValue();
      }
    },

    createCrossfilter(data, year) {
      // Create and save crossfilter
      this.crossfilters[year] = crossfilter(data);

      // Create dimensions
      for (let dim in this.dimensions) {
        this.dimensions[dim][year] = this.crossfilters[year].dimension(
          (d) => d.properties[dim]
        );
      }

      // Set filter
      // this.dimensions["fatal"][year].filter((d) => d > 0);
      // this.dimensions["race"][year].filter("B");

      // console.log(this.dimensions["fatal"][year].top(Infinity));
      return this.crossfilters[year];
    },
    fetchData(year, callback) {
      // Get the data for the full year from the data store
      this.fullYearData = this.$store.state[year];

      // Fetch it from Github if we need to
      if (!this.fullYearData) {
        // Download
        this.$store
          .dispatch("fetchData", {
            year: this.selectedYear,
          })
          .then((data) => {
            // Save
            this.fullYearData = data;
            this.createCrossfilter(data, year);

            // Call callback
            if (callback) callback();
          });
      }
    },
  },
  created() {
    this.fetchData(this.selectedYear);
  },
};
</script>

<style>
.section-header {
  font-size: 2.3rem;
  font-weight: 500;
  line-height: 1.1;
  color: inherit;
  margin-bottom: 1rem;
  text-align: center;
  padding-left: 20px;
  font-family: Montserrat, sans-serif;
}
.year-dropdown-toggle {
  background-color: transparent;
  text-decoration: underline;
  font-weight: bold;
  padding: 0;
  margin-left: 2.5px;
  padding-left: 5px;
  padding-right: 5px;
}
.year-dropdown-toggle:hover {
  color: #868b8e;
  border-color: #868b8e;
}
.year-dropdown-toggle:active {
  color: #868b8e;
  border-color: #868b8e;
}
.year-dropdown-toggle:focus {
  color: #868b8e;
  border-color: #868b8e;
  box-shadow: none !important;
}
.dropdown-menu {
  background-color: transparent;
  min-width: 0rem;
  text-align: right;
  border-color: white;
  padding-left: 5px;
  padding-right: 5px;
}
.dropdown-item {
  color: white !important;
  font-weight: 500;
  padding: 0.25rem 1rem !important;
}
.dropdown-item:hover {
  background-color: #868b8e !important;
}
.year-dropdown {
  float: right;
  margin-left: 0px;
}
.nonfatal {
  color: #e5dc8e;
}

.fatal {
  color: #d84545;
}
.green {
  color: #868b8e;
}
.year-message-wrapper {
  width: 100%;
  text-align: right;
  padding: 10px;
}
.year-message-content {
  display: inline-block;
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
  background-color: #868b8e;
}

#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #fff;
  background-color: #353d42;
}

.header-message {
  padding-top: 30px;
}

.daily-calendar {
  margin: 2rem;
}

.date-slider-wrapper {
  display: flex;
  justify-content: center;
  margin-bottom: 2rem;
  margin-top: 3rem;
}

.shootings-map-wrapper {
  display: flex;
  margin-top: 30px;
  margin-bottom: 20px;
  border: 5px solid #868b8e;
}
</style>
