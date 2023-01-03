<template>
  <div class="dashboard-view">
    <!-- Top app navbar -->
    <navbar
      :data-years="dataYears"
      :selected-year="selectedYear"
      :show-overlay="showOverlay"
    />

    <!-- Header message -->
    <header-message
      ref="headerMessage"
      :fatal="fatalCount"
      :nonfatal="nonfatalCount"
      :current-year="currentYear"
      :min-year="minYear"
      :selected-year="selectedYear"
      :latest-data-date="latestDataDate"
      :show-overlay="showOverlay"
    />

    <!-- Display dashboard when data is loaded -->
    <div v-if="data !== null">
      <!-- Map -->
      <!-- <mapping-dashboard
        ref="MappingDashboard"
        :data="data"
        :filters="filters"
        :layers="layers"
        :sources="sources"
        :download-config="downloadConfig"
        title="# Shooting Victims"
        marker-title="shooting victim"
        marker-short-title="victim"
        @update:filtered-data="filteredFeatures = $event"
        @map:ready="mapReady = true"
      /> -->

      <!-- Charts -->
      <!-- <chart-dashboard ref="ChartDashboard" :filtered-data="filteredFeatures" /> -->
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";
import Vue from "vue";
import { Route, NavigationGuardNext } from "vue-router";

// Local
import MappingDashboard from "@/components/MappingDashboard/index.vue";
import ChartDashboard from "./ChartDashboard.vue";
import HeaderMessage from "./HeaderMessage.vue";
import Navbar from "@/components/Navbar.vue";
import {
  getMsSinceMidnight,
  msToTimeString,
  timestampToTimeString,
} from "@/utils/datetime";

// Types
import {
  ShootingVictimsGeoJson,
  ShootingVictimsProperties,
  ShootingVictimsFeatures,
  RaceValues,
  SexValues,
} from "@/types/ShootingsData";
import { LayerConfig, TitleFunction } from "@/types/Layers";
import { SourceConfig } from "@/types/Sources";
import { FilterConfig } from "@/types/Filters";
import { DownloadConfig } from "@/types/DownloadConfig";

// External
import { max } from "d3-array";
import { format } from "d3-format";
import { timeParse } from "d3-time-format";
import { Feature, Point } from "geojson";

/**
 * The main dashboard component.
 */
