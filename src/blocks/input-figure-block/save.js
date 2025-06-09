import { useBlockProps, InnerBlocks } from "@wordpress/block-editor";
import { ServerStyleSheet } from "styled-components";
import { renderToString } from "react-dom/server";
import { StyleComp } from "./StyleInputFigure";

export default function save({ attributes }) {
	const { form_type, form_name, bgColor } = attributes;

	//form_typeでフォームのIDを決定
	const form_id =
		form_type === "inquiry"
			? "to_confirm_form"
			: form_type === "member"
			? "send_confirm_form"
			: form_type === "login"
			? "to_login_form"
			: "";

	//ブロックのスタイル設定
	const blockStyle = { overflow: "hidden", background: bgColor };

	const blockProps = useBlockProps.save({
		style: blockStyle,
		className: `figure_fieldset ${form_type} appear first_appear`,
		name: form_name,
	});

	//styled-componentsのHTML化
	const sheet = new ServerStyleSheet();
	const html = renderToString(
		sheet.collectStyles(<StyleComp attributes={attributes} />),
	);
	const styleTags = sheet.getStyleTags();
	// 正規表現で styled-components のクラス名を取得
	const classMatch = html.match(/class="([^"]+)"/);
	const className = classMatch ? classMatch[1] : "";

	return (
		<>
			<div {...blockProps}>
				<div className={className}>
					<form id={form_id}>
						<InnerBlocks.Content />
					</form>
				</div>
			</div>
			<div dangerouslySetInnerHTML={{ __html: styleTags }} />
		</>
	);
}
