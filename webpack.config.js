process.env.WP_COPY_PHP_FILES_TO_DIST = true;

const defaultConfig = require('@wordpress/scripts/config/webpack.config');

const mode = 'production';// この行でproductionモードを指定

module.exports = {
  ...defaultConfig,
  mode: mode,

};