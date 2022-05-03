<template>
  <div class="histogram-wrapper">
    <!-- Chart table -->
    <div class="chart-title-wrapper">
      <div class="chart-title">{{ chartTitle }}</div>
      <v-divider class="my-divider" />
    </div>

    <!-- The chart -->
    <apexchart
      class="histogram"
      :height="height"
      type="bar"
      :series="series"
      :options="chartOptions"
      v-if="showChart"
    ></apexchart>
    <!-- Message to show if no data -->
    <div class="no-data-message" v-else>No data</div>

    <!-- Chart table -->
    <a11yTable
      v-show="false"
      aria-hidden="true"
      :data="groupedData"
      :categories="categories"
      :total="total"
      :aliases="aliases"
      :caption="`Tabular representation of the chart entitled '${chartTitle}'`"
    />
  </div>
</template>

<script>
// Internal
import a11yTable from "@/components/a11yTable";
import { format } from "d3-format";
import { CATEGORIES, ALIASES } from "@/data-dict";

// External
import { rollup, sum } from "d3-array";
import VueApexCharts from "vue-apexcharts";

export default {
  props: ["data"],
  components: { apexchart: VueApexCharts, a11yTable },
  data() {
    return {
      labelWidth: 200,
      responsiveLabelWidth: 100,
      key: null,
      dataKey: (d) => d.properties[this.key],
    };
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
    categories() {
      return CATEGORIES[this.key];
    },
    aliases() {
      return ALIASES[this.key] || {};
    },
    showChart() {
      if (!this.data) return false;
      else return this.data.length > 0;
    },
    total() {
      if (this.series) return sum(this.series[0]["data"]);
      else return null;
    },
    groupedData() {
      if (this.data) {
        return rollup(this.data, (v) => v.length, this.dataKey);
      } else return null;
    },
    series() {
      if (this.data) {
        let data = [];
        for (let i = 0; i < this.categories.length; i++)
          data.push(this.groupedData.get(this.categories[i]) || 0);
        return [{ data: data, name: "Total" }];
      } else return null;
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
            horizontal: true,
            barHeight: "60%",
            dataLabels: { position: "bottom" },
          },
        },
        xaxis: {
          type: "category",
          categories: this.categories,
          labels: {
            show: false,
          },
          axisTicks: { show: false },
          axisBorder: { width: 5 },
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
            `${format(",.0f")(d)} (${((100 * d) / this.total).toFixed(0)}%)`,
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
          y: { formatter: (d) => format(",.0f")(d) },
        },
        grid: { show: false },
      };
    },
  },
};
</script>

<style>
.apexcharts-text apexcharts-yaxis-label {
  dominant-baseline: central !important;
}
.apexcharts-yaxis-texts-g text {
  dominant-baseline: central !important;
}
.apexcharts-grid line:nth-last-child(2) {
  stroke: #353d42 !important;
}
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
.chart-title-wrapper {
  padding-left: 75px;
}

.chart-title {
  font-size: 1.5rem;
  font-weight: 500;
  line-height: 1.1;
  color: inherit;
  margin-bottom: 1rem;
  text-align: center;
  font-family: Montserrat, sans-serif;
}
@media only screen and (max-width: 767px) {
  .chart-title {
    margin-top: 10px;
  }
  .chart-title-wrapper {
    padding-left: 0px;
  }
}
.my-divider {
  max-width: 90px !important;
}
</style>