export default defineComponent({
  name: "DashboardView",
  props: {
    /**
     * An array of the years for which we have data
     */
    dataYears: { type: Array as PropType<Array<number>>, required: true },
  },
  components: {
    Navbar,
    MappingDashboard,
    HeaderMessage,
    ChartDashboard,
  },
  data() {
    return {
      /**
       * Store the previous route
       */
      prevRoute: null as null | string,

      /**
       * Data store to cache geosjon data
       */
      store: {} as { [key: number]: ShootingVictimsGeoJson },

      /**
       * Current geojson data
       */
      data: null as ShootingVictimsGeoJson | null,

      /**
       * The filtered geojson features array
       */
      filteredFeatures: null as ShootingVictimsFeatures | null,

      /**
       * Whether the data is still loading
       */
      isLoading: true, //

      /**
       * Whether the map is initialized
       */
      mapReady: false,

      /**
       * The count of fatal shootings
       */
      fatalCount: 0,

      /**
       * The count of nonfatal shootings
       */
      nonfatalCount: 0,

      /**
       * The latest date in the current data
       */
      latestDataDate: null as null | Date,

      /**
       * The currently selected year;
       * When all years are selected, value is null
       */
      selectedYear: undefined as number | null | undefined,

      /**
       * Minimum data year
       */
      minYear: 2015,

      /**
       * The current year
       */
      currentYear: new Date().getFullYear(),
    };
  },
  mounted() {
    /**
     * When mounted, determine if there is a year query param and use it,
     * if not, use the default data year (latest year).
     */

    // The year query param
    let routeYear = this.$route.query?.year;

    // Use the query param year
    if (typeof routeYear == "string") {
      if (routeYear == "All Years") this.selectedYear = null;
      else this.selectedYear = parseInt(routeYear);
    }
    // No query param year so use default
    else {
      // If undefined, use the default value (current year)
      this.selectedYear = this.dataYears[0];

      // Update the query param in the path
      this.$router.push({
        path: this.$route.fullPath,
        query: { year: this.selectedYear.toString() },
      });
    }
  },
  computed: {
    /**
     * Configuration options for when data is downloaded
     */
    downloadConfig(): DownloadConfig {
      return {
        exclude: ["segment_id", "latino", "age_group", "dateInMs", "timeInMs"],
        formatters: {
          race: (d: RaceValues) => {
            let aliases = {
              W: "White (Non-Hispanic)",
              B: "Black (Non-Hispanic)",
              H: "Hispanic (Black or White)",
              A: "Asian",
              "Other/Unknown": "Other/Unknown",
            };
            return aliases[d];
          },
          fatal: (d: true | false) => {
            return d ? "Fatal" : "Nonfatal";
          },
          sex: (d: SexValues) => {
            let aliases = {
              M: "Male",
              F: "Female",
            };
            return aliases[d];
          },
          has_court_case: (d: true | false) => {
            return d ? "Yes" : "No";
          },
        },
      };
    },

    /**
     * Array of configuration options for map layers
     */
    layers(): LayerConfig[] {
      return [
        {
          name: "Police District",
          source: "police-district-geo",
          type: "fill",
          aggregated: true,
          overlay: true,
          column: "police_district",
          geoid: "DISTRICT_",
          tooltip: {
            formatter: this.tooltipFunction(
              (d: { DISTRICT_: string }) => `Police District #${d.DISTRICT_}`
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
          column: "council_district",
          geoid: "DISTRICT",
          tooltip: {
            formatter: this.tooltipFunction(
              (d: { DISTRICT: number }) => `Council District #${d.DISTRICT}`
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
          column: "zip_code",
          geoid: "zip_code",
          tooltip: {
            formatter: this.tooltipFunction(
              (d: { zip_code: number }) => `${d.zip_code}`
            ),
            on: "mousemove",
          },
        },
        {
          name: "Neighborhood",
          source: "neighborhood-geo",
          type: "fill",
          aggregated: true,
          overlay: true,
          column: "neighborhood",
          geoid: "neighborhood",
          tooltip: {
            formatter: this.tooltipFunction(
              (d: { neighborhood: string }) => d.neighborhood
            ),
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
              (d: { district: number }) => `House District #${d.district}`
            ),
            on: "mousemove",
          },
        },
        {
          name: "PA Senate District",
          source: "senate-district-geo",
          type: "fill",
          aggregated: true,
          overlay: true,
          column: "senate_district",
          geoid: "district",
          tooltip: {
            formatter: this.tooltipFunction(
              (d: { district: number }) => `Senate District #${d.district}`
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
          column: "school_name",
          geoid: "name",
          tooltip: {
            formatter: this.tooltipFunction(
              (d: { name: string }) => `${d.name}`
            ),
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
            on: "mouseover",
            formatter: (data: ShootingVictimsProperties) => {
              let aliases = {
                W: "White (Non-Hispanic)",
                B: "Black (Non-Hispanic)",
                H: "Hispanic (Black or White)",
                M: "Male",
                F: "Female",
                A: "Asian",
              };
              let fatal = data.fatal ? "Fatal" : "Nonfatal";
              let arrest = data.has_court_case ? "Yes" : "No";
              let text = `<div class='map-tooltip'>
              <div class="map-tooltip__title">${fatal} Shooting</div>
              <table class="w-100">
                <tbody>
                  <tr class="map-tooltip__line">
                      <td>${new Date(data.date).toDateString()}</td>
                    </tr>
                  <tr class="map-tooltip__line">
                    <td>${msToTimeString(data.timeInMs)}</td>
                  </tr>
                  <tr class="map-tooltip__line">
                    <td>${data.block_number} ${data.street_name}</td>
                  </tr>
                </tbody>
              </table>
              <div class="map-tooltip__title mt-2">Victim Info</div>
              <table class="w-100">
                <tbody>`;

              if (data.age !== null)
                text += `<tr class="map-tooltip__line">
                    <td>${data.age} years old</td>
                  </tr>`;

              if (data.race !== "Other/Unknown")
                text += `<tr class="map-tooltip__line">
                    <td>${aliases[data.race]}</td>
                  </tr>`;

              text += `<tr class="map-tooltip__line">
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
              return text;
            },
          },
        },
        {
          name: "Heat map",
          source: "shootings",
          type: "heatmap",
          aggregated: false,
          beforeId: "Point locations",
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
          beforeId: "Point locations",
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
              (d: { block_number: number; street_name: string }) =>
                `${d.block_number} ${d.street_name}`
            ),
            on: "mousemove",
          },
        },
      ];
    },

    /**
     * Array of configuration options for loading source data for map
     */
    sources(): SourceConfig[] {
      return [
        { name: "shootings", data: this.data, filterColumn: "dc_key" },
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
          name: "senate-district-geo",
          url: "https://services.arcgis.com/fLeGjb7u4uXqeF9q/arcgis/rest/services/PA_Senate_Districts/FeatureServer/0",
          outFields: ["district"],
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
          batchSize: 2000,
          formatter: {
            segment_id: (d: number | string) => `${d}`,
          },
        },
      ];
    },

    /**
     * Array of configuration options different map filters
     */
    filters(): FilterConfig[] {
      return [
        {
          name: "fatal",
          label: "Fatal shootings only",
          getFilter: (value: boolean) => (value ? true : null),
          kind: "switch",
          default: false,
        },
        {
          name: "has_court_case",
          label: "Incidents with court cases",
          getFilter: (value: boolean) => (value ? true : null),
          kind: "switch",
          default: false,
        },
        {
          name: "sex",
          label: "Gender",
          getFilter: (value: string[]) => (d: string) =>
            value.indexOf(d) !== -1,
          kind: "checkbox",
          categories: [
            { value: "M", text: "Male" },
            { value: "F", text: "Female" },
          ],
          default: ["M", "F"],
          ncol: 1,
        },
        {
          name: "race",
          label: "Race/Ethnicity",
          getFilter: (value: string[]) => (d: string) =>
            value.indexOf(d) !== -1,
          kind: "checkbox",
          categories: [
            { value: "W", text: "White (Non-Hispanic)" },
            { value: "B", text: "Black (Non-Hispanic)" },
            { value: "H", text: "Hispanic (Black or White)" },
            { value: "A", text: "Asian" },
            { value: "Other/Unknown", text: "Other/Unknown" },
          ],
          default: ["W", "B", "H", "A", "Other/Unknown"],
          ncol: 1,
        },
        {
          name: "weekday",
          label: "Day of Week",
          getFilter: (value: number[]) => (d: number) =>
            value.indexOf(d) !== -1,
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
          default: [0, 86399999], // ms since midnight
          showHistogram: true,
          autoLimits: false,
          excludeMissing: false,
          tooltip: {
            formatter(msSinceMidnight) {
              return msToTimeString(msSinceMidnight);
            },
          },
        },
        {
          name: "date",
          label: "Date",
          getFilter: (value) => {
            let start = new Date(value[0]);
            start.setHours(0, 0, 0, 0);

            let end = new Date(value[1]);
            end.setHours(23, 59, 59, 999);
            return [start.getTime(), end.getTime()];
          },
          kind: "slider",
          showHistogram: true,
          autoLimits: true,
          excludeMissing: false,
          tooltip: {
            formatter: (ts) =>
              this.selectedYear === null
                ? timestampToTimeString(ts, "%-m/%-d/%y")
                : timestampToTimeString(ts, "%b %-d"),
          },
        },
        {
          name: "age",
          label: "Age",
          getFilter: (value, excludeMissing) => {
            return (d: number) => {
              let condition = d >= value[0] && d <= value[1];
              return excludeMissing
                ? d !== null && condition
                : d === null || condition;
            };
          },
          kind: "slider",
          default: [0, 100],
          showHistogram: true,
          autoLimits: false,
          excludeMissing: true,
          tooltip: {
            formatter: (value) => `${value}`,
          },
        },
      ];
    },

    /**
     * Whether to show the loading overlay
     */
    showOverlay(): boolean {
      return this.isLoading || !this.mapReady;
    },
  },
  watch: {
    /**
     * Track the previous route when it changes
     */
    $route: {
      handler(to: Route, from: Route) {
        if (from) this.prevRoute = from.path;
      },
      immediate: true,
    },

    /**
     * When the route changes, handle year selection
     * Only update if we are still on the main page (not coming from about/)
     */
    "$route.query.year": {
      handler(newYear) {
        // Do nothing if we are coming from about page
        if (this.$route.path == "/about") return;
        if (this.prevRoute === "/about") return;

        // If new year is undefined, use the default year (current year)
        if (newYear === undefined) newYear = this.dataYears[0];

        // When new year is null, no year is selected
        if (newYear === "All Years") newYear = null;
        // Make sure it's an integer
        else newYear = parseInt(newYear);

        // Update the selected year
        if (newYear !== this.selectedYear) {
          this.selectedYear = newYear;
        }
      },
    },

    /**
     * When the selected year changes, update the dashboard
     */
    async selectedYear(newYear, oldYear) {
      if (newYear === oldYear) return; // same year, do nothing
      await this.handleYearChange(newYear);
    },
  },
  methods: {
    /**
     * Update the prevRoute attribute before going to the next route
     */
    beforeRouteEnter(to: Route, from: Route, next: NavigationGuardNext) {
      next((vm: Vue & { prevRoute?: string | null }) => {
        vm.prevRoute = from.path;
      });
    },

    /**
     * Based on the selected year, get the circle radius style.
     *
     * This uses smaller circles if we are showing data for all years.
     */
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

    /**
     * Return a function that generates the tooltip string from the data.
     *
     * @param titleFunc A function that returns the tooltip title
     */
    tooltipFunction(titleFunc: TitleFunction): (data: any) => string {
      return (data) => {
        // Get the total count
        let count = data["count"];

        // The title
        let title = titleFunc(data);

        let text = `<div class='map-tooltip'>
                    <div class="map-tooltip__title">${title}</div>
                      <table class="w-100">
                        <tbody>
                          <tr class="map-tooltip__line">
                            <td class="map-tooltip__line-header">Count</td>
                            <td>${format(",.0f")(count)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>`;
        return text;
      };
    },

    /**
     * Fetch the data for the specified year
     *
     * @param year the year of the data to fetch
     * @returns the feature collection of shooting victim data
     */
    async fetchData(year: number): Promise<ShootingVictimsGeoJson> {
      // Fetch the data from AWS
      const url = "https://gun-violence-dashboard.s3.amazonaws.com/";
      const response = await fetch(url + `shootings_test_${year}.json`);
      let data = await response.json();

      // Format for the time
      const parseTime = timeParse("%Y/%m/%d %H:%M:%S");

      // Loop over features
      data.features.forEach(
        (d: Feature<Point | null, ShootingVictimsProperties>) => {
          // Parse the date
          let dt = parseTime(d.properties["date"]);

          // Add additional date properties
          if (dt) {
            let ms = dt.getTime();
            d.properties["dateInMs"] = ms;
            d.properties["timeInMs"] = getMsSinceMidnight(ms);
            d.properties["weekday"] = dt.getDay();
          }
        }
      );

      return data;
    },

    /**
     * Return data from the `store` cache or fetch it
     */
    async getDataForYear(year: number): Promise<ShootingVictimsGeoJson> {
      if (this.store[year] === undefined) return await this.fetchData(year);
      else return this.store[year];
    },

    /**
     * The main function to update the dashboard when the year changes
     * @param newYear Display data for the specified value
     */
    async handleYearChange(newYear: number | null) {
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
        }

        // Now combine each year into a single Feature Collection
        data = Object.assign({}, this.store[this.dataYears[0]]);
        for (let i = 1; i < this.dataYears.length; i++) {
          let year = this.dataYears[i];
          data.features.concat(this.store[year].features);
        }
      }

      // Save
      this.data = data;
      this.filteredFeatures = this.data.features;

      // Make sure everything else has updated
      this.$nextTick(() => {
        // The dashboard
        let dashboard = this.$refs.MappingDashboard;
        if (dashboard === undefined) throw Error("Dashboard not found");

        // Reset all the filters to default values
        //dashboard.resetDashboard();

        // Wait for reset to propagate
        this.$nextTick(() => {
          // Set the filtered data
          //this.filteredFeatures = dashboard.filteredData;

          // Update the map
          //let map = dashboard.$refs.FilterableMap;
          // if (map.getLayer("Point locations")) {
          //   map.setPaintProperty(
          //     "Point locations",
          //     "circle-radius",
          //     this.getCircleRadiusStyle()
          //   );
          // }

          // Update sliders in the dashboard
          //dashboard.setDefaultSliderRanges();

          // Update variables for the header message
          if (this.filteredFeatures !== null)
            this.updateHeaderMessage(this.filteredFeatures);

          // Done loading!
          this.isLoading = false;
        });
      });
    },

    /**
     * Set the variables for the header message
     */
    updateHeaderMessage(data: ShootingVictimsFeatures) {
      // Set the max date
      let maxDateInMs = max(data, (d) => d.properties.dateInMs);
      if (maxDateInMs !== undefined)
        this.latestDataDate = new Date(maxDateInMs);

      // Set the fatal/nonfatal counts
      this.fatalCount = data.filter(
        (el) => el.properties.fatal === true
      ).length;
      this.nonfatalCount = data.length - this.fatalCount;
    },
  },
});
</script>
