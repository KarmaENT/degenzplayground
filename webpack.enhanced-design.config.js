const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  mode: 'development',
  entry: './src/enhanced-design-index.tsx',
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: 'static/enhanced-design.js',
    publicPath: '/'
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'ts-loader'
        }
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader', 'postcss-loader']
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: 'asset/resource',
      },
    ]
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/enhanced-design.html',
      filename: 'enhanced-design.html'
    })
  ],
  devServer: {
    static: {
      directory: path.join(__dirname, 'build'),
    },
    historyApiFallback: {
      rewrites: [
        { from: /^\//, to: '/enhanced-design.html' }
      ]
    },
    port: 3001,
    open: true,
    hot: true
  }
};
