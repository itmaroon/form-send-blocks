
import { useBlockProps, InnerBlocks } from '@wordpress/block-editor';
import { borderProperty, radiusProperty, marginProperty, paddingProperty } from '../styleProperty';

export default function save({ attributes }) {
	const {
		infomail_success,
		infomail_faile,
		retmail_success,
		retmail_faile,
		selectedPageUrl,
		bgColor,
		bgColor_form,
		bgGradient_form,
		radius_form,
		border_form,
		margin_form,
		padding_form,
		shadow_result,
		is_shadow
	} = attributes;

	//単色かグラデーションかの選択
	const bgFormColor = bgColor_form || bgGradient_form;

	//ブロックのスタイル設定
	const margin_obj = marginProperty(margin_form);
	const padding_obj = paddingProperty(padding_form);
	const radius_obj = radiusProperty(radius_form);
	const border_obj = borderProperty(border_form);
	const blockStyle = { overflow: 'hidden', background: bgColor };
	const formStyle = { background: bgFormColor, ...margin_obj, ...padding_obj, ...radius_obj, ...border_obj }

	const blockProps = useBlockProps.save({
		style: blockStyle,
		className: 'figure_fieldset'
	});


	return (
		<div {...blockProps}>
			{is_shadow ? (
				<form
					id="to_home"
					data-info_mail_success={infomail_success}
					data-info_mail_error={infomail_faile}
					data-ret_mail_success={retmail_success}
					data-ret_mail_error={retmail_faile}
					data-selected_page={selectedPageUrl}
					style={{ ...formStyle, ...shadow_result }}>
					<InnerBlocks.Content />
				</form>
			) : (
				<form
					id="to_home"
					data-info_mail_success={infomail_success}
					data-info_mail_error={infomail_faile}
					data-ret_mail_success={retmail_success}
					data-ret_mail_error={retmail_faile}
					data-selected_page={selectedPageUrl}
					style={formStyle}>
					<InnerBlocks.Content />
				</form>
			)}
		</div>
	);
}
