
import { __ } from '@wordpress/i18n';
import './editor.scss';

import {
	useBlockProps,
	useInnerBlocksProps,
	InspectorControls,
	__experimentalPanelColorGradientSettings as PanelColorGradientSettings,
	__experimentalBorderRadiusControl as BorderRadiusControl
} from '@wordpress/block-editor';
import {
	PanelBody,
	TextControl,
	ToggleControl,
	__experimentalBoxControl as BoxControl,
	__experimentalBorderBoxControl as BorderBoxControl
} from '@wordpress/components';

import './editor.scss';

import { useEffect } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import { borderProperty, radiusProperty, marginProperty, paddingProperty } from '../styleProperty';
import ShadowStyle from '../ShadowStyle';

//スペースのリセットバリュー
const padding_resetValues = {
	top: '10px',
	left: '10px',
	right: '10px',
	bottom: '10px',
}

//ボーダーのリセットバリュー
const border_resetValues = {
	top: '0px',
	left: '0px',
	right: '0px',
	bottom: '0px',
}

const units = [
	{ value: 'px', label: 'px' },
	{ value: 'em', label: 'em' },
	{ value: 'rem', label: 'rem' },
];

//要素幅を計測する関数
const measureTextWidth = (text, fontSize, fontFamily) => {
	const canvas = document.createElement('canvas');
	const context = canvas.getContext('2d');
	context.font = `${fontSize} ${fontFamily}`;
	const metrics = context.measureText(text);
	return metrics.width;
}


