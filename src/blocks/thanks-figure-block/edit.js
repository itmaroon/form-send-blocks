
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
	ToggleControl,
	TextareaControl,
	TextControl,
	__experimentalBoxControl as BoxControl,
	__experimentalBorderBoxControl as BorderBoxControl
} from '@wordpress/components';

import './editor.scss';

import { useEffect, useState, useRef } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import { StyleComp } from './StyleThanksFigure';
import { useStyleIframe } from '../iframeFooks';
import ShadowStyle, { ShadowElm } from '../ShadowStyle';
import { useElementBackgroundColor, useIsIframeMobile } from '../CustomFooks';
import { PageSelectControl } from '../wordpressApi'

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
		default_pos,
		mobile_pos,
		stage_info,
		shadow_element,
		is_shadow
	} = attributes;


	//ブロックのスタイル設定
	const blockStyle = { background: bgColor };

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
		['itmar/design-title', { headingContent: __("Thank you for your inquiry.", 'form-send-blocks') }],
		['core/paragraph', { className: 'itmar_ex_block', content: __("The contents set in the sidebar will be displayed here as the transmission result. Any changes you make to the contents of this paragraph block will not be reflected anywhere. Only design settings are valid.", 'form-send-blocks') }],
		['itmar/design-button', { buttonType: 'submit', labelContent: __("Go to home screen", 'form-send-blocks'), align: 'center' }]
	];
	const innerBlocksProps = useInnerBlocksProps(
		{},
		{
			template: TEMPLATE,
			templateLock: true
		}
	);

	//モバイルの判定
	const isMobile = useIsIframeMobile();

	//ブロックの参照
	const blockRef = useRef(null);
	//ルート要素にスタイルとクラスを付加	
	const blockProps = useBlockProps({
		ref: blockRef,// ここで参照を blockProps に渡しています
		style: blockStyle,
		className: `figure_fieldset ${context['itmar/state_process'] === 'thanks' ? 'appear' : ""}`,
	});

	//背景色の取得
	const baseColor = useElementBackgroundColor(blockRef, blockProps.style);

	//背景色変更によるシャドー属性の書き換え
	useEffect(() => {
		if (baseColor) {
			setAttributes({ shadow_element: { ...shadow_element, baseColor: baseColor } });
			const new_shadow = ShadowElm({ ...shadow_element, baseColor: baseColor });
			if (new_shadow) { setAttributes({ shadow_result: new_shadow.style }); }
		}
	}, [baseColor]);

	//サイトエディタの場合はiframeにスタイルをわたす。
	useStyleIframe(StyleComp, attributes);

	return (
		<>
			<InspectorControls group="settings">
				<PanelBody title={__("Completion form information settings", 'form-send-blocks')} initialOpen={true} className="form_setteing_ctrl">
					<TextControl
						label={__("Stage information", 'form-send-blocks')}
						value={stage_info}
						help={__("Please enter the stage information to be displayed in the process area.", 'form-send-blocks')}
						onChange={(newVal) => setAttributes({ stage_info: newVal })}
					/>
					<TextareaControl
						label={__("Notification email sending success display", 'form-send-blocks')}
						value={infomail_success}
						onChange={(newVal) => setAttributes({ infomail_success: newVal })}
						rows="3"
					/>
					<TextareaControl
						label={__("Notification email sending error display", 'form-send-blocks')}
						value={infomail_faile}
						onChange={(newVal) => setAttributes({ infomail_faile: newVal })}
						rows="3"
					/>
					<TextareaControl
						label={__("Response email sending success display", 'form-send-blocks')}
						value={retmail_success}
						onChange={(newVal) => setAttributes({ retmail_success: newVal })}
						rows="3"
					/>
					<TextareaControl
						label={__("Response email sending error display", 'form-send-blocks')}
						value={retmail_faile}
						onChange={(newVal) => setAttributes({ retmail_faile: newVal })}
						rows="3"
					/>

					<PanelBody title={__("Select redirect destination when exiting", 'form-send-blocks')}>
						<PageSelectControl
							attributes={attributes}
							setAttributes={setAttributes}
							homeUrl={itmar_form_send_option.home_url}
						/>
					</PanelBody>

				</PanelBody>

			</InspectorControls>
			<InspectorControls group="styles">
				<PanelBody title={__("Global settings", 'form-send-blocks')} initialOpen={true} className="form_design_ctrl">

					<PanelColorGradientSettings
						title={__("Background Color Setting", 'form-send-blocks')}
						settings={[
							{
								colorValue: bgColor,
								label: __("Choose Block Background color", 'form-send-blocks'),
								onColorChange: (newValue) => setAttributes({ bgColor: newValue }),
							},
							{
								colorValue: bgColor_form,
								gradientValue: bgGradient_form,

								label: __("Choose Background color", 'form-send-blocks'),
								onColorChange: (newValue) => setAttributes({ bgColor_form: newValue }),
								onGradientChange: (newValue) => setAttributes({ bgGradient_form: newValue }),
							},
						]}
					/>
					<PanelBody title={__("Border Settings", 'form-send-blocks')} initialOpen={false} className="border_design_ctrl">
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
						label={!isMobile ?
							__("Margin settings(desk top)", 'itmar_block_collections')
							: __("Margin settings(mobile)", 'itmar_block_collections')
						}
						values={!isMobile ? default_pos.margin_form : mobile_pos.margin_form}
						onChange={value => {
							if (!isMobile) {
								setAttributes({ default_pos: { ...default_pos, margin_form: value } });
							} else {
								setAttributes({ mobile_pos: { ...mobile_pos, margin_form: value } });
							}
						}}
						units={units}	// 許可する単位
						allowReset={true}	// リセットの可否
						resetValues={padding_resetValues}	// リセット時の値

					/>
					<BoxControl
						label={!isMobile ?
							__("Padding settings(desk top)", 'itmar_block_collections')
							: __("Padding settings(mobile)", 'itmar_block_collections')
						}
						values={!isMobile ? default_pos.padding_form : mobile_pos.padding_form}
						onChange={value => {
							if (!isMobile) {
								setAttributes({ default_pos: { ...default_pos, padding_form: value } })
							} else {
								setAttributes({ mobile_pos: { ...mobile_pos, padding_form: value } })
							}
						}}
						units={units}	// 許可する単位
						allowReset={true}	// リセットの可否
						resetValues={padding_resetValues}	// リセット時の値

					/>
					<ToggleControl
						label={__('Is Shadow', 'form-send-blocks')}
						checked={is_shadow}
						onChange={(newVal) => {
							setAttributes({ is_shadow: newVal })
						}}
					/>
					{is_shadow &&
						<ShadowStyle
							shadowStyle={{ ...shadow_element }}
							onChange={(newStyle, newState) => {
								setAttributes({ shadow_result: newStyle.style });
								setAttributes({ shadow_element: newState })
							}}
						/>
					}
				</PanelBody>

			</InspectorControls>

			<div {...blockProps}>
				<StyleComp attributes={attributes}>
					<form onSubmit={handleSubmit} >
						<div {...innerBlocksProps}></div>
					</form>
				</StyleComp>
			</div >
		</>

	);
}

