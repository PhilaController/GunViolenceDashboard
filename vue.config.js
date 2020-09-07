const webpack = require("webpack");

module.exports = {
  chainWebpack: config => {
    config.module.rules.delete("eslint");
  },
  configureWebpack: {
    externals: {
      jquery: "jQuery",
      $: "jQuery"
    },
    plugins: [
      new webpack.ProvidePlugin({
        $: "jquery",
        jQuery: "jquery"
      })
    ],
    optimization: {
      splitChunks: false
    }
  },
  css: {
    extract: false
  }
};
