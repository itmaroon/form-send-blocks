
import { useBlockProps, InnerBlocks } from '@wordpress/block-editor';
import { borderProperty, radiusProperty, marginProperty, paddingProperty } from '../styleProperty';


export default function save({ attributes }) {
	const {
		bgColor_form,
		bgGradient_form,
		radius_form,
		border_form,
		margin_form,
		padding_form,

	} = attributes;

	//単色かグラデーションかの選択
	const bgColor = bgColor_form || bgGradient_form;


	//ブロックのスタイル設定
	const margin_obj = marginProperty(margin_form);
	const padding_obj = paddingProperty(padding_form);
	const radius_obj = radiusProperty(radius_form);
	const border_obj = borderProperty(border_form);
	const blockStyle = { background: bgColor, ...margin_obj, ...padding_obj, ...radius_obj, ...border_obj };

	const blockProps = useBlockProps.save({
		style: blockStyle,
		className: 'figure_fieldset',
	});

	return (
		<div {...blockProps}>
			<form id="send_exec">
				<InnerBlocks.Content />
				<input type="submit" value="送信実行" id='send_exec_btn' />
				<input type="submit" value="入力画面に戻る" id='send_cancel_btn' />
			</form>
		</div>
	);
}
