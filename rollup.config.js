import resolve from 'rollup-plugin-node-resolve';

export default {
  entry: 'lib/index.js',
  dest: 'flyd.js',
  format: 'umd',
  moduleName: "flyd",
  plugins: [
    resolve({
      modulesOnly: true
    })
  ]
};