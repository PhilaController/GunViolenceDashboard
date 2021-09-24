<template>
  <v-app class="dark-app-theme" id="app">
    <v-main>
      <!-- Top app navbar -->
      <div id="my-app-navbar">
        <!-- Methods link -->
        <v-btn
          class="back-to-app mr-3 mt-2"
          v-show="$router.currentRoute.path != '/about'"
          fab
          dark
          small
          outlined
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
              :items="dataYears"
              label=""
              dark
              dense
              hide-details
              flat
              color="#666"
              :ripple="false"
              @change="handleYearSelection"
            />
          </div>
        </div>
      </div>

      <!-- Content -->
      <transition name="fade" mode="out-in">
        <keep-alive>
          <router-view :key="$route.path" />
        </keep-alive>
      </transition>
    </v-main>
  </v-app>
</template>

<script>
export default {
  name: "App",
  data() {
    return {
      minYear: 2015,
      currentYear: new Date().getFullYear(),
      dataYears: null,
      selectedYear: null,
    };
  },
  created() {
    // Fetch the data years
    this.fetchDataYears();

    // Set the selected year
    this.selectedYear = parseInt(this.$router.currentRoute.params.selectedYear);
  },
  methods: {
    fetchDataYears() {
      this.dataYears = this.$store.state.dataYears;

      if (!this.dataYears) {
        this.$store.dispatch("fetchDataYears").then((data) => {
          this.dataYears = data;
        });
      }
    },
    handleYearSelection(year) {
      // Change the route if the selected year is different
      let currentYear = parseInt(this.$router.currentRoute.params.selectedYear);
      if (year !== currentYear) this.$router.push(`/${year}`);
    },
  },
};
</script>

<style>
/* Navbar */

#my-app-navbar {
  width: 100%;
  text-align: right;
  padding: 10px;
  font-size: 1.2rem;
  color: #b2beb5;
  background-color: #353d42;
}
.year-message-content {
  display: flex;
  align-items: flex-end;
  justify-content: flex-end;
  color: #fff !important;
}
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

/* Router links */
.router-link {
  color: #fff !important;
}

.router-link:hover {
  text-decoration: underline;
}

/* Navbar - dropdown */
#year-select {
  background-color: transparent !important;
  border-width: 0px !important;
}
#year-select-wrapper {
  width: 77px !important;
  margin-left: 0.5rem;
}
#year-select-wrapper .v-select__selection {
  font-size: 1.2rem !important;
  margin-bottom: 5px !important;
}

.v-list-item__title {
  font-size: 1rem !important;
  line-height: 1.6rem !important;
  font-weight: normal !important;
}

/* App-wide settings */
.dark-app-theme {
  font-family: Avenir, Helvetica, Arial, sans-serif !important;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #fff !important;
  background-color: #353d42 !important;
}

#app {
  padding-top: 5px;
  padding-bottom: 100px;
}
</style>