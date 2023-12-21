
import { useBlockProps, InnerBlocks } from '@wordpress/block-editor';
import { ServerStyleSheet } from 'styled-components';
import { renderToString } from 'react-dom/server';
import { StyleComp } from './StyleConfirmFigure';


export default function save({ attributes }) {
	const {
		bgColor,
		send_id,
		cancel_id,
	} = attributes;

	//ブロックのスタイル設定
	const blockStyle = { overflow: 'hidden', background: bgColor };

	const blockProps = useBlockProps.save({
		style: blockStyle,
		className: 'figure_fieldset',
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
					<form
						id="itmar_send_exec"
						data-send_id={send_id}
						data-cancel_id={cancel_id}
					>
						<InnerBlocks.Content />
					</form>
				</div>
			</div>
			<div dangerouslySetInnerHTML={{ __html: styleTags }} />
		</>
	);
}
