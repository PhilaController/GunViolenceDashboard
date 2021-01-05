<template>
  <v-app id="inspire">
    <div class="dark-app-theme" style="position: relative">
      <Loader v-if="isLoading" />

      <!-- Header message -->
      <HeaderMessage
        ref="headerMessage"
        class="header-message"
        :fatal="fatalCount"
        :nonfatal="nonfatalCount"
        :selectedYear="selectedYear"
        :currentYear="currentYear"
        :maxDate="maxDate"
        :homicideData="homicideData"
      />

      <!-- Shootings map & Sidebar-->
      <div class="shootings-map-wrapper">
        <ShootingsMap
          ref="shootingsMap"
          class="shootings-map"
          :geojson="pointsGeoJSON"
        />
        <ShootingsMapSidebar
          ref="mapSidebar"
          @update-agg-layer="updateAggLayer"
          @update-layer="updateLayer"
          @update-date="updateDateFilter"
          @update-fatal="updateFatalFilter"
          @update-arrests="updateArrestsFilter"
          @update-race="updateRaceFilter"
          @update-gender="updateGenderFilter"
          @update-age="updateAgeFilter"
          @reset="handleReset"
          :pointsOnMap="pointsOnMap"
          :filteredSize="filteredSize"
          :selectedYear="selectedYear"
          :allowedAgeRange="allowedAgeRange"
          :allowedDateRange="allowedDateRange"
          :currentFilters="currentFilters"
        />
      </div>

      <!-- Charts -->
      <ChartDashboard :filteredData="filteredData" />
    </div>
  </v-app>
</template>

<script>
import { getDayOfYear, dateFromDay } from "@/tools.js";
import ShootingsMap from "./ShootingsMap/Map";
import ShootingsMapSidebar from "./ShootingsMap/Sidebar";
import HeaderMessage from "./HeaderMessage";
import Loader from "./Loader";
import ChartDashboard from "./ChartDashboard";
import crossfilter from "crossfilter2";
import { min, max } from "d3-array";

