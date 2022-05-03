<template>
  <div class="dashboard-view">
    <!-- Top app navbar -->
    <Navbar
      :dataYears="dataYears"
      :selectedYear="selectedYear"
      :showOverlay="showOverlay"
    />

    <!-- Header message -->
    <HeaderMessage
      ref="headerMessage"
      :fatal="fatalCount"
      :nonfatal="nonfatalCount"
      :currentYear="currentYear"
      :minYear="minYear"
      :selectedYear="selectedYear"
      :latestDataDate="latestDataDate"
      :showOverlay="showOverlay"
    />

    <div v-if="data !== null">
      <!-- Dashboard -->
      <MappingDashboard
        ref="MappingDashboard"
        :data="data"
        :filters="filters"
        :layers="layers"
        :sources="sources"
        :downloadConfig="downloadConfig"
        title="# Shooting Victims"
        @update:filteredData="filteredFeatures = $event"
        @map:ready="handleMapReady"
      />

      <!-- Chart dashboard -->
      <ChartDashboard ref="ChartDashboard" :filteredData="filteredFeatures" />
    </div>
  </div>
</template>

<script>
import MappingDashboard from "@/components/MappingDashboard";
import ChartDashboard from "./ChartDashboard";
import HeaderMessage from "./HeaderMessage";
import Navbar from "@/components/Navbar";

import { timeParse, timeFormat } from "d3-time-format";
import { max } from "d3-array";
import { AWSFetch } from "@/utils/io";
import {
  msToTimeString,
  getMsSinceMidnight,
  timestampToTimeString,
} from "@/utils/datetime";

