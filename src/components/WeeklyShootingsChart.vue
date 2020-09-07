<template>
  <div class="weekly-shootings-chart-wrapper">
    <div class="section-header">Weekly Shooting Totals</div>
    <apexchart
      id="weeklyChart"
      height="300"
      type="bar"
      :series="series"
      :options="chartOptions"
    ></apexchart>
  </div>
</template>

<script>
import { rollup } from "d3-array";
import { timeSunday, timeYear } from "d3-time";
import VueApexCharts from "vue-apexcharts";

function getWeek(dt) {
  return timeSunday.count(timeYear(dt), dt) + 1;
}

function subtractOneDay(dt) {
  return new Date(dt.getFullYear(), dt.getMonth(), dt.getDate() - 1);
}

export default {
  props: ["data", "selectedYear", "dateRange"],
  data() {
    return {};
  },
  components: { apexchart: VueApexCharts },
  computed: {
    weekNumbers() {
      let out = [];
      for (let wk = 1; wk < 54; wk++) out.push(wk);
      return out;
    },
    weeklyData() {
      if (this.data) {
        return rollup(
          this.data,
          (v) => v.length,
          (d) => d.properties.fatal == 1,
          (d) => getWeek(d.properties.date)
        );
      }
    },
    fatalShootings() {
      if (this.weeklyData) {
        let d = this.weeklyData.get(true);
        if (!d) return [];
        let out = [];
        for (let wk = 1; wk < 54; wk++) {
          out.push(d.get(wk) || 0);
        }
        return out;
      } else return [];
    },
    nonfatalShootings() {
      if (this.weeklyData) {
        let d = this.weeklyData.get(false);
        if (!d) return [];
        let out = [];
        for (let wk = 1; wk < 54; wk++) {
          out.push(d.get(wk) || 0);
        }
        return out;
      } else return [];
    },
    series() {
      return [
        { name: "Fatal", data: this.fatalShootings },
        { name: "Nonfatal", data: this.nonfatalShootings },
      ];
    },
    selectionMin() {
      return getWeek(this.dateRange[0]) - 0.5;
    },
    selectionMax() {
      return getWeek(subtractOneDay(this.dateRange[1])) + 0.5;
    },
    chartOptions() {
      return {
        chart: {
          type: "bar",
          height: 350,
          stacked: true,
          toolbar: {
            show: false,
          },
          zoom: {
            enabled: false,
          },
        },
        plotOptions: {
          bar: {
            horizontal: false,
          },
        },
        annotations: {
          position: "back",
          xaxis: [
            {
              x: this.dateRange ? this.selectionMin : null,
              x2: this.dateRange ? this.selectionMax : null,
              fillColor: "#868b8e",
              borderColor: "#868b8e",
              strokeDashArray: 0,
              opacity: 0.2,
              label: {
                text: "",
              },
            },
          ],
        },
        xaxis: {
          type: "numeric",
          categories: this.weekNumbers,
          labels: { show: false },
          axisTicks: { show: false },
        },
        yaxis: {
          min: 0,
          max: 100,
          tickAmount: 5,
          labels: {
            style: { fontSize: "1rem" },
            formatter: (d) => d.toFixed(0),
          },
        },
        colors: ["#d84545", "#e5dc8e"],
        dataLabels: {
          enabled: false,
        },
        legend: {
          show: false,
        },
        fill: {
          opacity: 0.7,
        },
        tooltip: {
          theme: "dark",
          x: { show: true, formatter: (d) => `Week: ${d}` },
          y: { formatter: (d) => d.toFixed(0) },
        },
        grid: { borderColor: "#cfcfcf4d" },
      };
    },
  },
};
</script>

<style>
.weekly-shootings-chart-wrapper {
  margin-top: 150px;
  display: flex;
  justify-content: center;
  flex-direction: column;
}
#weeklyChart {
  margin: auto;
  max-width: 1000px;
  width: 100%;
}
#weeklyChart text {
  fill: #fff;
}
</style>