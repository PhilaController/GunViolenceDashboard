import Vue from "vue";
import Router from "vue-router";
import HomePage from "@/views/Home";
import AboutPage from "@/views/About";
import { githubFetch } from "@/tools"

Vue.use(Router);

async function getRouter() {

    // Pull from Github
    const data = await githubFetch("data_years.json")
    let defaultYear = data[0];

    return new Router({
        routes: [
            {
                path: "/about",
                component: AboutPage
            },
            {
                path: "/",
                component: HomePage,
                redirect: `/${defaultYear}`
            },
            {
                path: "/:selectedYear",
                component: HomePage
            },
        ],
    });
}

export { getRouter }