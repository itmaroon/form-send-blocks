import {
	radius_prm,
	space_prm,
	convertToScss,
	borderProperty,
	cssValueToString,
} from "itmar-block-packages";

import type { Attributes } from "./type";

/**
 * エディタ・フロントエンド共通のスコープ付きCSSを生成する。
 */
export const createInputFigureStyleCss = (
	attributes: Attributes,
	scopeSelector: string,
): string => {
	const {
		bgColor_form,
		bgGradient_form,
		radius_form,
		border_form,
		default_pos,
		mobile_pos,
		shadow_result,
		is_shadow,
	} = attributes;

	const background = bgColor_form || bgGradient_form || "transparent";
	const formRadius = radius_prm(radius_form);
	const border = cssValueToString(borderProperty(border_form));
	const shadow =
		is_shadow && shadow_result
			? cssValueToString(convertToScss(shadow_result))
			: "";

	return `
		${scopeSelector} form {
			margin: ${space_prm(default_pos.margin_form)};
			padding: ${space_prm(default_pos.padding_form)};
			background: ${background};
			border-radius: ${formRadius};
			${border}
			${shadow}
		}

		@media (max-width: 767px) {
			${scopeSelector} form {
				margin: ${space_prm(mobile_pos.margin_form)};
				padding: ${space_prm(mobile_pos.padding_form)};
			}
		}
	`;
};
