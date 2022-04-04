<template>
  <div id="my-app-navbar">
    <!-- Methods link -->
    <v-btn
      class="back-to-app mr-3 mt-2"
      v-show="$router.currentRoute.path != '/about'"
      fab
      dark
      small
      outlined
      :ripple="false"
      title="Click for more information"
      @click="$router.push('/about')"
    >
      <i class="fas fa-info fa-lg"></i>
    </v-btn>
    <v-btn
      class="back-to-app mr-3 mt-2"
      v-show="$router.currentRoute.path == '/about'"
      depressed
      outlined
      dark
      :ripple="false"
      @click="$router.push(`/${selectedYear}`)"
    >
      <i class="fas fa-arrow-left mr-1"></i>
      <span>Back</span>
    </v-btn>

    <!-- Year dropdown -->
    <div
      class="year-message-content"
      v-if="(dataYears !== null) & ($router.currentRoute.path != '/about')"
    >
      <div>Viewing data for</div>
      <div id="year-select-wrapper">
        <v-select
          id="year-select"
          v-model="selectedYear"
          :items="['All Years', ...dataYears]"
          label=""
          dark
          dense
          hide-details
          flat
          color="#666"
          :ripple="false"
          :menu-props="{
            auto: true,
            'min-width': '90px',
          }"
          @input="handleYearChange"
        />
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: ["dataYears"],
  data() {
    return {};
  },
  created() {
    this.selectedYear = this.$store.state.selectedYear;
  },
  methods: {
    handleYearChange(newYear) {
      if (newYear == "All Years") newYear = null; // Reset to null
      this.$store.commit("setValue", { value: newYear, key: "selectedYear" });
    },
  },
};
</script>

<style>
</style>