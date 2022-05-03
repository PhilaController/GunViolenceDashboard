<template>
  <div id="dashboard-navbar">
    <!-- Overlay a loader -->
    <v-overlay
      v-if="$router.currentRoute.path != '/about'"
      :value="showOverlay"
      opacity="0.3"
      color="#353d42"
    />

    <!-- About link -->
    <v-btn
      class="back-to-app mr-3 mt-2"
      v-if="$router.currentRoute.path != '/about'"
      fab
      dark
      small
      outlined
      :ripple="false"
      title="About page"
      @click="$router.push('/about')"
    >
      <i class="fas fa-info fa-lg"></i>
    </v-btn>

    <!-- Back button -->
    <v-btn
      v-else
      class="back-to-app mr-3 mt-2"
      depressed
      outlined
      dark
      :ripple="false"
      @click="$router.push({ path: '/', query: { year: selectedYear } })"
    >
      <i class="fas fa-arrow-left mr-1"></i>
      <span>Back</span>
    </v-btn>

    <!-- Year dropdown -->
    <div
      class="year-message-content"
      v-if="$router.currentRoute.path != '/about'"
    >
      <div>Viewing data for</div>
      <div id="year-select-wrapper">
        <v-select
          id="year-select"
          v-model="value"
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
          @input="$router.push({ path: '/', query: { year: $event } })"
        />
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: ["dataYears", "selectedYear", "showOverlay"],
  data() {
    return { value: null };
  },
  created() {
    this.value = this.selectedYear;
  },
  watch: {
    selectedYear(newYear) {
      if (newYear === null) newYear = "All Years";
      this.value = newYear;
    },
  },
};
</script>

<style>
#dashboard-navbar {
  width: 100%;
  text-align: right;
  padding-right: 10px;
  font-size: 1.2rem;
  color: #b2beb5;
  background-color: #353d42;
}

/* Back button */
.back-to-app {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-end;
}

.back-to-app:hover {
  background-color: #353d42;
  border-color: #fff;
}

/* Year dropdown */
#year-select {
  background-color: transparent !important;
  border-width: 0px !important;
}

#year-select {
  width: 0 !important;
  min-width: 0 !important;
}

#year-select-wrapper {
  margin-left: 0.5rem;
  margin-top: 5px;
}
#year-select-wrapper .v-select__selection {
  font-size: 1.2rem !important;
  margin-bottom: 5px !important;
  overflow: visible !important;
}

.v-list-item__title {
  font-size: 1rem !important;
  line-height: 1.6rem !important;
  font-weight: normal !important;
  overflow: visible !important;
}

.year-message-content {
  display: flex;
  align-items: flex-end;
  justify-content: flex-end;
  color: #fff !important;
}
</style>