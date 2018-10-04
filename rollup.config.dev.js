import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';

export default {
  input: './lib/index.js',
  output: {
    file: './flyd.js',
    name: 'flyd',
    format: 'umd'
  },
  plugins: [
    resolve(),
    commonjs()
  ]
};