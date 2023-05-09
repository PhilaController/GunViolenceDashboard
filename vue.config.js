const webpack = require("webpack");
const prefixer = require("postcss-prefix-selector");

module.exports = {
  transpileDependencies: ["vuetify"],
  css: {
    extract: false,
  },
  configureWebpack: {
    externals: {
      jquery: "jQuery",
      $: "jQuery",
    },
    entry: {
      main: "./src/main.ts",
      browserSupport: "./src/browserSupport.js",
    },
    output: {
      filename: "gv-dashboard.[name].[fullhash:7].js",
    },
    plugins: [
      new webpack.ProvidePlugin({
        $: "jquery",
        jQuery: "jquery",
      }),
    ],
    optimization: { splitChunks: false },
  },
  chainWebpack: (config) => {
    config.module.rules.delete("eslint");
    const sassRule = config.module.rule("sass");
    const sassNormalRule = sassRule.oneOfs.get("normal");
    // creating a new rule
    const vuetifyRule = sassRule
      .oneOf("vuetify")
      .test(/[\\/]vuetify[\\/]src[\\/]/);
    // taking all uses from the normal rule and adding them to the new rule
    Object.keys(sassNormalRule.uses.entries()).forEach((key) => {
      vuetifyRule.uses.set(key, sassNormalRule.uses.get(key));
    });
    // moving rule "vuetify" before "normal"
    sassRule.oneOfs.delete("normal");
    sassRule.oneOfs.set("normal", sassNormalRule);
    // adding prefixer to the "vuetify" rule
    vuetifyRule
      .use("vuetify")
      .loader(require.resolve("postcss-loader"))
      .tap((options = {}) => {
        options.sourceMap = process.env.NODE_ENV !== "production";
        options.postcssOptions = {
          plugins: [
            prefixer({
              prefix: "[data-vuetify]",
              transform(prefix, selector, prefixedSelector) {
                let result = prefixedSelector;
                if (
                  selector.startsWith("html") ||
                  selector.startsWith("body")
                ) {
                  result = prefix + selector.substring(4);
                }
                return result;
              },
            }),
          ],
        };
        return options;
      });
    // moving sass-loader to the end
    vuetifyRule.uses.delete("sass-loader");
    vuetifyRule.uses.set("sass-loader", sassNormalRule.uses.get("sass-loader"));
  },
};
