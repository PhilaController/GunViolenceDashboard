import Vue from "vue";
import Router from "vue-router";
import HomePage from "@/views/Home";
import AboutPage from "@/views/About";
import { json } from "d3-fetch";

Vue.use(Router);

export default function () {

    // Pull from Github
    let url = `https://raw.githubusercontent.com/PhiladelphiaController/gun-violence-dashboard-data/master/gun_violence_dashboard_data/data/processed/data_years.json`

    return json(url).then(function (data) {

        return new Router({
            routes: [
                {
                    path: "/about",
                    component: AboutPage
                },
                {
                    path: "/",
                    component: HomePage,
                    redirect: `/${data[0]}`
                },
                {
                    path: "/:selectedYear",
                    component: HomePage
                },
            ],
        });
    });
}