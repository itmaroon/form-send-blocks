// ✅ グローバル宣言（ファイル拡張子の定義など）
declare global {
	const itmar_option: {
		home_url: string;
		[key: string]: any;
	};

	declare module "./*.scss" {
		const content: { [className: string]: string };
		export default content;
	}

	declare module "*.json" {
		const value: any;
		export default value;
	}

	declare module "*.svg" {
		import * as React from "react";
		export const ReactComponent: React.FC<React.SVGProps<SVGSVGElement>>;
		const src: string;
		export default src;
	}
}
import "@wordpress/block-editor";
declare module "@wordpress/block-editor" {
	// 実験的コンポーネントを型として定義
	export const __experimentalPanelColorGradientSettings: any;
	export const __experimentalBorderRadiusControl: any;
}
