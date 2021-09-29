<template>
  <div
    class="dark-app-theme"
    style="position: relative"
    v-show="$router.currentRoute.path != '/about'"
  >
    <!-- Overlay a lodader -->
    <v-overlay :value="isLoading" opacity="1" color="#353d42">
      <v-progress-circular indeterminate size="64" color="#fff" />
    </v-overlay>

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
        :aggLayerOpacity="aggLayerOpacity"
        :aggLayerURLs="aggLayerURLs"
      />
      <ShootingsMapSidebar
        ref="mapSidebar"
        @update-agg-layer="updateAggLayer"
        @update-layer="updateLayer"
        @update-date="updateDateFilter"
        @update-time="updateTimeFilter"
        @update-fatal="updateFatalFilter"
        @update-arrests="updateArrestsFilter"
        @update-race="updateRaceFilter"
        @update-weekday="updateWeekdayFilter"
        @update-gender="updateGenderFilter"
        @update-age="updateAgeFilter"
        @opacity-change="handleOpacityChange"
        @download-agg="handleAggDownload"
        @reset="handleReset"
        :data="data"
        :filteredData="filteredData"
        :pointsOnMap="pointsOnMap"
        :filteredSize="filteredSize"
        :selectedYear="selectedYear"
        :allowedAgeRange="allowedAgeRange"
        :allowedDateRange="allowedDateRange"
        :currentFilters="currentFilters"
        :histograms="histograms"
        :aggLayerURLs="aggLayerURLs"
      />
    </div>

    <!-- Charts -->
    <ChartDashboard
      ref="chartDashboard"
      :filteredData="filteredData"
      :key="dashboardKey"
    />
  </div>
</template>

<script>
// Local
import {
  getDayOfYear,
  dateFromDay,
  githubFetch,
  parseTime,
  getMsSinceMidnight,
  downloadFile,
} from "@/tools.js";
import HeaderMessage from "./HeaderMessage";

// Shootings map
import ShootingsMap from "./ShootingsMap/Map";
import ShootingsMapSidebar from "./ShootingsMap/Sidebar";

// Charts
import ChartDashboard from "./ChartDashboard";

// External
import crossfilter from "crossfilter2";
import { min, max, bin, rollup } from "d3-array";
import * as Papa from "papaparse";

// Import esri-leaflet too
const esri = require("esri-leaflet");

