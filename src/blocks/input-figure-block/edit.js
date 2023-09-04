
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
	__experimentalBoxControl as BoxControl,
	__experimentalBorderBoxControl as BorderBoxControl
} from '@wordpress/components';

import './editor.scss';

import { useEffect } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import { borderProperty, radiusProperty, marginProperty, paddingProperty } from '../styleProperty';

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
		bgColor_form,
		bgGradient_form,
		radius_form,
		border_form,
		margin_form,
		padding_form,
		stage_info
	} = attributes;


	//単色かグラデーションかの選択
	const bgColor = bgColor_form || bgGradient_form;


	//ブロックのスタイル設定
	const margin_obj = marginProperty(margin_form);
	const padding_obj = paddingProperty(padding_form);
	const radius_obj = radiusProperty(radius_form);
	const border_obj = borderProperty(border_form);
	const blockStyle = { background: bgColor, ...margin_obj, ...padding_obj, ...radius_obj, ...border_obj };

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
		['itmar/design-text-ctrl', { inputName: 'user_name', labelContent: __("Name", 'form-send-blocks'), required: { flg: true, display: "*" } }],
		['itmar/design-text-ctrl', { inputName: 'email', labelContent: __("E-mail Address", 'form-send-blocks'), inputType: 'email', required: { flg: true, display: "*" } }],
		['itmar/design-text-ctrl', { inputName: 'email', labelContent: __("Inquiry details", 'form-send-blocks'), inputType: 'textarea', required: { flg: true, display: "*" } }],
		['itmar/design-checkbox', { labelContent: __("Agree to the privacy policy and send.", 'form-send-blocks') }]
	];
	const innerBlocksProps = useInnerBlocksProps(
		{},
		{
			allowedBlocks: ['itmar/design-text-ctrl', 'itmar/design-checkbox'],
			template: TEMPLATE,
			templateLock: false
		}
	);

	//インナーブロックを取得
	const innerBlocks = useSelect((select) => select('core/block-editor').getBlocks(clientId), [clientId]);

	//インナーブロックのラベル幅を取得
	useEffect(() => {
		//'itmar/design-checkbox'を除外
		const filteredBlocks = innerBlocks.filter(block => block.name !== 'itmar/design-checkbox');
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
	});

	return (
		<>
			<InspectorControls group="settings">
				<PanelBody title="送信フォーム情報設定" initialOpen={true} className="form_setteing_ctrl">
					<TextControl
						label="ステージの情報"
						value={stage_info}
						help="プロセスエリアに表示するステージの情報を入力して下さい。"
						onChange={(newVal) => setAttributes({ stage_info: newVal })}
					/>

				</PanelBody>

			</InspectorControls>
			<InspectorControls group="styles">
				<PanelBody title="送信フォームスタイル設定" initialOpen={true} className="form_design_ctrl">

					<PanelColorGradientSettings
						title={__(" Background Color Setting", 'form-send-blocks')}
						settings={[
							{
								colorValue: bgColor_form,
								gradientValue: bgGradient_form,

								label: __("Choose Background color", 'form-send-blocks'),
								onColorChange: (newValue) => setAttributes({ bgColor_form: newValue }),
								onGradientChange: (newValue) => setAttributes({ bgGradient_form: newValue }),
							},
						]}
					/>
					<PanelBody title="ボーダー設定" initialOpen={false} className="border_design_ctrl">
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
						label="マージン設定"
						values={margin_form}
						onChange={value => setAttributes({ margin_form: value })}
						units={units}	// 許可する単位
						allowReset={true}	// リセットの可否
						resetValues={padding_resetValues}	// リセット時の値

					/>
					<BoxControl
						label="パティング設定"
						values={padding_form}
						onChange={value => setAttributes({ padding_form: value })}
						units={units}	// 許可する単位
						allowReset={true}	// リセットの可否
						resetValues={padding_resetValues}	// リセット時の値

					/>

				</PanelBody>

			</InspectorControls>

			<div {...blockProps}>
				<form onSubmit={handleSubmit}>
					<div {...innerBlocksProps}></div>
					<input type="submit" value="確認画面へ" />
				</form>
			</div >

		</>

	);
}
