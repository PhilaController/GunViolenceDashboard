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

    <MappingDashboard
      ref="MappingDashboard"
      :data="data"
      v-if="data !== null"
      :filterDimensions="filterDimensions"
      :aggregationLayers="aggregationLayers"
    />

    <!-- Header message -->
    <!-- <HeaderMessage
      ref="headerMessage"
      class="header-message"
      :fatal="fatalCount"
      :nonfatal="nonfatalCount"
      :selectedYear="selectedYear"
      :currentYear="currentYear"
      :maxDate="maxDate"
      :homicideData="homicideData"
    /> -->

    <!-- Charts -->
    <!-- <ChartDashboard
      ref="chartDashboard"
      :filteredData="filteredData"
      :key="dashboardKey"
    /> -->
  </div>
</template>

<script>
import MappingDashboard from "@/components/MappingDashboard";
import { msToTimeString, timestampToTimeString } from "@/tools";

export default {
  name: "HomePage",
  components: { MappingDashboard },
  data() {
    return {
      data: null,
      defaultDateRange: null,
    };
  },
  async created() {
    // Load the data
    this.data = this.$store.state.data;
    if (!this.data) {
      this.data = await this.$store.dispatch("fetchData");
    }
  },
  computed: {
    filterDimensions() {
      return [
        {
          name: "year",
          setFilter: (value) => value,
          default: this.$store.state.selectedYear,
        },
        {
          name: "fatal",
          label: "Fatal shootings only",
          setFilter: (value) => (value ? 1 : null),
          kind: "switch",
          default: null,
        },
        {
          name: "has_court_case",
          label: "Incidents with court cases",
          setFilter: (value) => (value ? true : null),
          kind: "switch",
          default: null,
        },
        {
          name: "sex",
          label: "Gender",
          setFilter: (value) => (d) => value.indexOf(d) !== -1,
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
          setFilter: (value) => (d) => value.indexOf(d) !== -1,
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
          setFilter: (value) => (d) => value.indexOf(d) !== -1,
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
          setFilter: (value) => [value[0], value[1] + 1],
          kind: "slider",
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
          setFilter: (value) => [value[0], value[1] + 1],
          kind: "slider",
          default: [this.startDate, this.endDate],
          tooltip: {
            formatter(ts) {
              return timestampToTimeString(ts, "%b %-d");
            },
            placement(dateRange) {
              if (!dateRange) return ["bottom", "bottom"];
              const diff = 60 * 24 * 60 * 60 * 1000; // ms in 60 days
              console.log(dateRange[1] - dateRange[0] < diff);
              if (dateRange[1] - dateRange[0] < diff) return ["top", "bottom"];
              else return ["bottom", "bottom"];
            },
          },
        },
      ];
    },
    aggregationLayers() {
      return [
        {
          name: "police",
          label: "Police District",
          geoid: "DISTRICT_",
          url: "https://services.arcgis.com/fLeGjb7u4uXqeF9q/arcgis/rest/services/Boundaries_District/FeatureServer/0",
        },
        {
          name: "council",
          label: "Council District",
          geoid: "DISTRICT",
          url: "https://services.arcgis.com/fLeGjb7u4uXqeF9q/arcgis/rest/services/Council_Districts_2016/FeatureServer/0/",
        },
        {
          name: "zip",
          label: "ZIP Code",
          geoid: "zip_code",
          url: "https://services.arcgis.com/fLeGjb7u4uXqeF9q/arcgis/rest/services/Philadelphia_ZCTA_2018/FeatureServer/0",
        },
        {
          name: "hood",
          label: "Neighborhood",
          geoid: "neighborhood",
          url: "https://services.arcgis.com/fLeGjb7u4uXqeF9q/arcgis/rest/services/Philly_NTAs/FeatureServer/0",
        },
        {
          name: "house_district",
          label: "PA House District",
          geoid: "district",
          url: "https://services.arcgis.com/fLeGjb7u4uXqeF9q/arcgis/rest/services/PA_House_Districts/FeatureServer/0",
        },
        {
          name: "school",
          label: "Elementary School Catchment",
          geoid: "name",
          url: "https://services.arcgis.com/fLeGjb7u4uXqeF9q/arcgis/rest/services/Philadelphia_Elementary_School_Catchments_SY_2019_2020/FeatureServer/0",
        },
      ];
    },
    isLoading() {
      return !this.$store.state.ready;
    },
    selectedYear() {
      return this.$store.state.selectedYear;
    },
    startDate() {
      return new Date(this.selectedYear, 0, 1).getTime();
    },
    endDate() {
      return new Date(this.selectedYear, 11, 31).getTime() + 1;
    },
  },
  watch: {
    selectedYear(newYear) {
      this.$refs.MappingDashboard.handleFilterUpdate("year", newYear);
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
