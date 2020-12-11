<template>
  <div class="dark-app-theme" id="app">
    <!-- Top app navbar -->
    <div class="app-navbar">
      <!-- Methods link -->
      <div v-show="$router.currentRoute.path == '/'">
        <router-link
          to="/about"
          class="router-link"
          title="Click for more information"
          >About<i class="ml-2 fas fa-info-circle fa-lg"></i
        ></router-link>
      </div>
      <div
        v-show="$router.currentRoute.path == '/about'"
        class="back-to-app mr-3"
      >
        <i class="fas fa-arrow-left mr-1"></i>
        <router-link to="/" class="router-link">Back</router-link>
      </div>

      <!-- Year dropdown -->
      <div v-if="$router.currentRoute.path == '/'" class="year-message-content">
        <div>Viewing data for</div>
        <div class="date-color year-dropdown">
          <button
            class="btn date-color dropdown-toggle year-dropdown-toggle"
            type="button"
            id="dropdownMenuButton"
            data-toggle="dropdown"
            aria-haspopup="true"
            aria-expanded="false"
          >
            {{ selectedYear }}
          </button>
          <div
            class="dropdown-menu date-color"
            aria-labelledby="downMenuButton"
          >
            <a
              v-for="year in dataYears"
              :key="year"
              class="dropdown-item"
              @click="handleYearSelection(year)"
              >{{ year }}</a
            >
          </div>
        </div>
      </div>
    </div>

    <!-- Content -->
    <transition name="fade" mode="out-in">
      <keep-alive>
        <router-view :key="$route.path" />
      </keep-alive>
    </transition>
  </div>
</template>

<script>
export default {
  name: "App",
  data() {
    return {
      minYear: 2015,
      currentYear: new Date().getFullYear(),
    };
  },
  computed: {
    selectedYear() {
      return this.$store.state.selectedYear;
    },
    dataYears() {
      let out = [];
      for (let year = this.minYear; year <= this.currentYear; year++) {
        out.push(year);
      }
      return out;
    },
  },
  methods: {
    handleYearSelection(year) {
      this.$store.commit("setValue", { value: year, key: "selectedYear" });
    },
  },
};
</script>

<style>
/* Navbar */

.app-navbar {
  width: 100%;
  text-align: right;
  padding: 10px;
  font-size: 1.2rem;
}
.year-message-content {
  display: flex;
  align-items: flex-end;
  justify-content: flex-end;
}
.back-to-app {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-end;
}

/* Router links */
.router-link {
  color: #fff !important;
}

.router-link:hover {
  text-decoration: underline;
}

/* Navbar - dropdown */
.year-dropdown-toggle {
  background-color: #353d42;
  text-decoration: underline;
  font-weight: bold;
  padding: 0;
  margin-left: 2.5px;
  padding-left: 5px;
  padding-right: 5px;
  font-size: inherit;
}
.year-dropdown-toggle:hover {
  color: #b2beb5;
  border-color: #b2beb5;
  background-color: #353d42;
}
.year-dropdown-toggle:active {
  color: #b2beb5;
  border-color: #b2beb5;
  background-color: #353d42;
}
.year-dropdown-toggle:focus {
  color: #b2beb5;
  border-color: #b2beb5;
  background-color: #353d42;
  box-shadow: none !important;
}
.year-dropdown .dropdown-menu {
  background-color: #353d42;
  min-width: 0rem;
  text-align: right;
  border-color: white;
  padding-left: 5px;
  padding-right: 5px;
}
.year-dropdown .dropdown-item {
  color: white !important;
  font-weight: 500;
  padding: 0.25rem 1rem !important;
}
.year-dropdown .dropdown-item:hover {
  background-color: #b2beb5 !important;
}
.year-dropdown {
  float: right;
  margin-left: 0px;
}

/* App-wide settings */
.dark-app-theme {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #fff;
  background-color: #353d42;
}

#app {
  padding-top: 5px;
  padding-bottom: 100px;
}
</style>