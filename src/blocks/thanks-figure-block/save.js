import { useBlockProps, InnerBlocks } from "@wordpress/block-editor";
import { ServerStyleSheet } from "styled-components";
import { renderToString } from "react-dom/server";
import { StyleComp } from "./StyleThanksFigure";

export default function save({ attributes }) {
	const {
		info_type,
		infomail_success,
		infomail_faile,
		retmail_success,
		retmail_faile,
		selectedPageUrl,
		bgColor,
	} = attributes;

	const blockStyle = { overflow: "hidden", background: bgColor };

	const blockProps = useBlockProps.save({
		style: blockStyle,
		className: `figure_fieldset ${info_type}`,
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

	//form_typeでフォームのIDを決定
	const info_id =
		info_type === "inquiry"
			? "to_home"
			: info_type === "provision"
			? "to_mail"
			: info_type === "register"
			? "to_regist_page"
			: info_type === "logonErr"
			? "error_to_home"
			: "";

	return (
		<>
			<div {...blockProps}>
				<div className={className}>
					<form
						id={info_id}
						data-info_mail_success={infomail_success}
						data-info_mail_error={infomail_faile}
						data-ret_mail_success={retmail_success}
						data-ret_mail_error={retmail_faile}
						data-selected_page={selectedPageUrl}
					>
						<InnerBlocks.Content />
					</form>
				</div>
			</div>
			<div dangerouslySetInnerHTML={{ __html: styleTags }} />
		</>
	);
}
