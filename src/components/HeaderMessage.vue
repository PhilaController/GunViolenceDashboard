<template>
  <div class="header-message">
    <h1>
      In Philadelphia, there were
      <br /><span class="nonfatal"
        >{{ formatNumber(nonfatal) }} nonfatal shootings</span
      >
      and
      <br /><span class="fatal">{{ formatNumber(fatal) }} fatal shootings</span
      ><br />
      from <span class="green">{{ formattedMinDate }}</span> to
      <span class="green">{{ formattedMaxDate }}, {{ selectedYear }} </span>
    </h1>
  </div>
</template>

<script>
export default {
  props: ["fatal", "nonfatal", "dateRange", "selectedYear"],
  computed: {
    formattedMinDate() {
      if (this.dateRange) return this.formatDate(this.dateRange[0]);
    },
    formattedMaxDate() {
      if (this.dateRange) {
        let dt = this.dateRange[1];
        let temp = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate() - 1);
        return this.formatDate(temp);
      }
    },
  },
  watch: {
    formattedMinDate(nextValue, prevValue) {
      this.$store.commit("setValue", {
        value: nextValue,
        key: "minFormattedDate",
      });
    },
    formattedMaxDate(nextValue, prevValue) {
      this.$store.commit("setValue", {
        value: nextValue,
        key: "maxFormattedDate",
      });
    },
  },
  methods: {
    formatNumber(d) {
      return d.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    },
    formatDate(dt) {
      return dt.toLocaleString("default", {
        month: "short",
        day: "numeric",
      });
    },
  },
};
</script>

<style>
.header-message {
  max-width: 800px;
  margin: auto;
}
</style>