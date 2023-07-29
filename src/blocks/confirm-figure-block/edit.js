
import { __ } from '@wordpress/i18n';
import './editor.scss';
import { useSelect, useDispatch } from '@wordpress/data';
import { useEffect, useState } from '@wordpress/element';
import equal from 'fast-deep-equal';

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
		bgColor_form,
		bgGradient_form,
		radius_form,
		border_form,
		margin_form,
		padding_form,
	} = attributes;

	// セル要素を生成する関数
	const cellObjects = (inputInnerBlocks) => {
		return inputInnerBlocks.map((input_elm) => ({
			cells: [
				{
					content: input_elm.attributes.labelContent,
					tag: 'td'
				},
				{
					content: input_elm.attributes.inputValue,
					tag: 'td'
				}
			]
		}));
	}

	//単色かグラデーションかの選択
	const bgColor = bgColor_form || bgGradient_form;


	//ブロックのスタイル設定
	const margin_obj = marginProperty(margin_form);
	const padding_obj = paddingProperty(padding_form);
	const radius_obj = radiusProperty(radius_form);
	const border_obj = borderProperty(border_form);
	const blockStyle = { background: bgColor, ...margin_obj, ...padding_obj, ...radius_obj, ...border_obj };

	// dispatch関数を取得
	const { removeBlocks, updateBlockAttributes } = useDispatch('core/block-editor');


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

	//自分のインナーブロック
	const innerBlocks = useSelect(
		(select) => select('core/block-editor').getBlocks(clientId), [clientId]
	);
	// 自分のインナーブロックのID
	const innerBlocksIds = useSelect((select) =>
		select('core/block-editor').getBlocks(clientId).map((block) => block.clientId), [clientId]
	);

	//タイトルの属性を初期化
	const titleBlockAttributes = innerBlocks
		.filter(block => block.name === 'itmar/design-title')
		.map(block => block.attributes);
	const [titleAttributes, setTitleAttributes] = useState(titleBlockAttributes[0]);


	//インナーブロックのテンプレートを初期化
	const orgTemplate = [
		['itmar/design-title', { ...titleAttributes }],
		['core/table', {}]
	];
	const [innerTemplate, setInnerTemplate] = useState(orgTemplate);

	//インナーブロックのひな型を作る
	const innerBlocksProps = useInnerBlocksProps(
		{},
		{
			//allowedBlocks: ['itmar/input-figure-block'],
			template: innerTemplate,
			templateLock: false
		}
	);

	//inputInnerBlocks に変化があればinnerTemplateを更新
	useEffect(() => {

		if (inputFigureBlocks.length !== 0) {

			//テーブルボディを生成
			const tableHead = [];
			const tableBody = cellObjects(inputFigureBlocks);
			const tablefoot = [];
			const tableBlock = ['core/table', { className: 'itmar_md_block', hasFixedLayout: true, head: tableHead, body: tableBody, foot: tablefoot }];
			const newTemplate = [
				['itmar/design-title', { ...titleAttributes }],
				tableBlock
			];
			if (!equal(innerTemplate, newTemplate)) {
				//一旦既存のブロックを削除
				if (innerBlocksIds.length > 0) {
					//タイトル部分の属性を退避
					const titleBlockAttributes = innerBlocks
						.filter(block => block.name === 'itmar/design-title')
						.map(block => block.attributes);

					setTitleAttributes(titleBlockAttributes[0]);
					console.log('削除前:' + titleAttributes?.headingContent);
					//インナーブロック削除
					removeBlocks(innerBlocksIds[1], false);
				}
			}
		}
	}, [inputFigureBlocks]);


	//ブロックの削除を確認して再度ブロックをレンダリング
	useEffect(() => {
		if (innerBlocksIds.length === 0 && inputFigureBlocks.length > 0) {
			console.log('再レンダリング前:' + titleAttributes?.headingContent);
			//テーブルボディを生成
			const tableHead = [];
			const tableBody = cellObjects(inputFigureBlocks);
			const tablefoot = [];
			const tableBlock = ['core/table', { className: 'itmar_md_block', hasFixedLayout: true, head: tableHead, body: tableBody, foot: tablefoot }];

			// Set the new template

			setInnerTemplate([
				['itmar/design-title', { ...state.titleAttributes }],
				tableBlock
			]);
		}
	}, [innerBlocksIds.length]);

	//Submitによるプロセス変更
	const handleSubmit = (e) => {
		e.preventDefault();
		// 親ブロックのstate_process属性を更新
		updateBlockAttributes(parentClientId, { state_process: 'thanks' });
	};

	//ルート要素にスタイルとクラスを付加	
	const blockProps = useBlockProps({
		style: blockStyle,
		className: context['itmar/state_process'] === 'confirm' ? 'appear' : "",
	});


	return (
		<>
			<InspectorControls group="styles">
				<PanelBody title="確認フォームスタイル設定" initialOpen={true} className="form_design_ctrl">

					<PanelColorGradientSettings
						title={__(" Background Color Setting")}
						settings={[
							{
								colorValue: bgColor_form,
								gradientValue: bgGradient_form,

								label: __("Choose Background color"),
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
			<div {...blockProps} >
				<form onSubmit={handleSubmit}>
					<div {...innerBlocksProps}></div>

					<input type="submit" value="送信実行" />
				</form>
			</div>
		</>

	);
}
