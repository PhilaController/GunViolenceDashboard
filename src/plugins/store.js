import Vue from "vue";
import Vuex from "vuex";
import { githubFetch, AWSFetch, parseTime, getMsSinceMidnight } from "@/tools.js"

Vue.use(Vuex);


export default new Vuex.Store({
  state: {
    dataYears: null, // years where we have data
    homicideData: null, // homicide data
    data: null, // shootings data
    ready: false, // ready to use data
    selectedYear: null // selected year
  },
  actions: {
    async fetchData(store) {

      // Download and extract the features
      // const data = await AWSFetch("shootings_all.json");
      const data = await require("@/data/shootings_all.json");
      let features = data.features;

      // Format data
      let dt;
      features.forEach(function (d) {

        // Parse date and time
        dt = parseTime(d.properties["date"]);
        d.properties["date"] = dt.getTime();
        d.properties["year"] = dt.getFullYear();
        d.properties["weekday"] = dt.getDay();
        d.properties["time"] = getMsSinceMidnight(dt);
      });


      // Store the values
      store.commit("setValue", { value: true, key: "ready" });
      store.commit("setValue", { value: features, key: "data" });

      return features;

    },
    async fetchYears(store) {
      const dataYears = await githubFetch("data_years.json");
      store.commit("setValue", { value: dataYears, key: "dataYears" });
      store.commit("setValue", { value: parseInt(dataYears[0]), key: "selectedYear" });
      return dataYears
    },
    async fetchHomicideData(store) {
      const homicideData = await githubFetch("homicide_totals.json");
      store.commit("setValue", { value: homicideData, key: "homicideData" });
      return homicideData
    }
  },
  mutations: {
    setValue(state, payload) {
      state[payload.key] = payload.value;
    }
  }
});