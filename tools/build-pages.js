'use strict';
const path = require('node:path');
const { build } = require('./build');
const root = path.resolve(__dirname, '..');
const result = build(root, path.join(root, 'docs'));
console.log(`Built ${result.files.length} GitHub Pages files (${result.version})`);
