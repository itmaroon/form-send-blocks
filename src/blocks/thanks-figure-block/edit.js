
import { __ } from '@wordpress/i18n';
import './editor.scss';

import {
	useBlockProps,
	InnerBlocks,
	RichText,
	useInnerBlocksProps,
	InspectorControls,
	__experimentalPanelColorGradientSettings as PanelColorGradientSettings,
	__experimentalBorderRadiusControl as BorderRadiusControl
} from '@wordpress/block-editor';
import {
	Button,
	Panel,
	PanelBody,
	PanelRow,
	ToggleControl,
	TextareaControl,
	ComboboxControl,
	TextControl,
	__experimentalBoxControl as BoxControl,
	__experimentalUnitControl as UnitControl,
	__experimentalBorderBoxControl as BorderBoxControl
} from '@wordpress/components';

import './editor.scss';

import { useEffect, useState } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import { borderProperty, radiusProperty, marginProperty, paddingProperty } from '../styleProperty';
import ShadowStyle from '../ShadowStyle';
import { RedirectSelectControl } from '../wordpressApi'

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

export default function Edit({ attributes, setAttributes, context, clientId }) {
	const {
		infomail_success,
		infomail_faile,
		retmail_success,
		retmail_faile,
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
		updateBlockAttributes(parentClientId, { state_process: 'input' });
	};

	//インナーブロックの制御
	const TEMPLATE = [
		['itmar/design-title', { headingContent: __("Thank you for your inquiry.", 'itmar_form_send_blocks') }],
		['core/paragraph', { className: 'itmar_ex_block', content: __("The contents set in the sidebar will be displayed here as the transmission result. Any changes you make to the contents of this paragraph block will not be reflected anywhere. Only design settings are valid.", 'itmar_form_send_blocks') }],
		['itmar/design-button', { buttonType: 'submit', labelContent: __("Go to home screen", 'itmar_form_send_blocks') }]
	];
	const innerBlocksProps = useInnerBlocksProps(
		{},
		{
			template: TEMPLATE,
			templateLock: true
		}
	);


	//ルート要素にスタイルとクラスを付加	
	const blockProps = useBlockProps({
		style: blockStyle,
		className: `figure_fieldset ${context['itmar/state_process'] === 'thanks' ? 'appear' : ""}`,
	});

	return (
		<>
			<InspectorControls group="settings">
				<PanelBody title={__("Completion form information settings", 'itmar_form_send_blocks')} initialOpen={true} className="form_setteing_ctrl">
					<TextControl
						label={__("Stage information", 'itmar_form_send_blocks')}
						value={stage_info}
						help={__("Please enter the stage information to be displayed in the process area.", 'itmar_form_send_blocks')}
						onChange={(newVal) => setAttributes({ stage_info: newVal })}
					/>
					<TextareaControl
						label={__("Notification email sending success display", 'itmar_form_send_blocks')}
						value={infomail_success}
						onChange={(newVal) => setAttributes({ infomail_success: newVal })}
						rows="3"
					/>
					<TextareaControl
						label={__("Notification email sending error display", 'itmar_form_send_blocks')}
						value={infomail_faile}
						onChange={(newVal) => setAttributes({ infomail_faile: newVal })}
						rows="3"
					/>
					<TextareaControl
						label={__("Response email sending success display", 'itmar_form_send_blocks')}
						value={retmail_success}
						onChange={(newVal) => setAttributes({ retmail_success: newVal })}
						rows="3"
					/>
					<TextareaControl
						label={__("Response email sending error display", 'itmar_form_send_blocks')}
						value={retmail_faile}
						onChange={(newVal) => setAttributes({ retmail_faile: newVal })}
						rows="3"
					/>

					<PanelBody title={__("Select redirect destination when exiting", 'itmar_form_send_blocks')}>
						<RedirectSelectControl
							attributes={attributes}
							setAttributes={setAttributes}
						/>
					</PanelBody>

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

								label: __("Choose Background color", 'itmar_form_send_blocks'),
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

