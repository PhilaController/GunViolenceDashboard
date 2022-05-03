<template>
  <div v-if="filteredData">
    <div class="chart-wrapper">
      <LethalityHistogram :data="filteredData" />
      <ArrestHistogram :data="filteredData" />
      <GenderHistogram :data="filteredData" />
    </div>
    <div class="chart-wrapper">
      <RaceHistogram :data="filteredData" />
      <AgeHistogram :data="filteredData" />
    </div>
  </div>
</template>

<script>
import RaceHistogram from "./Charts/RaceHistogram";
import AgeHistogram from "./Charts/AgeHistogram";
import GenderHistogram from "./Charts/GenderHistogram";
import LethalityHistogram from "./Charts/LethalityHistogram";
import ArrestHistogram from "./Charts/ArrestHistogram";

export default {
  props: ["filteredData"],
  components: {
    RaceHistogram,
    AgeHistogram,
    GenderHistogram,
    LethalityHistogram,
    ArrestHistogram,
  },
};
</script>

<style>
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