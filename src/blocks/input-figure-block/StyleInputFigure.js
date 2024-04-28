import styled, { css } from "styled-components";
import {
	radius_prm,
	space_prm,
	convertToScss,
	borderProperty,
} from "itmar-block-packages";

export const StyleComp = ({ attributes, children }) => {
	return <StyledDiv attributes={attributes}>{children}</StyledDiv>;
};

const StyledDiv = styled.div`
	${({ attributes }) => {
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

		//単色かグラデーションかの選択
		const bgFormColor = bgColor_form || bgGradient_form;
		//スペースの設定
		const default_margin_prm = space_prm(default_pos.margin_form);
		const default_padding_prm = space_prm(default_pos.padding_form);
		const mobile_margin_prm = space_prm(mobile_pos.margin_form);
		const mobile_padding_prm = space_prm(mobile_pos.padding_form);
		//角丸の設定
		const form_radius_prm = radius_prm(radius_form);

		//ボックスシャドーの設定
		const box_shadow_style =
			is_shadow && shadow_result ? convertToScss(shadow_result) : "";

		// 共通のスタイルをここで定義します
		const commonStyle = css`
			form {
				margin: ${default_margin_prm};
				padding: ${default_padding_prm};
				background: ${bgFormColor};
				border-radius: ${form_radius_prm};
				${borderProperty(border_form)};
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
