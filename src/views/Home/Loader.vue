<template>
  <div class="loading-overlay">
    <div id="loader"></div>
  </div>
</template>

<script>
export default {
  name: "Loader",
};
</script>


<style>
.loading-overlay {
  width: 100%;
  height: 100%;
  position: absolute;
  background: #353d42;
  opacity: 1;
  z-index: 10;
  display: flex;
  justify-content: center;
  align-items: flex-start;
}

#loader {
  margin-top: 100px;
  border: 8px solid #f3f3f3;
  border-radius: 50%;
  border-top: 8px solid #7ab5e5;
  width: 100px;
  height: 100px;
  -webkit-animation: spin 2s linear infinite;
  animation: spin 2s linear infinite;
  z-index: 11;
}

/* Safari */
@-webkit-keyframes spin {
  0% {
    -webkit-transform: rotate(0deg);
  }
  100% {
    -webkit-transform: rotate(360deg);
  }
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

#loading {
  height: 300px;
  display: flex;
  justify-content: center;
  align-items: center;
  opacity: 1;
  background-color: #fff;
  z-index: 9999;
  text-align: center;
}
</style>