<template>
  <div class="cumulative-shootings-chart-wrapper">
    <div class="section-header">Daily Shooting Totals Since 2015</div>
    <apexchart
      height="600"
      type="line"
      :series="series"
      :options="chartOptions"
      id="cumulativeChart"
    ></apexchart>
  </div>
</template>

<script>
import VueApexCharts from "vue-apexcharts";

function formatNumber(d) {
  return d.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export default {
  components: { apexchart: VueApexCharts },
  data() {
    return {
      data: null,
      minYear: 2015,
      maxYear: new Date().getFullYear(),
      colorPalette: {
        2020: "#d84545",
        2019: "#7ab5e566",
        2018: "#964a9266",
        2017: "#ddd82c66",
        2016: "#65aa6366",
        2015: "#d6793a66",
      },
    };
  },
  computed: {
    colors() {
      let out = [];
      for (let year = this.maxYear; year >= this.minYear; year--) {
        out.push(this.colorPalette[year]);
      }
      return out;
    },
    chartOptions() {
      return {
        chart: {
          type: "line",
          zoom: {
            enabled: false,
          },
          toolbar: { show: false },
        },
        colors: this.colors,
        dataLabels: {
          enabled: false,
        },
        grid: {
          row: {
            colors: ["transparent"], // takes an array which will be repeated on columns
          },
          padding: {
            top: 0,
            right: 30,
            bottom: 20,
            left: 30,
          },
        },
        tooltip: {
          shared: true,
          theme: "dark",
          style: { fontSize: "1.0rem" },
          y: {
            formatter: (v) => (v != null ? formatNumber(v) : v),
          },
          x: {
            formatter: (date) => {
              return this.categories[date - 1];
            },
          },
        },
        xaxis: {
          type: "category",
          categories: this.categories,
          tooltip: { enabled: false },
          axisTicks: {
            show: false,
          },
          labels: {
            show: true,
            style: { fontSize: "0.9rem" },
            formatter: (day) => {
              if (day) {
                if (day.indexOf("01") !== -1) return day.replace("0", "");
                else if (day == "Dec 31") return day;
              }
              return "";
            },
          },
        },
        yaxis: {
          labels: {
            formatter: (v) => (v != null ? formatNumber(v) : v),
            style: { fontSize: "1.2rem" },
          },
        },
        legend: {
          labels: { colors: ["#fff"] },
          fontSize: "18px",
          position: "top",
          offsetY: -50,
        },
      };
    },
    categories() {
      if (this.data) return this.data["date"];
      else return [];
    },
    series() {
      let out = [];
      if (!this.data) return out;

      for (let year = this.maxYear; year >= this.minYear; year--) {
        out.push({ name: year, data: this.data[`${year}`] });
      }
      return out;
    },
  },
  created() {
    this.getData().then((data) => (this.data = data));
  },
  methods: {
    getData(year) {
      // Get the data for the full year from the data store
      let d = this.$store.state["daily"];

      // Fetch it from Github if we need to
      if (!d) {
        return this.$store.dispatch("fetchDailyData", {
          year: year,
        });
      }
    },
  },
};
</script>

<style>
#cumulativeChart {
  max-width: 1000px;
  margin-top: 30px;
  margin: auto;
}
#cumulativeChart text {
  fill: #fff;
}
.cumulative-shootings-chart-wrapper {
  margin-top: 100px;
}
</style>