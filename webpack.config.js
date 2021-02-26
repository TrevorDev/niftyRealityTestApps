// https://webpack.js.org/guides/typescript/

const NodemonPlugin = require('nodemon-webpack-plugin');
const nodeExternals = require('webpack-node-externals');
const path = require('path');

module.exports = [
    {
        mode: 'development',
        entry: "./helloWorld.ts",
        devtool: "inline-source-map",
        module: {
            rules: [
                {
                    test: /\.(glsl|vs|fs)$/,
                    loader: 'ts-shader-loader'
                },
                {
                    test: /\.tsx?$/,
                    use: 'ts-loader',
                    exclude: /node_modules/
                }
            ]
        },
        resolve: {
            extensions: ['.tsx', '.ts', '.js']
        },
        output: {
            filename: 'helloWorld.js',
            path: path.resolve(__dirname, 'dist')
        }
    }
]
