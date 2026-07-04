import styled, { css } from "styled-components";
import {
	space_prm,
	convertToScss,
	cssValueToString,
} from "itmar-block-packages";
import { ReactNode } from "react";
import { Attributes } from "./type";

interface StyleCompProps {
	attributes: Attributes;
	children?: ReactNode;
}

export const StyleComp = ({ attributes, children }: StyleCompProps) => {
	return <StyledDiv $attr={attributes}>{children}</StyledDiv>;
};

const StyledDiv = styled.div<{ $attr: Attributes }>`
	${({ $attr }) => {
		const { default_pos, mobile_pos, shadow_result, is_shadow } = $attr;

		//スペースの設定
		const default_margin_prm = space_prm(default_pos.margin_value);
		const default_padding_prm = space_prm(default_pos.padding_value);
		const mobile_margin_prm = space_prm(mobile_pos.margin_value);
		const mobile_padding_prm = space_prm(mobile_pos.padding_value);

		//ボックスシャドーの設定
		const box_shadow_style =
			is_shadow && shadow_result ? convertToScss(shadow_result) : "";

		// 共通のスタイルをここで定義します
		const commonStyle = css`
      position: relative;
	  box-sizing: border-box;
      margin: ${default_margin_prm};
      padding: ${default_padding_prm};
      
      ${box_shadow_style};
      @media (max-width: 767px) {
        margin: ${mobile_margin_prm};
        padding: ${mobile_padding_prm};
      }
    }  
    `;

		// 共通のスタイルを組み合わせて返します
		return css`
			${commonStyle}
		`;
	}}
`;

/**
 * フロントエンド用のスコープ付きCSSを生成する。
 * React、renderToString、styled-componentsのクラス名には依存しない。
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
