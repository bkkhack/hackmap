const webpack = require("webpack");

module.exports = {
    context: __dirname + "/src",
    entry: {
        app: ["./index.js"],
        vendor: ["axios", "vue"]
    },
    // required to pull in the full version of vue.js
    resolve: {
        alias: {
            vue: 'vue/dist/vue.common.js'
        }
    },
    // our main app is packed into bundle.js
    output: {
        path: __dirname,
        filename: "build/bundle.js"
    },
    plugins: [
        // pack all third-party scripts into a single vendor.bundle.js
        new webpack.optimize.CommonsChunkPlugin({ name: 'vendor', filename: 'build/vendor.bundle.js' })
    ],
    // enable source maps
    devtool: 'cheap-module-source-map',
    // set up babel to compile ES6 down to ES5
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /(node_modules|bower_components)/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['env']
                    }
                }
            }
        ]
    }
};
