<template>
  <div v-if="filteredData">
    <!-- TOP ROW -->
    <div class="chart-wrapper">
      <!-- Lethality -->
      <histogram-chart
        :features="filteredData"
        title="Outcome"
        accessor="fatal"
        color="#49bf9a"
        :categories="[true, false]"
        :aliases="{ true: 'Fatal', false: 'Nonfatal' }"
        :label-width="125"
        :height="175"
      />
      <!-- Associated court case -->
      <histogram-chart
        :features="filteredData"
        title="Associated Court Cases"
        accessor="has_court_case"
        color="#868b8e"
        :categories="[true, false]"
        :aliases="{ true: 'Yes', false: 'No' }"
        :label-width="100"
        :height="175"
      />
      <!-- Victim gender -->
      <histogram-chart
        :features="filteredData"
        title="Gender"
        accessor="sex"
        color="#964a92"
        :categories="['M', 'F']"
        :aliases="{ M: 'Male', F: 'Female' }"
        :label-width="125"
        :height="175"
      />
    </div>
    <!-- BOTTOM ROW -->
    <div class="chart-wrapper">
      <!-- Race/Ethnicity -->
      <histogram-chart
        :features="filteredData"
        title="Race/Ethnicity"
        accessor="race"
        color="#65aa63"
        :categories="['W', 'B', 'H', 'A', 'Other/Unknown']"
        :aliases="{
          W: 'White (Non-Hispanic)',
          B: 'Black (Non-Hispanic)',
          H: 'Hispanic (Black or White)',
          A: 'Asian',
          'Other/Unknown': 'Other/Unknown',
        }"
        :label-width="300"
        :responsive-label-width="150"
        :height="300"
      />

      <!-- Age -->
      <histogram-chart
        :features="filteredData"
        title="Age"
        accessor="age_group"
        color="#d6793a"
        :categories="[
          'Younger than 18',
          '18 to 30',
          '31 to 45',
          'Older than 45',
          'Unknown',
        ]"
        :short-aliases="{
          'Younger than 18': ['Younger', 'than 18'],
          'Older than 45': ['Older', 'than 45'],
        }"
        :height="300"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";
import { ShootingVictimsFeatures } from "@/types/ShootingsData";
import HistogramChart from "./HistogramChart.vue";

export default defineComponent({
  props: {
    /**
     * The currently filtered shootings point features
     */
    filteredData: { type: Array as PropType<ShootingVictimsFeatures | null> },
  },
  components: {
    HistogramChart,
  },
});
</script>

<style scoped>
.chart-wrapper {
  display: flex;
  flex-direction: row;
  align-items: center;
  margin-left: 60px;
  margin-right: 60px;
  margin-top: 40px;
}
@media only screen and (max-width: 768px) {
  .chart-wrapper {
    flex-direction: column;
    margin-left: 10px;
    margin-right: 20px;
    margin-top: 20px;
  }
}
</style>
