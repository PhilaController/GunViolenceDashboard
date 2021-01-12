import Vue from 'vue'
import Vuex from 'vuex'
import { json } from "d3-fetch";
import { timeParse } from "d3-time-format";
import { getMsSinceMidnight } from "@/tools.js"

Vue.use(Vuex)

const parseTime = timeParse("%Y/%m/%d %H:%M:%S");
const HOURS12 = 12 * 60 * 60 * 1000;

export default new Vuex.Store({
  state: {
    data: null,
    homicides: null,
    dataYears: null,
  },
  mutations: {
    setValue(state, payload) {
      state[payload.key] = payload.value;
    }
  },
  actions: {
    fetchData(store, { year }) {

      // Pull from Github
      let url = `https://raw.githubusercontent.com/PhiladelphiaController/gun-violence-dashboard-data/master/gun_violence_dashboard_data/data/processed/shootings_${year}.json`

      return json(url).then(function (data) {

        // Save features
        let features = data.features;

        // Convert date strings to Date objects
        features.forEach(function (d) {
          d.properties["date"] = parseTime(d.properties["date"]);
          d.properties["time"] = getMsSinceMidnight(d.properties["date"]);
        });

        // Save data and latest date
        store.commit("setValue", { value: features, key: year });

        return features;
      });

    },
    fetchHomicideData(store) {

      // Pull from Github
      let url = `https://raw.githubusercontent.com/PhiladelphiaController/gun-violence-dashboard-data/master/gun_violence_dashboard_data/data/processed/homicide_totals.json`

      return json(url).then(function (data) {
        store.commit("setValue", { value: data, key: 'homicides' });
        return data;
      });

    },
    fetchDataYears(store) {

      // Pull from Github
      let url = `https://raw.githubusercontent.com/PhiladelphiaController/gun-violence-dashboard-data/master/gun_violence_dashboard_data/data/processed/data_years.json`

      return json(url).then(function (data) {
        store.commit("setValue", { value: data, key: 'dataYears' });
        return data;
      });

    },
  },
  modules: {
  }
})
