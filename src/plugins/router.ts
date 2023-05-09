import Vue from "vue";
import Router from "vue-router";
import Dashboard from "@/views/Dashboard/index.vue";
import AboutPage from "@/views/About/index.vue";
import { githubFetch } from "@/utils/io";

Vue.use(Router);

export async function getRouter() {
  // Pull the years for which we have data from Github
  const dataYears: number[] = await githubFetch("data_years.json");

  // Return the router
  return new Router({
    routes: [
      // About page
      {
        path: "/about",
        component: AboutPage,
        props: { dataYears: dataYears },
      },
      // Dashboard page
      {
        path: "/",
        component: Dashboard,
        props: { dataYears: dataYears },
      },
      // Redirect to dashboard with query params
      {
        path: "/:selectedYear",
        redirect: (to) => {
          let year;
          if (to.params.selectedYear == "all") year = "All Years";
          else year = to.params.selectedYear;

          return { path: "/", query: { year: year } };
        },
      },
    ],
  });
}
