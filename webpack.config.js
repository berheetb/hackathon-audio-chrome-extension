const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js' 
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/, // Use Babel loader for .js and .jsx files
        exclude: /node_modules/, 
        use: {
          loader: 'babel-loader'
        }
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  },
  resolve: {
    extensions: ['.js', '.jsx']
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html'
    })
  ],
  devServer: {
    static: path.resolve(__dirname, 'dist'), // Serve files from the "dist" directory
    port: 3000, // The port on which the dev server will run
    hot: true // Enable hot module replacement
  },
  mode: 'development' // Development mode (you can change to "production" for production builds)
};