import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import uglify from 'rollup-plugin-uglify';

export default {
  input: './lib/index.js',
  output: {
    file: './flyd.min.js',
    name: 'flyd',
    format: 'umd'
  },
  plugins: [
    resolve(),
    commonjs(),
    uglify()
  ]
};