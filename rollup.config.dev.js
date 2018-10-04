import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';

import config from './rollup.config.base';

config.input = './lib/index.js';
config.output = {
    file: './flyd.js',
    name: 'flyd',
    format: 'umd'
}

export default config;