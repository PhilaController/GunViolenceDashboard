const webpack = require("webpack");

module.exports = {
  transpileDependencies: [
    'vuetify'
  ],
  css: {
    extract: false
  },
  configureWebpack: (env) => {
    return {
      externals: {
        jquery: "jQuery",
        $: "jQuery"
      },
      entry: {
        main: './src/main.js',
        browserSupport: './src/browserSupport.js'
      },
      output: {
        filename: "gv-dashboard.[name].[hash:7].js",
      },
      plugins: [
        new webpack.ProvidePlugin({
          $: "jquery",
          jQuery: "jquery"
        }),
      ],
      optimization: { splitChunks: false }
    }
  }
}



