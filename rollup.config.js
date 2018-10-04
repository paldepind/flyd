import uglify from 'rollup-plugin-uglify';

import config from './rollup.config.base';

config.plugins.push(uglify());

config.input = './lib/index.js';

config.output = {
    file: './flyd.min.js',
    name: 'flyd',
    format: 'umd'
}

export default config;