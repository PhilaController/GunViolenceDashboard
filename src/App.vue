<template>
  <div data-vuetify>
    <v-app id="app">
      <v-main>
        <transition name="fade" mode="out-in">
          <keep-alive>
            <router-view :key="$route.path" />
          </keep-alive>
        </transition>
      </v-main>
    </v-app>
  </div>
</template>

<script>
export default {
  name: "App",
};
</script>