export default {
  name: "HomePage",
  components: {
    ShootingsMap,
    ShootingsMapSidebar,
    HeaderMessage,
    ChartDashboard,
  },
  data() {
    return {
      aggLayerURLs: {
        police:
          "https://services.arcgis.com/fLeGjb7u4uXqeF9q/arcgis/rest/services/Boundaries_District/FeatureServer/0",
        council:
          "https://services.arcgis.com/fLeGjb7u4uXqeF9q/arcgis/rest/services/Council_Districts_2016/FeatureServer/0/",
        zip: "https://services.arcgis.com/fLeGjb7u4uXqeF9q/arcgis/rest/services/Philadelphia_ZCTA_2018/FeatureServer/0",
        hood: "https://services.arcgis.com/fLeGjb7u4uXqeF9q/arcgis/rest/services/Philly_NTAs/FeatureServer/0",
        house_district:
          "https://services.arcgis.com/fLeGjb7u4uXqeF9q/arcgis/rest/services/PA_House_Districts/FeatureServer/0",
        school:
          "https://services.arcgis.com/fLeGjb7u4uXqeF9q/arcgis/rest/services/Philadelphia_Elementary_School_Catchments_SY_2019_2020/FeatureServer/0",
      },
      data: {},
      histograms: {},
      aggLayerOpacity: 0.5,
      dashboardKey: 0,
      filteredData: null,
      homicideData: null,
      crossfilters: {},
      dimensions: {
        date: {},
        time: {},
        fatal: {},
        race: {},
        age: {},
        sex: {},
        has_court_case: {},
        weekday: {},
      },
      currentYear: new Date().getFullYear(),
      currentFilters: {
        date: null,
        time: null,
        fatal: null,
        race: null,
        age: null,
        sex: null,
        has_court_case: null,
        weekday: null,
      },
      allowedAgeRange: [0, 100],
      allowedDateRange: [1, 366],
      fatalCount: 0,
      nonfatalCount: 0,
      maxDate: null,
      isLoading: true,
    };
  },
  async created() {
    // Fetch the annual and YTD homicide counts
    this.homicideData = await githubFetch("homicide_totals.json");

    // Handle the default year selectiom
    this.handleYearSelection(this.selectedYear);
  },
  activated() {
    // Force the dashboard to re-render itself
    this.dashboardKey += 1;
  },
  deactivated() {
    // -------------------
    // When make is restored, make sure it's back in the default position
    // -------------------
    // Restore points and remove agg layers
    this.$refs.mapSidebar.selectedLayers = ["points"];
    this.$refs.mapSidebar.selectedAggLayers = null;

    // Zoom to home
    this.$refs.shootingsMap.zoomHome();
  },
  watch: {
    $route(to) {
      this.isLoading = true;
      // If not a fresh page, call handleYearSelection
      // Otherwise, it's called in created()
      let year = to.params.selectedYear;
      if (this.crossfilters[year]) this.handleYearSelection(year);
    },
    filteredData(newData) {
      if (newData) {
        // Get the cross filter for this year
        let cross = this.crossfilters[this.selectedYear];

        let dims = ["age", "date", "time"];
        for (let i = 0; i < dims.length; i++) {
          let dim = dims[i];

          // Get the filtered data, ignoring this dimensiom
          let values = cross.allFiltered([
            this.dimensions[dim][this.selectedYear],
          ]);

          // Calculate historgram
          this.histograms[dim] = this.getHistogram(dim)(values);
        }

        this.histograms["weekday"] = rollup(
          cross.allFiltered([this.dimensions["weekday"][this.selectedYear]]),
          (v) => v.length,
          (d) => d.properties.weekday
        );
      }
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
    handleAggDownload(selectedAgg, formatRadio, data) {
      // Aggregate by the key
      let aggCounts = rollup(
        data,
        (v) => v.length,
        (d) => d.properties[selectedAgg]
      );

      // CSV
      let content, fileName, contentType;
      if (formatRadio == 0) {
        // Convert to an array of objects
        aggCounts = Array.from(aggCounts, ([name, shooting_victims]) => {
          let out = {};
          out[selectedAgg] = name;
          out["shooting_victims"] = shooting_victims;
          return out;
        }).filter((d) => d[selectedAgg]);

        // Get the content
        content = Papa.unparse(aggCounts);

        // File and content
        fileName = `shooting-victims-data-by-${selectedAgg}.csv`;
        contentType = "text/plain";

        // Download it
        downloadFile(content, contentType, fileName);
      } else {
        // Download the agg layer
        let layer = esri.featureLayer({
          url: this.aggLayerURLs[selectedAgg],
        });

        let map = this.$refs.shootingsMap;

        // Query for the features
        layer
          .query()
          .where("1 = 1")
          .run(function (error, featureCollection) {
            // The name key
            let key = map.getAggKey(selectedAgg);

            // The empty collection
            let collection = { type: "FeatureCollection", features: [] };

            // Loop over all features
            featureCollection.features.map((feature) => {
              // Get the name and count
              let name = feature.properties[key];
              let count = aggCounts.get(name) || 0;

              // Create the properties
              feature.properties = {};
              feature.properties[selectedAgg] = name;
              feature.properties["shooting_victims"] = count;

              // Add to our collectiom
              collection.features.push(feature);
            });

            // Download as geojson
            content = JSON.stringify(collection);
            fileName = `shooting-victims-by-${selectedAgg}.geojson`;
            contentType = "text/json";

            // Download it
            downloadFile(content, contentType, fileName);
          });
      }
    },
    getHistogram(dimension) {
      return bin()
        .thresholds(50)
        .value((d) => +d.properties[dimension]);
    },
    handleOpacityChange(value) {
      this.aggLayerOpacity = value;
    },
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
      this.maxDate =
        this.dimensions.date[this.selectedYear].top(1)[0].properties.date;
      return [
        getDayOfYear(
          this.dimensions.date[this.selectedYear].bottom(1)[0].properties.date
        ),
        getDayOfYear(this.maxDate),
      ];
    },
    updateAgeFilter(value, excludeUnknown) {
      // Increase max by one due to crossfilter top point being exclusive
      if (excludeUnknown) {
        this.currentFilters.age = (d) =>
          (d != "Unknown") &
          (parseInt(d) >= value[0]) &
          (parseInt(d) <= value[1]);
      } else {
        this.currentFilters.age = (d) =>
          (d == "Unknown") |
          ((parseInt(d) >= value[0]) & (parseInt(d) <= value[1]));
      }
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
    updateWeekdayFilter(value) {
      this.currentFilters.weekday = (d) => value.indexOf(d) !== -1;
      this.applyFilter("weekday");
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
    updateTimeFilter(value) {
      // Increase max by one due to crossfilter top point being exclusive
      this.currentFilters.time = [value[0], value[1] + 1];
      this.applyFilter("time");
    },
    applyFilter(filterName) {
      // Filter by the date
      this.dimensions[filterName][this.selectedYear].filter(
        this.currentFilters[filterName]
      );

      // Set filtered data
      this.filteredData = this.crossfilters[this.selectedYear].allFiltered();
    },
    async handleYearSelection(year) {
      // The data for this year
      let data = this.data[year];

      // Fetch the data if we need to
      if (!this.crossfilters[year]) {
        data = await this.fetchShootingsData(year);
      }

      // Change full year data
      this.filteredData = data;

      // Clear filters
      this.$refs.mapSidebar.resetAllFilters();

      // Wait until done updating
      this.$nextTick(() => {
        // Get fatal counts
        this.setShootingCounts();

        // Set the allowed date and age range
        this.allowedAgeRange = this.getAllowedAges();
        this.allowedDateRange = this.getAllowedDates();

        // Update the date slider
        this.$refs.mapSidebar.setDateSlider(this.allowedDateRange);

        // turn off loading
        this.isLoading = false;
      });
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
    async fetchShootingsData(year) {
      // Get the data for the full year from the data store
      this.filteredData = this.data[year];

      // Fetch it if we need to
      if (!this.filteredData) {
        // Download and extract the features
        const data = await githubFetch(`shootings_${year}.json`);
        let features = data.features;

        // Format date and time
        features.forEach(function (d) {
          d.properties["date"] = parseTime(d.properties["date"]);
          d.properties["weekday"] = d.properties["date"].getDay();
          d.properties["time"] = getMsSinceMidnight(d.properties["date"]);
        });

        // Save it
        this.data[year] = features;

        // Create crossfilter
        this.createCrossfilter(this.data[year], year);
      }

      // Turn of loading and return
      this.isLoading = false;
      return this.data[year];
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
