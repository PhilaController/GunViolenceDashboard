import Vue from 'vue'
import Vuex from 'vuex'
import { json } from "d3-fetch";
import { timeParse } from "d3-time-format";

Vue.use(Vuex)

const parseTime = timeParse("%Y/%m/%d %H:%M:%S");

export default new Vuex.Store({
  state: {
    data: null,
    minFormattedDate: null,
    maxFormattedDate: null,
  },
  mutations: {
    setValue(state, payload) {
      state[payload.key] = payload.value;
    }
  },
  actions: {
    fetchDailyData(store) {

      // Pull from Github
      let url = `https://raw.githubusercontent.com/PhiladelphiaController/gun-violence-dashboard-data/master/gun_violence_dashboard_data/data/shootings_cumulative_daily.json`

      return json(url).then(function (data) {

        // Save data 
        store.commit("setValue", { value: data, key: "daily" });
        return data;
      });

    },
    fetchData(store, { year }) {

      // Pull from Github
      let url = `https://raw.githubusercontent.com/PhiladelphiaController/gun-violence-dashboard-data/master/gun_violence_dashboard_data/data/shootings_${year}.json`

      return json(url).then(function (data) {

        // Save features
        let features = data.features;

        // Convert date strings to Date objects
        let dates = [];
        features.forEach(function (d) {
          d.properties["date"] = parseTime(d.properties["date"]);
          dates.push(d.properties["date"])
        });

        // Save data and latest date
        store.commit("setValue", { value: features, key: year });

        return features;
      });

    },
  },
  modules: {
  }
})