export default {
  name: "HomePage",
  components: {
    ShootingsMap,
    ShootingsMapSidebar,
    HeaderMessage,
    ChartDashboard,
    Loader,
  },
  data() {
    return {
      filteredData: null,
      homicideData: null,
      crossfilters: {},
      dimensions: {
        date: {},
        fatal: {},
        race: {},
        age: {},
        sex: {},
        has_court_case: {},
      },
      currentYear: new Date().getFullYear(),
      currentFilters: {
        date: null,
        fatal: null,
        race: null,
        age: null,
        sex: null,
        has_court_case: null,
      },
      allowedAgeRange: [0, 100],
      allowedDateRange: [1, 366],
      fatalCount: 0,
      nonfatalCount: 0,
      maxDate: null,
      isLoading: true,
    };
  },
  created() {
    this.fetchHomicideData();
    this.handleYearSelection(this.selectedYear);
  },
  watch: {
    $route(to, from) {
        this.isLoading = true;
    },

  },
  computed: {
    selectedYear() {
      return this.$route.params.selectedYear;
    },
    pointsGeoJSON() {
      if (this.filteredData)
        return this.filteredData.filter((d) => d.geometry != null);
      else return [];
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
  },
  methods: {
    updateLayer(layers) {
      this.$refs.shootingsMap.setActiveLayers(layers);
    },
    updateAggLayer(layer) {
      this.$refs.shootingsMap.setAggLayer(layer);
    },
    handleReset(filterName) {
      this.currentFilters[filterName] = null;
      this.applyFilter(filterName);
    },
    setShootingCounts() {
      this.fatalCount = this.filteredData.filter(
        (el) => el.properties["fatal"] == 1
      ).length;
      this.nonfatalCount = this.filteredData.length - this.fatalCount;
    },
    getAllowedAges() {
      return [
        min(this.filteredData.map((el) => +el.properties["age"])),
        max(this.filteredData.map((el) => +el.properties["age"])),
      ];
    },
    getAllowedDates() {
      this.maxDate = this.dimensions.date[this.selectedYear].top(
        1
      )[0].properties.date;
      return [
        getDayOfYear(
          this.dimensions.date[this.selectedYear].bottom(1)[0].properties.date
        ),
        getDayOfYear(this.maxDate),
      ];
    },
    updateAgeFilter(value) {
      // Increase max by one due to crossfilter top point being exclusive
      this.currentFilters.age = (d) =>
        (d != "Unknown") &
        (parseInt(d) >= value[0]) &
        (parseInt(d) <= value[1]);
      this.applyFilter("age");
    },
    updateGenderFilter(value) {
      this.currentFilters.sex = (d) => value.indexOf(d) !== -1;
      this.applyFilter("sex");
    },
    updateRaceFilter(value) {
      this.currentFilters.race = (d) => value.indexOf(d) !== -1;
      this.applyFilter("race");
    },
    updateFatalFilter(value) {
      if (value) {
        this.currentFilters.fatal = 1;
      } else this.currentFilters.fatal = null;
      this.applyFilter("fatal");
    },
    updateArrestsFilter(value) {
      if (value) {
        this.currentFilters.has_court_case = true;
      } else this.currentFilters.has_court_case = null;
      this.applyFilter("has_court_case");
    },
    updateDateFilter(value) {
      // Increase max by one due to crossfilter top point being exclusive
      this.currentFilters.date = [
        dateFromDay(this.selectedYear, value[0]),
        dateFromDay(this.selectedYear, value[1] + 1),
      ];
      this.applyFilter("date");
    },
    applyFilter(filterName) {
      // Filter by the date
      this.dimensions[filterName][this.selectedYear].filter(
        this.currentFilters[filterName]
      );

      // Set filtered data
      this.filteredData = this.crossfilters[this.selectedYear].allFiltered();
    },
    setDateSliderValue() {
      this.$refs.mapSidebar.setDateSlider(this.getAllowedDates());
    },
    handleYearSelection(year) {
      // Fetch data
      if (!this.crossfilters[year]) {
        this.fetchData(year, this.setDateSliderValue);
      } else {
        // Change full year data
        this.filteredData = this.$store.state[year];

        // Clear filters
        this.$refs.mapSidebar.resetAllFilters();

        // Wait until done updating
        this.$nextTick(() => {
          // Get fatal counts
          this.setShootingCounts();

          this.allowedAgeRange = this.getAllowedAges();
          this.allowedDateRange = this.getAllowedDates();

          // call callback
          this.setDateSliderValue();
        });

        this.isLoading = false;
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

      return this.crossfilters[year];
    },
    fetchHomicideData() {
      this.homicideData = this.$store.state.homicides;

      if (!this.homicideData) {
        this.$store.dispatch("fetchHomicideData").then((data) => {
          this.homicideData = data;
        });
      }
    },
    fetchData(year, callback) {
      // Get the data for the full year from the data store
      this.filteredData = this.$store.state[year];

      // Fetch it if we need to
      if (!this.filteredData) {
        // Download
        this.$store
          .dispatch("fetchData", {
            year: this.selectedYear,
          })
          .then((data) => {
            // Save
            this.filteredData = data;
            this.createCrossfilter(data, year);

            // Clear filters
            this.$refs.mapSidebar.resetAllFilters();

            // Wait until done updating and then reset
            this.$nextTick(() => {
              // Get fatal counts
              this.setShootingCounts();

              // Set the allowed slider ranges
              this.allowedAgeRange = this.getAllowedAges();
              this.allowedDateRange = this.getAllowedDates();

              // Call callback
              if (callback) callback();
            });

            this.isLoading = false;
          });
      } else this.isLoading = false;
    },
  },
};
</script>

<style>
.full-page-loader.vld-overlay {
  align-items: flex-start !important;
}
.full-page-loader .vld-icon {
  margin-top: 50px !important;
}
.shootings-map-wrapper {
  display: flex;
  margin-top: 100px;
  margin-bottom: 20px;
  border: 5px solid #868b8e;
}

@media only screen and (max-width: 767px) {
  .shootings-map-wrapper {
    flex-direction: column;
  }
}
</style>
