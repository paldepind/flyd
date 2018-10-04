const rollup = require('rollup');
const resolve = require('rollup-plugin-node-resolve');
const commonjs = require('rollup-plugin-commonjs');

const fs = require('fs');
const path = require('path');

async function build(example) {
  console.log('Building ' + example);

  const inputOptions = {
    input: path.resolve(`./examples/${example}/script.js`),
    plugins: [
      resolve(),
      commonjs()
    ]
  }
  const outputOptions = {
    format: 'iife',
    file: path.resolve(`./examples/${example}/build.js`),
    name: example.replace(/-/g, ''),
  }
  // create a bundle
  const bundle = await rollup.rollup(inputOptions);

  // write bundle
  await bundle.write(outputOptions);

  console.log('Built ' + example);
}

const examples = fs.readdirSync('./examples');

Promise.all(examples.map(build))
  .then(()=> console.log('Success!'))
  .catch(err => {
    console.error('Failed!');
    console.error(err);
    process.exit(1);
  });