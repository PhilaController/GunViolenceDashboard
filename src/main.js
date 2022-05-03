// External
import Vue from 'vue'
import $ from 'jquery'

// App and router
import App from '@/App'
import { getRouter } from "@/plugins/router";
import vuetify from '@/plugins/vuetify'
import store from '@/plugins/store'

// Don't show tip
Vue.config.productionTip = false;


// load and set the HTML template we are using
let content = $("#main");
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
    store,
    render: h => h(App)
  }).$mount('#app')
})

// Turn off FA
$(document).ready(function () {
  window.FontAwesome.config.observeMutations = false;
  window.FontAwesome.config.searchPseudoElements = false;
})