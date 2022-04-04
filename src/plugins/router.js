import Vue from "vue";
import Router from "vue-router";
import HomePage from "@/views/Home";
import AboutPage from "@/views/About";
import store from "@/plugins/store";

Vue.use(Router);

async function getRouter() {

    // Pull from Github
    const data = await store.dispatch("fetchYears");

    return new Router({
        routes: [
            {
                path: "/about",
                component: AboutPage,
                props: { dataYears: data }
            },
            {
                path: "/",
                component: HomePage,
            },
        ],
    });
}

export { getRouter }