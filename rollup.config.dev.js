import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import replace from 'rollup-plugin-replace';

export default [{
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
}, {
  input: './lib/index.js',
  output: {
    file: './es/index.js',
    format: 'es'
  },
  external: ['ramda/src/curryN'],
  plugins: [
    commonjs(),
    // below can be optimized after the rollup issue resolved
    // https://github.com/rollup/rollup/issues/2491
    replace({
      'ramda/src/curryN': 'ramda/es/curryN'
    })
  ]
}];
