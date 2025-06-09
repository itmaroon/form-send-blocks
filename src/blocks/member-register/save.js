import { useBlockProps, InnerBlocks } from "@wordpress/block-editor";
import { ServerStyleSheet } from "styled-components";
import { renderToString } from "react-dom/server";
import { StyleComp } from "./StyleMemberRegister";

export default function save({ attributes }) {
	const {
		master_mail,
		master_name,
		ret_mail,
		is_prov_notice,
		is_reg_notice,
		subject_provision,
		message_provision,
		subject_ret_pro,
		message_ret_pro,
		subject_register,
		message_register,
		subject_ret_reg,
		message_ret_reg,
		is_logon,
		is_success_mail,
	} = attributes;

	const blockProps = useBlockProps.save();

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
			<div
				{...blockProps}
				data-master_mail={master_mail}
				data-master_name={master_name}
				data-subject_prov={subject_provision}
				data-message_prov={message_provision}
				data-subject_reg={subject_register}
				data-message_reg={message_register}
				data-ret_mail={ret_mail}
				data-subject_ret_prov={subject_ret_pro}
				data-message_ret_prov={message_ret_pro}
				data-subject_ret_reg={subject_ret_reg}
				data-message_ret_reg={message_ret_reg}
				data-is_prov_notice={is_prov_notice}
				data-is_reg_notice={is_reg_notice}
				data-is_retmail={is_success_mail}
				data-is_logon={is_logon}
			>
				<div className={className}>
					<InnerBlocks.Content />
				</div>
			</div>
			<div dangerouslySetInnerHTML={{ __html: styleTags }} />
		</>
	);
}
