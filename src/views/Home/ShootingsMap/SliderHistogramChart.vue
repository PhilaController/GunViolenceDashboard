<template>
  <!-- The chart -->
  <div
    class="w-100 mb-5 pb-5 d-flex justify-content-center"
    id="histogram-wrapper"
  >
    <apexchart
      id="histogram-chart"
      type="bar"
      :height="height"
      :width="width"
      :series="series"
      :options="chartOptions"
    />
  </div>
</template>

<script>
import VueApexCharts from "vue-apexcharts";

export default {
  props: ["data", "height", "width", "lower", "upper", "xmin", "xmax"],
  components: { apexchart: VueApexCharts },
  computed: {
    series() {
      return [
        {
          data: this.data.map((d) => [0.5 * (d.x0 + d.x1), d.length]),
        },
      ];
    },
    chartOptions() {
      return {
        xaxis: { type: "numeric", min: this.xmin, max: this.xmax },
        annotations: {
          xaxis: [
            {
              x: this.lower,
              borderColor: "#fff",
              borderWidth: 2,
              strokeDashArray: 0,
            },
            {
              x: this.upper,
              borderColor: "#fff",
              borderWidth: 2,
              strokeDashArray: 0,
            },
          ],
        },
        chart: {
          type: "bar",
          sparkline: {
            enabled: true,
          },
          toolbar: {
            show: false,
          },
          zoom: {
            enabled: false,
          },
        },
        colors: [
          // eslint-disable-next-line
          ({ value, seriesIndex, w }) => {
            let lower = this.data[seriesIndex].x1 < this.lower;
            let upper = this.data[seriesIndex].x0 > this.upper;
            if (lower | upper) return "#ccc";
            else return "#7ab5e5";
          },
        ],
        states: {
          hover: {
            filter: {
              type: "none",
            },
          },
          active: {
            filter: {
              type: "none",
            },
          },
        },
        plotOptions: {
          bar: {
            columnWidth: "80%",
            distributed: true,
          },
        },
        tooltip: {
          enabled: false,
        },
      };
    },
  },
};
</script>
