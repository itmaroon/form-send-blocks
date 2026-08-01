import {
	space_prm,
	convertToScss,
	cssValueToString,
} from "itmar-block-packages";
import type { Attributes } from "./type";

/**
 * エディタ・フロントエンド共通のスコープ付きCSSを生成する。
 */
export const createContactMailStyleCss = (
	attributes: Attributes,
	scopeSelector: string,
): string => {
	const { default_pos, mobile_pos, shadow_result, is_shadow } = attributes;

	const shadow =
		is_shadow && shadow_result
			? cssValueToString(convertToScss(shadow_result))
			: "";

	return `
		${scopeSelector} {
			position: relative;
			box-sizing: border-box;
			margin: ${space_prm(default_pos.margin_value)};
			padding: ${space_prm(default_pos.padding_value)};
			${shadow}
		}

		@media (max-width: 767px) {
			${scopeSelector} {
				margin: ${space_prm(mobile_pos.margin_value)};
				padding: ${space_prm(mobile_pos.padding_value)};
			}
		}
	`;
};
