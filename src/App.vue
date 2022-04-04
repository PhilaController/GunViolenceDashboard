<template>
  <div data-vuetify>
    <v-app class="dark-app-theme" id="app">
      <v-main>
        <!-- Overlay a lodader -->
        <v-overlay :value="isLoading" opacity="1" color="#353d42">
          <v-progress-circular indeterminate size="64" color="#fff" />
        </v-overlay>

        <!-- Top app navbar -->
        <Navbar :dataYears="dataYears" />

        <!-- Content -->
        <router-view :key="$route.path" />
      </v-main>
    </v-app>
  </div>
</template>

<script>
import Navbar from "@/components/Navbar";

export default {
  name: "App",
  components: {
    Navbar,
  },
  data() {
    return {
      minYear: 2015,
      currentYear: new Date().getFullYear(),
    };
  },

  computed: {
    isLoading() {
      return !this.$store.state.ready;
    },
    dataYears() {
      return this.$store.state.dataYears;
    },
  },
};
</script>

<style>
/* Navbar */

#my-app-navbar {
  width: 100%;
  text-align: right;
  padding-right: 10px;
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

/* App-wide settings */
.dark-app-theme {
  font-family: Avenir, Helvetica, Arial, sans-serif !important;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;

  color: #fff !important;
  background-color: #353d42 !important;
}

#app {
  padding-top: 5px !important;
  padding-bottom: 100px;
  overflow-x: hidden;
}

@media only screen and (min-width: 740px) and (max-width: 1000px) {
  #app {
    padding-top: 20px !important;
  }
}

#app h2,
h3 {
  margin-top: 0 !important;
  margin-bottom: 1rem !important;
}

.help-message {
  font-weight: normal !important;
  padding-bottom: 1rem;
}
</style>