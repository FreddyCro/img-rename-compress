import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { Select } = require('enquirer');

const runCompress = () => {};

export { runCompress };