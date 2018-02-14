const { resolve } = require('path');
const webpack = require('webpack');
const merge = require('webpack-merge');
const common = require('./webpack.config.common');
const HtmlWebpackPlugin = require('html-webpack-plugin');
// const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

module.exports = merge(common, {
  plugins: [
    new HtmlWebpackPlugin({
      template: '../www/index.html',
    }),
    new webpack.NamedModulesPlugin(),
    // new BundleAnalyzerPlugin()
  ],
  entry: [
    '../www/index-page.js'
  ],
  output: {
    path: resolve(__dirname, '../.gh-pages-tmp-editor'),
    filename: 'bundle.js'
  },
  devServer: {
    historyApiFallback: true,
    inline: false
  },
  module: {
    rules: [
      {
        test: /\.md$/,
        loader: 'raw-loader'
      },
      {
        test: /\.json$/,
        loader: 'json-loader'
      }
    ]
  }
});
