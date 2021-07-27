<template>
  <div class="histogram-wrapper">
    <div class="chart-title">{{ chartTitle }}</div>
    <apexchart
      class="histogram"
      :height="height"
      type="bar"
      :series="series"
      :options="chartOptions"
      v-if="showChart"
    ></apexchart>
    <div class="no-data-message" v-else>No data</div>
  </div>
</template>

<script>
import { formatNumber } from "@/tools.js";
import { rollup, sum } from "d3-array";
import VueApexCharts from "vue-apexcharts";

export default {
  props: ["data"],
  components: { apexchart: VueApexCharts },
  data() {
    return { labelWidth: 200, responsiveLabelWidth: 125 };
  },
  methods: {
    getAlias(value) {
      let out = this.aliases[value];
      if (out) return out;
      else return value;
    },
    getShortAlias(value) {
      let a = this.shortAliases;
      if (!a) a = this.aliases;
      let out = a[value];
      if (out) return out;
      else return value;
    },
  },
  computed: {
    showChart() {
      if (!this.data) return false;
      else return this.data.length > 0;
    },
    total() {
      if (this.series) return sum(this.series[0]["data"]);
    },
    groupedData() {
      if (this.data) {
        return rollup(this.data, (v) => v.length, this.dataKey);
      }
    },
    series() {
      if (this.data) {
        let data = [];
        for (let i = 0; i < this.categories.length; i++)
          data.push(this.groupedData.get(this.categories[i]) || 0);

        return [{ data: data, name: "Total" }];
      }
    },
    chartOptions() {
      return {
        chart: {
          type: "bar",
          height: 350,
          toolbar: {
            show: false,
          },
          zoom: {
            enabled: false,
          },
        },
        plotOptions: {
          bar: {
            horizontal: true,
            dataLabels: { position: "bottom" },
          },
        },
        xaxis: {
          type: "category",
          categories: this.categories,
          labels: {
            style: { fontSize: "1rem" },
          },
        },

        yaxis: {
          labels: {
            style: { fontSize: "16px" },
            formatter: (d) => this.getAlias(d),
            trim: false,
            minWidth: this.labelWidth,
            maxWidth: this.labelWidth,
          },
        },
        responsive: [
          {
            breakpoint: 767,
            options: {
              yaxis: {
                labels: {
                  style: { fontSize: "14x" },
                  formatter: (d) => this.getShortAlias(d),
                  trim: false,
                  minWidth: this.responsiveLabelWidth,
                  maxWidth: this.responsiveLabelWidth,
                },
              },
            },
          },
        ],
        colors: [this.color],
        dataLabels: {
          enabled: true,
          formatter: (d) =>
            `${formatNumber(d)} (${((100 * d) / this.total).toFixed(0)}%)`,
          textAnchor: "start",
          offsetY: 7,
          offsetX: 10,
          style: {
            fontSize: "1rem",
            fontWeight: "bold",
          },
        },
        fill: {
          opacity: 0.7,
        },
        tooltip: {
          enabled: false,
          theme: "dark",
          x: { show: true, formatter: (d) => this.getAlias(d) },
          y: { formatter: (d) => formatNumber(d) },
        },
        grid: { show: false },
      };
    },
  },
};
</script>

<style>
.no-data-message {
  font-size: 1rem;
  font-weight: 300;
  color: inherit;
  padding-left: 100px;
  text-align: center;
}
.histogram-wrapper {
  display: flex;
  justify-content: center;
  flex-direction: column;
  width: 50%;
}

@media only screen and (max-width: 768px) {
  .histogram-wrapper {
    width: 100%;
  }
  .no-data-message {
    padding-left: 0px;
  }
}

.histogram text {
  fill: #fff;
}

.chart-title {
  font-size: 1.5rem;
  font-weight: 500;
  line-height: 1.1;
  color: inherit;
  padding-left: 100px;
  margin-bottom: 1rem;
  text-align: center;
  font-family: Montserrat, sans-serif;
}
@media only screen and (max-width: 767px) {
  .chart-title {
    padding-left: 0px;
    margin-top: 10px;
  }
}
</style>