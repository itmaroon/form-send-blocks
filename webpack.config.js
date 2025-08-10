process.env.WP_COPY_PHP_FILES_TO_DIST = true;

const defaultConfig = require("@wordpress/scripts/config/webpack.config");

const mode = "production"; // この行でproductionモードを指定

//フロントエンドモジュールのトランスパイル
const path = require("path");
const newEntryConfig = async () => {
	const originalEntry = await defaultConfig.entry();

	return {
		...originalEntry,
		contact_block: path.resolve(__dirname, "./assets/contact_block.js"),
	};
};

module.exports = {
	...defaultConfig,
	mode: mode,
	entry: newEntryConfig,
};
