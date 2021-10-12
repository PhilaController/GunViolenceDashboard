// External
import Vue from 'vue'
import $ from 'jquery'

// App and router
import App from '@/App'
import { getRouter } from "@/plugins/router";
import vuetify from '@/plugins/vuetify' // path to vuetify export

// Leaflet
import { Icon } from "leaflet";
import "leaflet/dist/leaflet.css";

// Don't show tip
Vue.config.productionTip = false;

// Fix leaflet icons
delete Icon.Default.prototype._getIconUrl;
Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png")
});


// load and set the HTML template we are using
let audit_content = $("#main");
audit_content.html(`
<div id="app"></div>
<div class="back-link m-5">
<a href="https://controller.phila.gov/policy-analysis/reports/">
  <i class="fas fa-arrow-square-left"></i> Back to All Reports
</a>
<p class='help-message mb-5'>
  Comments or feedback? Please contact
  <a href="mailto:controller.policy@phila.gov">controller.policy@phila.gov</a>.
  </p>
</div>`
);

// remove the report button
$(".entry-header .btn")
  .first()
  .remove();

// Initialize
getRouter().then(router => {
  new Vue({
    router,
    vuetify,
    render: h => h(App)
  }).$mount('#app')
})

// Turn off FA
$(document).ready(function () {
  window.FontAwesome.config.observeMutations = false;
  window.FontAwesome.config.searchPseudoElements = false;
})