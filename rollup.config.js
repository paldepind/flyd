import resolve from 'rollup-plugin-node-resolve';
var id = 'flyd';

export default {
  entry: 'lib/index.js',
  dest: id + '.js',
  format: 'umd',
  moduleId: id,
  moduleName: id,
  plugins: [
    resolve({
      modulesOnly: true
    })
  ]
};