export default {
  name: "DashboardView",
  props: ["dataYears"],
  components: {
    Navbar,
    MappingDashboard,
    HeaderMessage,
    ChartDashboard,
  },
  data() {
    return {
      // Data
      store: {}, // The input geoJSON data for each year
      data: null, // The input geoJSON data
      filteredFeatures: null, // The filtered GeoJSON features

      // Loader flags
      isLoading: true, // Whether the data is loading
      mapReady: false, // Whether the map is ready

      // Data specific variables
      fatalCount: 0, // Count of fatal shootings
      nonfatalCount: 0, // Count of nonfatal shootings
      latestDataDate: null, // Latest date of data

      // Year-related variables
      selectedYear: undefined, // The selected year from the nav bar
      minYear: 2015, // Minimum data year
      currentYear: new Date().getFullYear(), // The current year

      // Download config
      downloadConfig: {
        exclude: ["id", "segment_id", "latino", "age_group"],
        formatters: {
          date: (d) => timeFormat("%m/%d/%Y")(new Date(d)),
          race: (d) => {
            let aliases = {
              W: "White (Non-Hispanic)",
              B: "Black (Non-Hispanic)",
              H: "Hispanic (Black or White)",
              A: "Asian",
            };
            return aliases[d] ? aliases[d] : d;
          },
          fatal: (d) => {
            let aliases = {
              1: "Fatal",
              0: "Nonfatal",
            };
            return aliases[d] ? aliases[d] : d;
          },
          sex: (d) => {
            let aliases = {
              M: "Male",
              F: "Female",
            };
            return aliases[d] ? aliases[d] : d;
          },
          has_court_case: (d) => {
            let aliases = {
              true: "Yes",
              false: "No",
            };
            return aliases[d] ? aliases[d] : d;
          },
          time: (d) => msToTimeString(d),
        },
      },
    };
  },
  mounted() {
    // Set the year
    let year = this.$route.query.year;
    if (year === undefined) year = this.dataYears[0];
    else if (year === "All Years") year = null;
    else year = parseInt(year);
    this.selectedYear = year;
  },
  computed: {
    // Map layers
    layers() {
      return [
        {
          name: "Police District",
          source: "police-district-geo",
          type: "fill",
          aggregated: true,
          overlay: true,
          column: "police",
          geoid: "DISTRICT_",
          tooltip: {
            formatter: this.tooltipFunction(
              (d) => `Police District #${d.DISTRICT_}`
            ),
            on: "mousemove",
          },
        },
        {
          name: "Council District",
          source: "council-district-geo",
          type: "fill",
          aggregated: true,
          overlay: true,
          column: "council",
          geoid: "DISTRICT",
          tooltip: {
            formatter: this.tooltipFunction(
              (d) => `Council District #${d.DISTRICT}`
            ),
            on: "mousemove",
          },
        },
        {
          name: "ZIP Code",
          source: "zip-code-geo",
          type: "fill",
          aggregated: true,
          overlay: true,
          column: "zip",
          geoid: "zip_code",
          tooltip: {
            formatter: this.tooltipFunction((d) => `${d.zip_code}`),
            on: "mousemove",
          },
        },
        {
          name: "Neighborhood",
          source: "neighborhood-geo",
          type: "fill",
          aggregated: true,
          overlay: true,
          column: "hood",
          geoid: "neighborhood",
          tooltip: {
            formatter: this.tooltipFunction((d) => `${d.neighborhood}`),
            on: "mousemove",
          },
        },
        {
          name: "PA House District",
          source: "house-district-geo",
          type: "fill",
          aggregated: true,
          overlay: true,
          column: "house_district",
          geoid: "district",
          tooltip: {
            formatter: this.tooltipFunction(
              (d) => `House District #${d.district}`
            ),
            on: "mousemove",
          },
        },
        {
          name: "Elementary School Catchment",
          source: "elementary-school-geo",
          type: "fill",
          aggregated: true,
          overlay: true,
          column: "school",
          geoid: "name",
          tooltip: {
            formatter: this.tooltipFunction((d) => `${d.name}`),
            on: "mousemove",
          },
        },
        {
          name: "City Limits",
          source: "city-limits-geo",
          type: "line",
          aggregated: false,
          static: true,
          paint: { "line-width": 4, "line-color": "#fff" },
          showOnStart: true,
        },
        {
          name: "Point locations",
          source: "shootings",
          type: "circle",
          aggregated: false,
          showOnStart: true,
          paint: {
            "circle-radius": this.getCircleRadiusStyle(),
            "circle-color": [
              "match",
              ["get", "fatal"],
              1,
              "#d84545",
              "#e5dc8e",
            ],
            "circle-stroke-width": 1,
            "circle-opacity": 0.7,
            "circle-stroke-color": [
              "match",
              ["get", "fatal"],
              1,
              "#af2828",
              "#d3c913",
            ],
          },
          tooltip: {
            formatter: (data) => {
              let aliases = {
                W: "White (Non-Hispanic)",
                B: "Black (Non-Hispanic)",
                H: "Hispanic (Black or White)",
                M: "Male",
                F: "Female",
                A: "Asian",
              };
              let fatal = data.fatal == 1 ? "Fatal" : "Nonfatal";
              let arrest = data.has_court_case ? "Yes" : "No";
              return `<div class='map-tooltip'>
              <div class="map-tooltip__title">${fatal} Shooting</div>
              <table class="w-100">
                <tbody>
                  <tr class="map-tooltip__line">
                      <td>${new Date(data.date).toDateString()}</td>
                    </tr>
                  <tr class="map-tooltip__line">
                    <td>${msToTimeString(data.time)}</td>
                  </tr>
                  <tr class="map-tooltip__line">
                    <td>${data.block_number} ${data.street_name}</td>
                  </tr>
                </tbody>
              </table>
              <div class="map-tooltip__title mt-2">Victim Info</div>
              <table class="w-100">
                <tbody>
                  <tr class="map-tooltip__line">
                    <td>${data.age} years old</td>
                  </tr>
                  <tr class="map-tooltip__line">
                    <td>${aliases[data.race]}</td>
                  </tr>
                  <tr class="map-tooltip__line">
                    <td>${aliases[data.sex]}</td>
                  </tr>
                </tbody>
              </table>
              <div class="map-tooltip__title mt-2">Incident Info</div>
              <table class="w-100">
                <tbody>
                  <tr class="map-tooltip__line">
                    <td>DC #: ${data.dc_key}</td>
                  </tr>
                  <tr class="map-tooltip__line">
                    <td>Court Case: ${arrest}</td>
                  </tr>
                </tbody>
              </table>
            </div>`;
            },
          },
        },
        {
          name: "Heat map",
          source: "shootings",
          type: "heatmap",
          aggregated: false,
          paint: {
            "heatmap-intensity": {
              stops: [
                [11, 1],
                [15, 5],
              ],
            },
            "heatmap-color": [
              "interpolate",
              ["linear"],
              ["heatmap-density"],
              0,
              "rgba(0, 0, 0, 0)",
              0.1,
              "#120d31",
              0.2,
              "#331067",
              0.3,
              "#59157e",
              0.4,
              "#7e2482",
              0.5,
              "#a3307e",
              0.6,
              "#c83e73",
              0.7,
              "#e95462",
              0.8,
              "#fa7d5e",
              0.9,
              "#fea973",
              1.0,
              "#fed395",
            ],
            "heatmap-radius": [
              "interpolate",
              ["exponential", 1.5],
              ["zoom"],
              10,
              15,
              15,
              50,
            ],
            "heatmap-opacity": {
              default: 0.9,
              stops: [
                [12, 0.9],
                [17, 0.5],
              ],
            },
          },
        },
        {
          name: "Hot spots by street block",
          source: "streets-geo",
          type: "line",
          aggregated: true,
          column: "segment_id",
          geoid: "segment_id",
          legend: {
            colorScheme: "Plasma",
            scaleName: "Log",
            colorRange: [0.5, 1],
          },
          paint: {
            "line-width": [
              "interpolate",
              ["linear"],
              ["zoom"],
              10,
              2,
              12,
              3,
              13,
              5,
            ],
          },
          tooltip: {
            formatter: this.tooltipFunction(
              (d) => `${d.block_number} ${d.street_name}`
            ),
            on: "mousemove",
          },
        },
      ];
    },
    showOverlay() {
      return this.isLoading || !this.mapReady;
    },
    sources() {
      return [
        { name: "shootings", data: this.data, filterColumn: "id" },
        {
          name: "city-limits-geo",
          url: "https://services.arcgis.com/fLeGjb7u4uXqeF9q/arcgis/rest/services/City_Limits/FeatureServer/0",
        },
        {
          name: "police-district-geo",
          url: "https://services.arcgis.com/fLeGjb7u4uXqeF9q/arcgis/rest/services/Boundaries_District/FeatureServer/0",
          outFields: ["DISTRICT_"],
        },
        {
          name: "council-district-geo",
          url: "https://services.arcgis.com/fLeGjb7u4uXqeF9q/arcgis/rest/services/Council_Districts_2016/FeatureServer/0",
          outFields: ["DISTRICT"],
        },
        {
          name: "zip-code-geo",
          url: "https://services.arcgis.com/fLeGjb7u4uXqeF9q/arcgis/rest/services/Philadelphia_ZCTA_2018/FeatureServer/0",
          outFields: ["zip_code"],
        },
        {
          name: "neighborhood-geo",
          url: "https://services.arcgis.com/fLeGjb7u4uXqeF9q/arcgis/rest/services/Philly_NTAs/FeatureServer/0",
          outFields: ["neighborhood"],
        },
        {
          name: "house-district-geo",
          url: "https://services.arcgis.com/fLeGjb7u4uXqeF9q/arcgis/rest/services/PA_House_Districts/FeatureServer/0",
          outFields: ["district"],
        },
        {
          name: "elementary-school-geo",
          url: "https://services.arcgis.com/fLeGjb7u4uXqeF9q/ArcGIS/rest/services/Philadelphia_Elementary_School_Catchments_SY_2019_2020/FeatureServer/0",
          outFields: ["name"],
        },
        {
          name: "streets-geo",
          url: "https://services.arcgis.com/fLeGjb7u4uXqeF9q/arcgis/rest/services/Philadelphia_Streets/FeatureServer/0",
          outFields: ["segment_id", "street_name", "block_number"],
          whereColumn: "segment_id",
          filterColumn: "segment_id",
          batch_size: 2000,
          formatter: {
            segment_id: (d) => `${d}`,
          },
        },
      ];
    },
    filters() {
      return [
        {
          name: "fatal",
          label: "Fatal shootings only",
          getFilter: (value) => (value ? 1 : null),
          kind: "switch",
          default: false,
        },
        {
          name: "has_court_case",
          label: "Incidents with court cases",
          getFilter: (value) => (value ? true : null),
          kind: "switch",
          default: false,
        },
        {
          name: "sex",
          label: "Gender",
          getFilter: (value) => (d) => value.indexOf(d) !== -1,
          kind: "checkbox",
          categories: [
            { value: "M", text: "Male" },
            { value: "F", text: "Female" },
          ],
          default: ["M", "F"],
        },
        {
          name: "race",
          label: "Race/Ethnicity",
          getFilter: (value) => (d) => value.indexOf(d) !== -1,
          kind: "checkbox",
          categories: [
            { value: "W", text: "White (Non-Hispanic)" },
            { value: "B", text: "Black (Non-Hispanic)" },
            { value: "H", text: "Hispanic (Black or White)" },
            { value: "A", text: "Asian" },
            { value: "Other/Unknown", text: "Other/Unknown" },
          ],
          default: ["W", "B", "H", "A", "Other/Unknown"],
        },
        {
          name: "weekday",
          label: "Day of Week",
          getFilter: (value) => (d) => value.indexOf(d) !== -1,
          kind: "checkbox",
          categories: [
            { value: 0, text: "Sunday" },
            { value: 1, text: "Monday" },
            { value: 2, text: "Tuesday" },
            { value: 3, text: "Wednesday" },
            { value: 4, text: "Thursday" },
            { value: 5, text: "Friday" },
            { value: 6, text: "Saturday" },
          ],
          default: [0, 1, 2, 3, 4, 5, 6],
          ncol: 2,
        },
        {
          name: "time",
          label: "Time of Day",
          getFilter: (value) => [value[0], value[1] + 1],
          kind: "slider",
          showHistogram: true,
          default: [0, 86399999], // ms since midnight
          tooltip: {
            formatter(msSinceMidnight) {
              return msToTimeString(msSinceMidnight);
            },
            placement(timeRange) {
              if (!timeRange) return ["bottom", "bottom"];
              if (timeRange[1] - timeRange[0] < 8 * 60 * 60 * 1000)
                return ["top", "bottom"];
              else return ["bottom", "bottom"];
            },
          },
        },
        {
          name: "date",
          label: "Date",
          getFilter: (value) => [value[0], value[1] + 1],
          kind: "slider",
          showHistogram: true,
          autoLimits: true,
          tooltip: {
            formatter(ts) {
              return timestampToTimeString(ts, "%b %-d");
            },
            placement(dateRange) {
              if (!dateRange) return ["bottom", "bottom"];
              const diff = 120 * 24 * 60 * 60 * 1000; // ms in 60 days
              if (dateRange[1] - dateRange[0] < diff) return ["top", "bottom"];
              else return ["bottom", "bottom"];
            },
          },
        },
        {
          name: "age",
          label: "Age",
          getFilter: (value, excludeUnknown) => {
            return (d) => {
              let condition =
                (parseInt(d) >= value[0]) & (parseInt(d) <= value[1]);
              return excludeUnknown
                ? d !== "Unknown" && condition
                : d === "Unknown" || condition;
            };
          },
          kind: "slider",
          showHistogram: true,
          default: [0, 100],
          excludeUnknown: true,
          tooltip: {
            formatter(value) {
              return value;
            },
            placement(value) {
              if (!value) return ["bottom", "bottom"];
              if (value[1] - value[0] < 20) return ["top", "bottom"];
              else return ["bottom", "bottom"];
            },
          },
        },
      ];
    },
  },
  watch: {
    /* When the route changes, handle year selection */
    "$route.query.year": {
      handler(newYear) {
        // If new year is undefined, use the default year (current year)
        if (newYear === undefined) newYear = this.dataYears[0];

        // When new year is null, no year is selected
        if (newYear === "All Years") newYear = null;
        // Make sure it's an integer
        else newYear = parseInt(newYear);

        // Update the selected year
        if (newYear !== this.selectedYear) this.selectedYear = newYear;
      },
    },

    /* When the selected year changes, update it*/
    async selectedYear(newYear, oldYear) {
      if (newYear === oldYear) return; // same year, do nothing
      await this.handleYearChange(newYear);
    },
  },
  methods: {
    getCircleRadiusStyle() {
      if (this.selectedYear === null) {
        return ["interpolate", ["exponential", 1.25], ["zoom"], 10, 1, 16, 9];
      } else
        return [
          "interpolate",
          ["exponential", 1.25],
          ["zoom"],
          10,
          3.5,
          16,
          11,
        ];
    },

    tooltipFunction(titleFunction) {
      return (data) => {
        // Get the total count
        let count = data["count"];

        // The title
        let title = titleFunction(data);

        let text = `<div class='map-tooltip'>
                    <div class="map-tooltip__title">${title}</div>
                      <table class="w-100">
                        <tbody>
                          <tr class="map-tooltip__line">
                            <td class="map-tooltip__line-header">Count</td>
                            <td>${count}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>`;
        return text;
      };
    },

    async fetchData(year) {
      // Download and extract the main geojson features
      let data = await AWSFetch(`shootings_${year}.json`);

      // Add additional features
      let dt;
      const parseTime = timeParse("%Y/%m/%d %H:%M:%S");
      data.features.forEach(function (d, i) {
        dt = parseTime(d.properties["date"]);
        d.properties["date"] = dt.getTime();
        d.properties["weekday"] = dt.getDay();
        d.properties["time"] = getMsSinceMidnight(dt);
        d.properties["id"] = i;
      });

      return data;
    },

    handleMapReady() {
      this.mapReady = true;
    },

    async getDataForYear(year) {
      if (this.store[year] === undefined) return await this.fetchData(year);
      else return this.store[year];
    },

    /* Handle the change in year */
    async handleYearChange(newYear) {
      // Show the loading overlay
      this.isLoading = true;

      // Fetch or set
      let data;
      if (newYear !== null) {
        data = this.store[newYear] = await this.getDataForYear(newYear);
      }
      // Handle all years
      else {
        // Download all years or get from cache
        let data_yr;
        for (let i = 0; i < this.dataYears.length; i++) {
          let year = this.dataYears[i];
          data_yr = await this.getDataForYear(year);
          if (this.store[year] === undefined) this.store[year] = data_yr;

          // Save
          if (i === 0) data = Object.assign({}, data_yr);
          else data.features = data.features.concat(data_yr.features);
        }
      }

      // Save it
      this.data = data;
      this.filteredFeatures = this.data.features;

      // Make sure everything else has updated
      this.$nextTick(() => {
        // The dashboard
        let dashboard = this.$refs.MappingDashboard;
        if (dashboard === undefined) throw Error("Dashboard not found");

        // Reset all the filters to default values
        dashboard.resetDashboard();

        // Wait for reset to propagate
        this.$nextTick(() => {
          // Set the filtered data
          this.filteredFeatures = dashboard.filteredData;

          // Update the map
          let map = dashboard.$refs.FilterableMap;
          if (map.getLayer("Point locations")) {
            map.setPaintProperty(
              "Point locations",
              "circle-radius",
              this.getCircleRadiusStyle()
            );
          }

          // Update sliders in the dashboard
          dashboard.setDefaultSliderRanges();

          // Update variables for the header message
          this.updateHeaderMessage(this.filteredFeatures);

          // Done loading!
          this.isLoading = false;
        });
      });
    },
    /* Set the variables for the header message */
    updateHeaderMessage(data) {
      // Set the max date
      this.latestDataDate = new Date(max(data, (d) => d.properties.date));

      // Set the fatal/nonfatal counts
      this.fatalCount = data.filter((el) => el.properties["fatal"] == 1).length;
      this.nonfatalCount = data.length - this.fatalCount;
    },
  },
};
</script>
