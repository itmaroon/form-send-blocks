process.env.WP_COPY_PHP_FILES_TO_DIST = true;

const defaultConfig = require("@wordpress/scripts/config/webpack.config");
const path = require("path");

const mode = "production";

module.exports = {
	...defaultConfig,
	mode: mode,
	// エントリーポイントの設定（デフォルトの自動検出機能を活かす）
	entry: async () => {
		const originalEntry = await defaultConfig.entry();
		return {
			...originalEntry,
			// もし特定のフロントエンドスクリプトを個別に指定したい場合はここに追加
			// view: path.resolve(process.cwd(), 'src', 'view.ts'),
		};
	},
	module: {
		...defaultConfig.module,
		rules: [
			...defaultConfig.module.rules,
			{
				// TypeScriptファイル(.ts, .tsx)を ts-loader で処理する
				test: /\.(ts|tsx)$/,
				use: [
					{
						loader: "ts-loader",
						options: {
							// 型チェックのみを行い、トランスパイルは高速化のために
							// プロジェクトの tsconfig.json に従う
							configFile: path.resolve(__dirname, "tsconfig.json"),
						},
					},
				],
				exclude: /node_modules/,
			},
		],
	},
	resolve: {
		...defaultConfig.resolve,
		// ファイルの検索順序。ts -> tsx -> js の順に優先
		extensions: [
			".ts",
			".tsx",
			...(defaultConfig.resolve ? defaultConfig.resolve.extensions || [] : []),
			".js",
			".jsx",
		],
	},
};
