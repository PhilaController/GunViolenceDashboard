<template>
  <div class="histogram-wrapper">
    <!-- Chart table -->
    <div class="chart-title-wrapper">
      <div class="chart-title">{{ title }}</div>
      <v-divider class="my-divider" />
    </div>

    <!-- The chart -->
    <vue-apex-charts
      v-if="showChart"
      class="histogram"
      :height="height"
      type="bar"
      :series="series"
      :options="chartOptions"
    />
    <!-- Message to show if no data -->
    <div class="no-data-message" v-else>No data</div>

    <!-- Chart table -->
    <a11yTable
      class="screen-reader-text"
      :table-data="groupedData"
      :categories="categories"
      :total="total"
      :aliases="aliases"
      :caption="`Tabular representation of the chart entitled '${title}'`"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";
import { ShootingVictimsFeatures } from "@/types/ShootingsData";
import a11yTable from "@/components/a11yTable.vue";

import { format } from "d3-format";
import { rollup, sum } from "d3-array";
import VueApexCharts from "vue-apexcharts";

export default defineComponent({
  name: "HistogramChart",
  props: {
    /**
     * The features data
     */
    features: { type: Array as PropType<ShootingVictimsFeatures | null> },

    /**
     * The y-axis category values
     */
    categories: {
      type: Array as PropType<string[]>,
      required: true,
    },

    /**
     * The property accessor
     */
    accessor: { type: String, required: true },

    /**
     * The chart title
     */
    title: { type: String, required: true },

    /**
     * The chart color
     */
    color: { type: String, required: true },

    /**
     * The width of the y-axis labels
     */
    labelWidth: { type: Number, default: 200 },

    /**
     * The small screen width of the y-axis labels
     */
    responsiveLabelWidth: { type: Number, default: 100 },

    /**
     * Aliases for y-axis labels
     */
    aliases: {
      type: Object,
      default: function () {
        return {};
      },
    },

    /**
     * Shortened aliases for y-axis labels
     */
    shortAliases: {
      type: Object,
      default: function () {
        return {};
      },
    },

    /**
     * The chart height
     */
    height: { type: Number, default: 350 },
  },
  components: { VueApexCharts, a11yTable },
  data() {
    return { test: 1 };
  },
  computed: {
    /**
     * Whether to show the chart
     */
    showChart(): boolean {
      if (!this.features) return false;
      else return this.features.length > 0;
    },

    /**
     * The total sum across all categories
     */
    total(): number | null {
      if (this.series) return sum(this.series[0]["data"]);
      else return null;
    },

    /**
     * Groupby/size of the data according to the accesor key
     */
    groupedData(): Map<any, number> | null {
      if (this.features) {
        return rollup(
          this.features,
          (v) => v.length,
          (d) => d.properties[this.accessor]
        );
      } else return null;
    },

    /**
     * The data fed into the apexchart; 1 series with group sizes
     */
    series(): any {
      if (this.groupedData) {
        let data = [];
        for (let i = 0; i < this.categories.length; i++)
          data.push(this.groupedData.get(this.categories[i]) || 0);
        return [{ data: data, name: "Total" }];
      } else return null;
    },

    /**
     * The chart options
     */
    chartOptions(): any {
      return {
        chart: {
          type: "bar",
          height: this.height,
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
            style: { fontSize: "1rem" },
            formatter: (d: string) => this.getAlias(d),
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
                  style: { fontSize: "0.875rem" },
                  formatter: (d: string) => this.getShortAlias(d),
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
          formatter: (d: number) => {
            if (this.total) {
              let f = format(",.0f")(d);
              let pct = ((100 * d) / this.total).toFixed(0);
              return `${f} (${pct}%)`;
            } else return "";
          },
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
          x: { show: true, formatter: (d: string) => this.getAlias(d) },
          y: { formatter: (d: number) => format(",.0f")(d) },
        },
        grid: { show: false },
      };
    },
  },
  methods: {
    /**
     * Get the alias for the specified label
     */
    getAlias(label: string): string {
      let out = this.aliases[label];
      if (out) return out;
      else return label;
    },

    /**
     * Get the short version of the alias
     */
    getShortAlias(label: string) {
      let out = this.shortAliases[label] || this.aliases[label];
      if (out) return out;
      else return label;
    },
  },
});
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
