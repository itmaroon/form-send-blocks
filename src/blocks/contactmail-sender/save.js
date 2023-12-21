
import { useBlockProps, InnerBlocks } from '@wordpress/block-editor';
import { ServerStyleSheet } from 'styled-components';
import { renderToString } from 'react-dom/server';
import { StyleComp } from './StyleContactMail';

export default function save({ attributes }) {
	const {
		master_mail,
		subject_info,
		message_info,
		ret_mail,
		subject_ret,
		message_ret,
		is_retmail,
		is_dataSave
	} = attributes;

	const blockProps = useBlockProps.save();

	//styled-componentsのHTML化
	const sheet = new ServerStyleSheet();
	const html = renderToString(sheet.collectStyles(
		<StyleComp attributes={attributes} />
	));
	const styleTags = sheet.getStyleTags();
	// 正規表現で styled-components のクラス名を取得
	const classMatch = html.match(/class="([^"]+)"/);
	const className = classMatch ? classMatch[1] : "";

	return (
		<>
			<div {...blockProps}
				data-master_mail={master_mail}
				data-subject_info={subject_info}
				data-message_info={message_info}
				data-ret_mail={ret_mail}
				data-subject_ret={subject_ret}
				data-message_ret={message_ret}
				data-is_retmail={is_retmail}
				data-is_datasave={is_dataSave}
			>
				<div className={className}>
					<InnerBlocks.Content />
				</div>
			</div>
			<div dangerouslySetInnerHTML={{ __html: styleTags }} />
		</>
	);
}
