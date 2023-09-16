
import { __ } from '@wordpress/i18n';
import './editor.scss';
import { useSelect, useDispatch, select } from '@wordpress/data';
import { useEffect, useState } from '@wordpress/element';
import ShadowStyle from '../ShadowStyle';

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
	Notice,
	RangeControl,
	RadioControl,
	TextControl,
	__experimentalBoxControl as BoxControl,
	__experimentalUnitControl as UnitControl,
	__experimentalBorderBoxControl as BorderBoxControl
} from '@wordpress/components';
import { createBlock } from '@wordpress/blocks';

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


export default function Edit({ attributes, setAttributes, context, clientId }) {
	const {
		bgColor,
		bgColor_form,
		bgGradient_form,
		radius_form,
		border_form,
		margin_form,
		padding_form,
		send_id,
		cancel_id,
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

	// dispatch関数を取得
	const { updateBlockAttributes, replaceInnerBlocks } = useDispatch('core/block-editor');

	// 親ブロックのclientIdを取得
	const parentClientId = useSelect((select) => {
		const { getBlockRootClientId } = select('core/block-editor');
		// 親ブロックのclientIdを取得
		const parentClientId = getBlockRootClientId(clientId);
		return parentClientId;
	}, [clientId]); // clientIdが変わるたびに監視対象のstateを更新する

	// 監視対象のinput要素を取得する
	const inputFigureBlocks = useSelect((select) => {
		const { getBlockRootClientId, getBlocks } = select('core/block-editor');
		// 親ブロックのclientIdを取得
		const parentClientId = getBlockRootClientId(clientId);
		// 親ブロックを取得
		const parentInnerBlocks = getBlocks(parentClientId);
		//親のインナーブロックからitmar/input-figure-blockを抽出
		const inputFigureBlock = parentInnerBlocks.find(block => block.name === 'itmar/input-figure-block');
		//その中のインナーブロック
		const inputInnerBlocks = inputFigureBlock ? inputFigureBlock.innerBlocks : [];
		return inputInnerBlocks; // 監視対象のstateを返す
	}, [clientId]); // clientIdが変わるたびに監視対象のstateを更新する

	//Nestされたブロックの情報取得
	function getAllNestedBlocks(clientId) {
		const block = select('core/block-editor').getBlock(clientId);
		if (!block) {
			return [];
		}
		const children = block.innerBlocks.map(innerBlock => getAllNestedBlocks(innerBlock.clientId));
		return [block, ...children.flat()];
	}

	//タイトル属性の監視（最初のitmar/design-title）
	const titleBlockAttributes = useSelect((select) => {
		const blocks = select('core/block-editor').getBlocks(clientId);
		//タイトル属性の取得・初期化
		const titleBlock = blocks.find(block => block.name === 'itmar/design-title');
		return titleBlock ? titleBlock.attributes : { headingContent: __("Please check your entries", 'itmar_form_send_blocks') };
	}, [clientId]);

	//ボタン属性の監視（２つのitmar/design-button）
	const buttonBlockAttributes = useSelect(() => {
		//ネストされたブロックも取得
		const blocks = getAllNestedBlocks(clientId);
		const buttonBlocks = blocks.filter(block => block.name === 'itmar/design-button');
		//ボタン属性の取得・初期化
		const buttonAttributes = buttonBlocks.length ? buttonBlocks.map(block => block.attributes)
			: [
				{ buttonType: 'submit', buttonId: 'btn_id_send', labelContent: __("Send", 'itmar_form_send_blocks') },
				{ buttonType: 'submit', buttonId: 'btn_id_cancel', labelContent: __("Return to send screen", 'itmar_form_send_blocks') }
			];
		return buttonAttributes;
	}, [clientId]);


	//インナーブロックのテンプレートを初期化
	const orgTemplate = [];

	//インナーブロックのひな型を作る
	const innerBlocksProps = useInnerBlocksProps(
		{},
		{
			//allowedBlocks: ['itmar/input-figure-block'],
			template: orgTemplate,
			templateLock: true
		}
	);

	useEffect(() => {
		//ボタンのID属性をブロック属性に保存
		setAttributes({ send_id: buttonBlockAttributes[0].buttonId });
		setAttributes({ cancel_id: buttonBlockAttributes[1].buttonId });
	}, [buttonBlockAttributes]);

	useEffect(() => {
		const button1 = createBlock('itmar/design-button', { ...buttonBlockAttributes[0] });
		const button2 = createBlock('itmar/design-button', { ...buttonBlockAttributes[1] });
		const groupBlock = createBlock('core/group', {}, [button1, button2]);
		const newInnerBlocks = [
			createBlock('itmar/design-title', { ...titleBlockAttributes }),
			createBlock('itmar/design-table', {}),
			groupBlock
		];

		replaceInnerBlocks(clientId, newInnerBlocks, false);
	}, [inputFigureBlocks]);


	//Submitによるプロセス変更
	const handleSubmit = (e) => {
		e.preventDefault();
		const click_id = e.nativeEvent.submitter.id;
		// 親ブロックのstate_process属性を更新
		if (click_id === send_id) {
			updateBlockAttributes(parentClientId, { state_process: 'thanks' });
		} else if (click_id === cancel_id) {
			updateBlockAttributes(parentClientId, { state_process: 'input' });
		}
	};

	//ルート要素にスタイルとクラスを付加	
	const blockProps = useBlockProps({
		style: blockStyle,
		className: `figure_fieldset ${context['itmar/state_process'] === 'confirm' ? 'appear' : ""}`,
	});


	return (
		<>
			<InspectorControls group="settings">
				<PanelBody title={__("Confirmation form information setting", 'itmar_form_send_blocks')} initialOpen={true} className="form_setteing_ctrl">
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
			<div {...blockProps} >
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
			</div>
		</>

	);
}
