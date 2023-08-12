
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
import { useSelect, useDispatch, withSelect } from '@wordpress/data';
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
		infomail_success,
		infomail_faile,
		retmail_success,
		retmail_faile,
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
		updateBlockAttributes(parentClientId, { state_process: 'input' });
	};

	//インナーブロックの制御
	const TEMPLATE = [
		['itmar/design-title', {}],
		['core/paragraph', { className: 'itmar_md_block' }]
	];
	const innerBlocksProps = useInnerBlocksProps(
		{},
		{
			template: TEMPLATE,
			templateLock: true
		}
	);

	//終了時のリダイレクト先を固定ページから選択
	const RedirectSelectControl = withSelect((select) => {
		const pages = select('core').getEntityRecords('postType', 'page');
		if (pages && !pages.some(page => page.id === -1)) {
			// ホームページ用の選択肢を追加します。
			pages.unshift({ id: -1, title: { rendered: 'ホーム' }, link: '/' });
		}
		return { pages }

	})(function ({ pages, setAttributes, attributes }) {
		const { selectedPageId, selectedPageUrl } = attributes;
		// 選択肢が選択されたときの処理です。
		const handleChange = (selectedId) => {
			const selectedPage = pages.find(page => page.id === selectedId);
			setAttributes({
				selectedPageId: selectedId,
				selectedPageUrl: selectedPage ? selectedPage.link : '/'
			});
		};
		// 選択肢を作成します。
		const options = pages ? pages.map(page => ({
			value: page.id,
			label: page.title.rendered
		})) : [];

		return (
			<ComboboxControl
				label="リダイレクト先を選択"
				options={options}
				value={selectedPageId}
				onChange={handleChange}
			/>
		);
	});



	//ルート要素にスタイルとクラスを付加	
	const blockProps = useBlockProps({
		style: blockStyle,
		className: `figure_fieldset ${context['itmar/state_process'] === 'thanks' ? 'appear' : ""}`,
	});

	return (
		<>
			<InspectorControls group="settings">
				<PanelBody title="完了フォーム情報設定" initialOpen={true} className="form_setteing_ctrl">
					<TextControl
						label="ステージの情報"
						value={stage_info}
						help="プロセスエリアに表示するステージの情報を入力して下さい。"
						onChange={(newVal) => setAttributes({ stage_info: newVal })}
					/>
					<TextareaControl
						label="通知メール送信奏功表示"
						value={infomail_success}
						onChange={(newVal) => setAttributes({ infomail_success: newVal })}
						rows="3"
					/>
					<TextareaControl
						label="通知メール送信エラー表示"
						value={infomail_faile}
						onChange={(newVal) => setAttributes({ infomail_faile: newVal })}
						rows="3"
					/>
					<TextareaControl
						label="応答メール送信奏功表示"
						value={retmail_success}
						onChange={(newVal) => setAttributes({ retmail_success: newVal })}
						rows="3"
					/>
					<TextareaControl
						label="応答メール送信エラー表示"
						value={retmail_faile}
						onChange={(newVal) => setAttributes({ retmail_faile: newVal })}
						rows="3"
					/>

					<PanelBody title="終了時のリダイレクト先選択">
						<RedirectSelectControl
							attributes={attributes}
							setAttributes={setAttributes}
						/>
					</PanelBody>

				</PanelBody>

			</InspectorControls>
			<InspectorControls group="styles">
				<PanelBody title="完了フォームスタイル設定" initialOpen={true} className="form_design_ctrl">

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
					<input type="submit" value="ホーム画面へ" />
				</form>
			</div >

		</>

	);
}

