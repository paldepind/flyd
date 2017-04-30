import resolve from 'rollup-plugin-node-resolve';

export default {
  entry: 'lib/index.js',
  dest: 'flyd.js',
  moduleName: '@most/prelude',
  format: 'cjs',
  plugins: [
    resolve({
      modulesOnly: true
    })
  ]
};