export default function Edit({ attributes, setAttributes, context, clientId }) {
	const {
		form_name,
		bgColor,
		bgColor_form,
		bgGradient_form,
		radius_form,
		border_form,
		margin_form,
		padding_form,
		stage_info,
		shadow_element,
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
	const blockStyle = { background: bgColor };
	const formStyle = { background: bgFormColor, ...margin_obj, ...padding_obj, ...radius_obj, ...border_obj }

	//ブロック情報取得ツールの取得
	const { getBlockRootClientId } = useSelect((select) => select('core/block-editor'), [clientId]);
	// 親ブロックのclientIdを取得
	const parentClientId = getBlockRootClientId(clientId);
	// dispatch関数を取得
	const { updateBlockAttributes } = useDispatch('core/block-editor');

	//Submitによるプロセス変更
	const handleSubmit = (e) => {
		e.preventDefault();
		// 親ブロックのstate_process属性を更新
		updateBlockAttributes(parentClientId, { state_process: 'confirm' });
	};

	//インナーブロックの制御

	const TEMPLATE = [
		['itmar/design-text-ctrl', { inputName: 'userName', labelContent: __("Name", 'itmar_form_send_blocks'), required: { flg: true, display: __('Required', 'itmar_block_collections') }, placeFolder: __("Please enter your name", 'itmar_form_send_blocks') }],
		['itmar/design-text-ctrl', { inputName: 'email', labelContent: __("E-mail Address", 'itmar_form_send_blocks'), inputType: 'email', required: { flg: true, display: __('Required', 'itmar_block_collections') }, placeFolder: __("Please enter your e-mail address", 'itmar_form_send_blocks') }],
		['itmar/design-text-ctrl', { inputName: 'message', labelContent: __("Inquiry details", 'itmar_form_send_blocks'), inputType: 'textarea', required: { flg: true, display: __('Required', 'itmar_block_collections') }, placeFolder: __("Please enter inquiry", 'itmar_form_send_blocks') }],
		['itmar/design-checkbox', { labelContent: __("Agree to the privacy policy and send.", 'itmar_form_send_blocks') }],
		['itmar/design-button', { buttonType: 'submit', labelContent: __("To confirmation screen", 'itmar_form_send_blocks'), align: 'center' }]
	];
	const innerBlocksProps = useInnerBlocksProps(
		{},
		{
			allowedBlocks: ['itmar/design-text-ctrl', 'itmar/design-checkbox', 'itmar/design-button'],
			template: TEMPLATE,
			templateLock: false
		}
	);

	//インナーブロックを取得
	const innerBlocks = useSelect((select) => select('core/block-editor').getBlocks(clientId), [clientId]);

	//インナーブロックのラベル幅を取得
	useEffect(() => {
		//'itmar/design-checkbox''itmar/design-button'を除外
		const filteredBlocks = innerBlocks.filter(block => block.name !== 'itmar/design-checkbox' && block.name !== 'itmar/design-button');
		const maxNum = filteredBlocks.reduce((max, block) => {
			//必須項目の表示を設定
			const dispLabel = block.attributes.required.flg ? `${block.attributes.labelContent}(${block.attributes.required.display})` : block.attributes.labelContent;
			return Math.max(max, measureTextWidth(dispLabel, block.attributes.font_style_label.fontSize, block.attributes.font_style_label.fontFamily));
		}, Number.MIN_SAFE_INTEGER);
		setAttributes({ label_width: `${Math.round(maxNum)}px` })
	}, [innerBlocks]);

	//ルート要素にスタイルとクラスを付加	
	const blockProps = useBlockProps({
		style: blockStyle,
		className: `figure_fieldset ${context['itmar/state_process'] === 'input' ? 'appear' : ""}`,
		name: form_name
	});

	return (
		<>
			<InspectorControls group="settings">
				<PanelBody title={__("Transmission form information setting", 'itmar_form_send_blocks')} initialOpen={true} className="form_setteing_ctrl">
					<TextControl
						label={__("Form Name", 'itmar_form_send_blocks')}
						value={form_name}
						help={__("This is the name used to identify it as a data source.", 'itmar_form_send_blocks')}
						onChange={(newVal) => setAttributes({ form_name: newVal })}
					/>
					<TextControl
						label={__("Stage information", 'itmar_form_send_blocks')}
						value={stage_info}
						help={__("Please enter the stage information to be displayed in the process area.", 'itmar_form_send_blocks')}
						onChange={(newVal) => setAttributes({ stage_info: newVal })}
					/>

				</PanelBody>

			</InspectorControls>
			<InspectorControls group="styles">
				<PanelBody title={__("Global settings", 'itmar_form_send_blocks')} initialOpen={true} className="form_design_ctrl">

					<PanelColorGradientSettings
						title={__("Background Color Setting", 'itmar_form_send_blocks')}
						settings={[
							{
								colorValue: bgColor,
								label: __("Choose Block Background color", 'itmar_form_send_blocks'),
								onColorChange: (newValue) => setAttributes({ bgColor: newValue }),
							},
							{
								colorValue: bgColor_form,
								gradientValue: bgGradient_form,

								label: __("Choose Form Background color", 'itmar_form_send_blocks'),
								onColorChange: (newValue) => setAttributes({ bgColor_form: newValue }),
								onGradientChange: (newValue) => setAttributes({ bgGradient_form: newValue }),
							},
						]}
					/>
					<PanelBody title={__("Border Settings", 'itmar_form_send_blocks')} initialOpen={false} className="border_design_ctrl">
						<BorderBoxControl

							onChange={(newValue) => setAttributes({ border_form: newValue })}
							value={border_form}
							allowReset={true}	// リセットの可否
							resetValues={border_resetValues}	// リセット時の値
						/>
						<BorderRadiusControl
							values={radius_form}
							onChange={(newBrVal) =>
								setAttributes({ radius_form: typeof newBrVal === 'string' ? { "value": newBrVal } : newBrVal })}
						/>
					</PanelBody>
					<BoxControl
						label={__("Margin Setting", 'itmar_form_send_blocks')}
						values={margin_form}
						onChange={value => setAttributes({ margin_form: value })}
						units={units}	// 許可する単位
						allowReset={true}	// リセットの可否
						resetValues={padding_resetValues}	// リセット時の値

					/>
					<BoxControl
						label={__("Padding settings", 'itmar_form_send_blocks')}
						values={padding_form}
						onChange={value => setAttributes({ padding_form: value })}
						units={units}	// 許可する単位
						allowReset={true}	// リセットの可否
						resetValues={padding_resetValues}	// リセット時の値

					/>
					<ToggleControl
						label={__('Is Shadow', 'itmar_form_send_blocks')}
						checked={is_shadow}
						onChange={(newVal) => {
							setAttributes({ is_shadow: newVal })
						}}
					/>
				</PanelBody>
			</InspectorControls>

			<div {...blockProps}>
				{is_shadow ? (
					<ShadowStyle
						shadowStyle={{ ...shadow_element, backgroundColor: bgColor }}
						onChange={(newStyle, newState) => {
							setAttributes({ shadow_result: newStyle.style });
							setAttributes({ shadow_element: newState })
						}}
					>
						<form onSubmit={handleSubmit} style={{ ...formStyle, ...shadow_result }}>
							<div {...innerBlocksProps}></div>
						</form>
					</ShadowStyle>
				) : (
					<form onSubmit={handleSubmit} style={formStyle}>
						<div {...innerBlocksProps}></div>
					</form>
				)}

			</div >

		</>

	);
}
