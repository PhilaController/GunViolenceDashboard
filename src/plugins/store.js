import Vue from "vue";
import Vuex from "vuex";


Vue.use(Vuex);


export default new Vuex.Store({
  state: {
    mapLayers: [] // registered map layers
  },
  mutations: {
    addLayer(state, layer) {
      let index = state.mapLayers.findIndex(l => l.name === layer.name)
      if (index === -1)
        state.mapLayers.push(layer);
    },
    removeLayer(state, layer) {
      let index = state.mapLayers.findIndex(l => l.name === layer.name)
      if (index === -1) throw new Error("Layer not found")
      state.mapLayers.splice(index, 1);
    }
  }
});