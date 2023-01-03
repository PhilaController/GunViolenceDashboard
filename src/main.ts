// External
import Vue from "vue";
import $ from "jquery"; // Loaded via CDN

// App and router
import App from "@/App.vue";
import { getRouter } from "@/plugins/router";
import vuetify from "@/plugins/vuetify";
//import store from "@/plugins/store";
import "@/main.css";

// Don't show tip
Vue.config.productionTip = false;

// Add FontAwesome to window
declare global {
  interface Window {
    FontAwesome: any;
  }
}

// Load and set the HTML template we are using
const content = $("#main");
content.html(`
<div id="app"></div>
<div class="back-link m-5">
<a href="https://controller.phila.gov/policy-analysis/reports/">
  <i class="fas fa-arrow-square-left"></i> Back to All Reports
</a>
<p class='help-message mb-5'>
  Comments or feedback? Please contact
  <a href="mailto:controller@phila.gov">controller@phila.gov</a>.
  </p>
</div>`);

// remove the report button
$(".entry-header .btn").first().remove();

// Initialize
getRouter().then((router) => {
  new Vue({
    router,
    vuetify,
    //store,
    render: (h) => h(App),
  }).$mount("#app");
});

// Turn off FA
$(document).ready(function () {
  const FA = window.FontAwesome;
  if (FA) {
    FA.config.observeMutations = false;
    FA.config.searchPseudoElements = false;
  }
});
