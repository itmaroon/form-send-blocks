
import { useBlockProps, InnerBlocks } from '@wordpress/block-editor';
import { ServerStyleSheet } from 'styled-components';
import { renderToString } from 'react-dom/server';
import { StyleComp } from './StyleInputFigure';

export default function save({ attributes }) {
	const {
		form_name,
		bgColor
	} = attributes;

	//ブロックのスタイル設定
	const blockStyle = { overflow: 'hidden', background: bgColor };

	const blockProps = useBlockProps.save({
		style: blockStyle,
		className: 'figure_fieldset appear first_appear',
		name: form_name
	});

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
			<div {...blockProps}>
				<div className={className}>
					<form id="to_confirm_form">
						<InnerBlocks.Content />
					</form>
				</div>
			</div>
			<div dangerouslySetInnerHTML={{ __html: styleTags }} />
		</>

	);
}
