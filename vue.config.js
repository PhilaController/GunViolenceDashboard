const webpack = require("webpack");
const VuetifyLoaderPlugin = require('vuetify-loader/lib/plugin')

module.exports = {
  chainWebpack: config => {
    config.module.rules.delete("eslint");
  },

  configureWebpack: {
    externals: {
      jquery: "jQuery",
      $: "jQuery"
    },
    entry: {
      main: './src/main.js',
      browserSupport: './src/browserSupport.js'
    },
    output: {
      filename: '[name].[hash:8].bundle.js'
    },
    plugins: [
      new webpack.ProvidePlugin({
        $: "jquery",
        jQuery: "jquery"
      }),
      new VuetifyLoaderPlugin()
    ],
    optimization: {
      splitChunks: false
    },
  },
  css: {
    extract: false
  }
};
