import { __ } from "@wordpress/i18n";
import "./editor.scss";
import { useSelect, useDispatch, select } from "@wordpress/data";
import { useEffect, useRef } from "@wordpress/element";
import { StyleComp } from "./StyleConfirmFigure";
import { useStyleIframe } from "../iframeFooks";
import {
	useElementBackgroundColor,
	useIsIframeMobile,
	ShadowStyle,
	ShadowElm,
} from "itmar-block-packages";
import {
	useBlockProps,
	useInnerBlocksProps,
	InspectorControls,
	__experimentalPanelColorGradientSettings as PanelColorGradientSettings,
	__experimentalBorderRadiusControl as BorderRadiusControl,
} from "@wordpress/block-editor";

import {
	PanelBody,
	ToggleControl,
	TextControl,
	__experimentalBoxControl as BoxControl,
	__experimentalBorderBoxControl as BorderBoxControl,
} from "@wordpress/components";
import { createBlock } from "@wordpress/blocks";

//スペースのリセットバリュー
const padding_resetValues = {
	top: "10px",
	left: "10px",
	right: "10px",
	bottom: "10px",
};

//ボーダーのリセットバリュー
const border_resetValues = {
	top: "0px",
	left: "0px",
	right: "0px",
	bottom: "0px",
};

const units = [
	{ value: "px", label: "px" },
	{ value: "em", label: "em" },
	{ value: "rem", label: "rem" },
];

export default function Edit({ attributes, setAttributes, context, clientId }) {
	const {
		bgColor,
		bgColor_form,
		bgGradient_form,
		radius_form,
		border_form,
		default_pos,
		mobile_pos,
		send_id,
		cancel_id,
		stage_info,
		shadow_element,
		shadow_result,
		is_shadow,
	} = attributes;

	//ブロックの背景色
	const blockStyle = { background: bgColor };

	// dispatch関数を取得
	const { updateBlockAttributes, replaceInnerBlocks } =
		useDispatch("core/block-editor");

	// 親ブロックのclientIdを取得
	const parentClientId = useSelect(
		(select) => {
			const { getBlockRootClientId } = select("core/block-editor");
			// 親ブロックのclientIdを取得
			const parentClientId = getBlockRootClientId(clientId);
			return parentClientId;
		},
		[clientId],
	); // clientIdが変わるたびに監視対象のstateを更新する

	// 監視対象のinput要素を取得する
	const inputFigureBlocks = useSelect(
		(select) => {
			const { getBlockRootClientId, getBlocks } = select("core/block-editor");
			// 親ブロックのclientIdを取得
			const parentClientId = getBlockRootClientId(clientId);
			// 親ブロックを取得
			const parentInnerBlocks = getBlocks(parentClientId);
			//親のインナーブロックからitmar/input-figure-blockを抽出
			const inputFigureBlock = parentInnerBlocks.find(
				(block) => block.name === "itmar/input-figure-block",
			);
			//その中のインナーブロック
			const inputInnerBlocks = inputFigureBlock
				? inputFigureBlock.innerBlocks
				: [];
			return inputInnerBlocks; // 監視対象のstateを返す
		},
		[clientId],
	); // clientIdが変わるたびに監視対象のstateを更新する

	//タイトル属性の監視（最初のitmar/design-title）
	// const titleBlockAttributes = useSelect(
	// 	(select) => {
	// 		const blocks = select("core/block-editor").getBlocks(clientId);
	// 		//タイトル属性の取得・初期化
	// 		const titleBlock = blocks.find(
	// 			(block) => block.name === "itmar/design-title",
	// 		);
	// 		return titleBlock
	// 			? titleBlock.attributes
	// 			: {
	// 					headingContent: __("Please check your entries", "form-send-blocks"),
	// 					headingType: "H3",
	// 			  };
	// 	},
	// 	[clientId],
	// );

	//テーブル属性の監視（最初のitmar/design-table）
	// const tableBlockAttributes = useSelect(
	// 	(select) => {
	// 		const blocks = select("core/block-editor").getBlocks(clientId);
	// 		//タイトル属性の取得・初期化
	// 		const tableBlock = blocks.find(
	// 			(block) => block.name === "itmar/design-table",
	// 		);
	// 		return tableBlock ? tableBlock.attributes : {};
	// 	},
	// 	[clientId],
	// );

	//ブロックの監視
	const {
		titleBlockAttributes,
		tableBlockAttributes,
		buttonGroupAttributes,
		buttonBlockAttributes,
	} = useSelect(
		(select) => {
			const blocks = select("core/block-editor").getBlocks(clientId);

			//タイトル属性の取得・初期化
			const titleBlock = blocks.find(
				(block) => block.name === "itmar/design-title",
			);

			//テーブル属性の取得・初期化
			const tableBlock = blocks.find(
				(block) => block.name === "itmar/design-table",
			);

			//ボタン属性の監視（itmar/design-groupと２つのitmar/design-button）
			const buttonGroup = blocks.find(
				(block) => block.name === "itmar/design-group",
			);

			const buttonAttributes = buttonGroup
				? buttonGroup.innerBlocks
						.filter((block) => block.name === "itmar/design-button")
						.map((block) => block.attributes)
				: [];

			return {
				titleBlockAttributes: titleBlock?.attributes,
				tableBlockAttributes: tableBlock?.attributes,
				buttonGroupAttributes: buttonGroup?.attributes,
				buttonBlockAttributes: buttonAttributes,
			};
		},
		[clientId],
	);

	//インナーブロックのテンプレートを初期化
	const orgTemplate = [];

	//インナーブロックのひな型を作る
	const innerBlocksProps = useInnerBlocksProps(
		{},
		{
			//allowedBlocks: ['itmar/input-figure-block'],
			template: orgTemplate,
			templateLock: true,
		},
	);

	useEffect(() => {
		//タイトルブロックの取得と初期化
		const setTitleAttributes = titleBlockAttributes
			? titleBlockAttributes
			: {
					headingContent: __("Please check your entries", "form-send-blocks"),
					headingType: "H3",
			  };

		//テーブルブロックの取得と初期化
		const setTableAttributes = tableBlockAttributes ? tableBlockAttributes : {};

		//ブロックのレンダリング処理
		const button1 = createBlock(
			"itmar/design-button",
			buttonBlockAttributes && buttonBlockAttributes.length > 1
				? {
						...buttonBlockAttributes[0],
				  }
				: {
						buttonType: "submit",
						buttonId: "btn_id_send",
						labelContent: __("Send", "form-send-blocks"),
				  },
		);
		const button2 = createBlock(
			"itmar/design-button",
			buttonBlockAttributes && buttonBlockAttributes.length > 1
				? {
						...buttonBlockAttributes[1],
				  }
				: {
						buttonType: "submit",
						buttonId: "btn_id_cancel",
						labelContent: __("Return to send screen", "form-send-blocks"),
				  },
		);
		const groupBlock = createBlock(
			"itmar/design-group",
			buttonGroupAttributes
				? { ...buttonGroupAttributes }
				: {
						default_val: {
							direction: "horizen",
							inner_align: "center",
							outer_align: "center",
							width_val: "fit",
							max_width: "fit",
							reverse: false,
							wrap: false,
							outer_vertical: "center",
							height_val: "fit",
						},
						mobile_val: {
							direction: "horizen",
							inner_align: "center",
							outer_align: "center",
							width_val: "fit",
							max_width: "fit",
							reverse: false,
							wrap: false,
							outer_vertical: "center",
							height_val: "fit",
						},
				  },
			[button1, button2],
		);
		//ボタンのIDをcomfirm-figure-blockに登録
		setAttributes({ send_id: button1.attributes.buttonId });
		setAttributes({ cancel_id: button2.attributes.buttonId });

		const newInnerBlocks = [
			createBlock("itmar/design-title", { ...setTitleAttributes }),
			createBlock("itmar/design-table", { ...setTableAttributes }),
			groupBlock,
		];

		replaceInnerBlocks(clientId, newInnerBlocks, false);
	}, [inputFigureBlocks]);

	//Submitによるプロセス変更
	const handleSubmit = (e) => {
		e.preventDefault();
		const click_id = e.nativeEvent.submitter.id;
		// 親ブロックのstate_process属性を更新
		if (click_id === send_id) {
			updateBlockAttributes(parentClientId, { state_process: "thanks" });
		} else if (click_id === cancel_id) {
			updateBlockAttributes(parentClientId, { state_process: "input" });
		}
	};

	//モバイルの判定
	const isMobile = useIsIframeMobile();

	//ブロックの参照
	const blockRef = useRef(null);
	//ルート要素にスタイルとクラスを付加
	const blockProps = useBlockProps({
		ref: blockRef, // ここで参照を blockProps に渡しています
		style: blockStyle,
		className: `figure_fieldset ${
			context["itmar/state_process"] === "confirm" ? "appear" : ""
		}`,
	});

	//背景色の取得
	const baseColor = useElementBackgroundColor(blockRef, blockProps.style);

	//背景色変更によるシャドー属性の書き換え
	useEffect(() => {
		if (baseColor) {
			setAttributes({
				shadow_element: { ...shadow_element, baseColor: baseColor },
			});
			const new_shadow = ShadowElm({ ...shadow_element, baseColor: baseColor });
			if (new_shadow) {
				setAttributes({ shadow_result: new_shadow.style });
			}
		}
	}, [baseColor]);

	//サイトエディタの場合はiframeにスタイルをわたす。
	useStyleIframe(StyleComp, attributes);

	return (
		<>
			<InspectorControls group="settings">
				<PanelBody
					title={__(
						"Confirmation form information setting",
						"form-send-blocks",
					)}
					initialOpen={true}
					className="form_setteing_ctrl"
				>
					<TextControl
						label={__("Stage information", "form-send-blocks")}
						value={stage_info}
						help={__(
							"Please enter the stage information to be displayed in the process area.",
							"form-send-blocks",
						)}
						onChange={(newVal) => setAttributes({ stage_info: newVal })}
					/>
				</PanelBody>
			</InspectorControls>
			<InspectorControls group="styles">
				<PanelBody
					title={__("Global settings", "form-send-blocks")}
					initialOpen={true}
					className="form_design_ctrl"
				>
					<PanelColorGradientSettings
						title={__("Background Color Setting", "form-send-blocks")}
						settings={[
							{
								colorValue: bgColor,
								label: __("Choose Block Background color", "form-send-blocks"),
								onColorChange: (newValue) =>
									setAttributes({ bgColor: newValue }),
							},
							{
								colorValue: bgColor_form,
								gradientValue: bgGradient_form,

								label: __("Choose Form Background color", "form-send-blocks"),
								onColorChange: (newValue) =>
									setAttributes({ bgColor_form: newValue }),
								onGradientChange: (newValue) =>
									setAttributes({ bgGradient_form: newValue }),
							},
						]}
					/>
					<PanelBody
						title={__("Border Settings", "form-send-blocks")}
						initialOpen={false}
						className="border_design_ctrl"
					>
						<BorderBoxControl
							onChange={(newValue) => setAttributes({ border_form: newValue })}
							value={border_form}
							allowReset={true} // リセットの可否
							resetValues={border_resetValues} // リセット時の値
						/>
						<BorderRadiusControl
							values={radius_form}
							onChange={(newBrVal) =>
								setAttributes({
									radius_form:
										typeof newBrVal === "string"
											? { value: newBrVal }
											: newBrVal,
								})
							}
						/>
					</PanelBody>
					<BoxControl
						label={
							!isMobile
								? __("Margin settings(desk top)", "form-send-blocks")
								: __("Margin settings(mobile)", "form-send-blocks")
						}
						values={
							!isMobile ? default_pos.margin_form : mobile_pos.margin_form
						}
						onChange={(value) => {
							if (!isMobile) {
								setAttributes({
									default_pos: { ...default_pos, margin_form: value },
								});
							} else {
								setAttributes({
									mobile_pos: { ...mobile_pos, margin_form: value },
								});
							}
						}}
						units={units} // 許可する単位
						allowReset={true} // リセットの可否
						resetValues={padding_resetValues} // リセット時の値
					/>
					<BoxControl
						label={
							!isMobile
								? __("Padding settings(desk top)", "form-send-blocks")
								: __("Padding settings(mobile)", "form-send-blocks")
						}
						values={
							!isMobile ? default_pos.padding_form : mobile_pos.padding_form
						}
						onChange={(value) => {
							if (!isMobile) {
								setAttributes({
									default_pos: { ...default_pos, padding_form: value },
								});
							} else {
								setAttributes({
									mobile_pos: { ...mobile_pos, padding_form: value },
								});
							}
						}}
						units={units} // 許可する単位
						allowReset={true} // リセットの可否
						resetValues={padding_resetValues} // リセット時の値
					/>
					<ToggleControl
						label={__("Is Shadow", "form-send-blocks")}
						checked={is_shadow}
						onChange={(newVal) => {
							setAttributes({ is_shadow: newVal });
						}}
					/>
					{is_shadow && (
						<ShadowStyle
							shadowStyle={{ ...shadow_element }}
							onChange={(newStyle, newState) => {
								setAttributes({ shadow_result: newStyle.style });
								setAttributes({ shadow_element: newState });
							}}
						/>
					)}
				</PanelBody>
			</InspectorControls>
			<div {...blockProps}>
				<StyleComp attributes={attributes}>
					<form onSubmit={handleSubmit}>
						<div {...innerBlocksProps}></div>
					</form>
				</StyleComp>
			</div>
		</>
	);
}
