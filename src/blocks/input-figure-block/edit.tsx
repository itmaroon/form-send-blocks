import { __ } from "@wordpress/i18n";
import "./editor.scss";

import {
	useBlockProps,
	useInnerBlocksProps,
	InspectorControls,
	__experimentalPanelColorGradientSettings as PanelColorGradientSettings,
	__experimentalBorderRadiusControl as BorderRadiusControl,
} from "@wordpress/block-editor";
import {
	PanelBody,
	TextControl,
	ToggleControl,
	SelectControl,
	BoxControl,
	BorderBoxControl,
} from "@wordpress/components";

import "./editor.scss";

import { useCallback, useEffect, useRef, useState } from "@wordpress/element";
import { useSelect, useDispatch } from "@wordpress/data";
import { useMergeRefs } from "@wordpress/compose";
import { store as blockEditorStore } from "@wordpress/block-editor";
import { StyleSheetManager } from "styled-components";
import { StyleComp } from "./StyleInputFigure";

import {
	useElementBackgroundColor,
	useIsIframeMobile,
	ShadowStyle,
	ShadowElm,
	ShadowState,
} from "itmar-block-packages";

import {
	BlockEditProps,
	BlockInstance,
	TemplateArray,
} from "@wordpress/blocks";

import { usePreventEditorFormSubmit } from "../front_common";

import type { Attributes } from "./type";

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

//要素幅を計測する関数
const measureTextWidth = (
	text: string,
	fontSize: string,
	fontFamily: string,
) => {
	const canvas = document.createElement("canvas");
	const context = canvas.getContext("2d");
	if (!context) {
		console.error("Canvas 2D context could not be initialized.");
		return 0;
	}
	context.font = `${fontSize} ${fontFamily}`;
	const metrics = context.measureText(text);
	return metrics.width;
};

export default function Edit({
	attributes,
	setAttributes,
	context,
	clientId,
}: BlockEditProps<Attributes>) {
	const {
		form_type,
		form_name,
		bgColor,
		bgColor_form,
		bgGradient_form,
		radius_form,
		border_form,
		default_pos,
		mobile_pos,
		stage_info,
		isLastStep,
		is_shadow,
	} = attributes;
	const shadow_element = attributes.shadow_element as ShadowState;

	//ブロックの背景色
	const blockStyle = { background: bgColor };

	//親のcontextから今のステップ数を取得
	const currentStep = context["itmar/current_step"] as number;

	//ブロック情報の取得
	const {
		parentClientId,
		thisBlockIndex,
		thisInputIndex,
		totalInput,
		buttonBlocks,
		innerBlocks,
	} = useSelect(
		(select) => {
			const { getBlockRootClientId, getBlocks, getBlock } = select(
				blockEditorStore,
			) as any;

			// 1. 親の clientId を取得
			const parentId = getBlockRootClientId(clientId);

			// 2. 親の直下にある全ブロックを取得し、"figure-block" を含むものの中での順番を特定
			const parentBlock = getBlock(parentId);
			const siblings = parentBlock ? parentBlock.innerBlocks : [];
			const figureBlockSiblings = siblings.filter((block: BlockInstance) =>
				block.name.includes("figure-block"),
			);
			const buttonBlocks = getBlocks(clientId).filter(
				(block: BlockInstance) => block.name === "itmar/design-button",
			);

			const index = figureBlockSiblings.findIndex(
				(block: BlockInstance) => block.clientId === clientId,
			);
			const inputBlockSiblings = siblings.filter((block: BlockInstance) =>
				block.name.includes("input-figure-block"),
			);
			const inputIndex = inputBlockSiblings.findIndex(
				(block: BlockInstance) => block.clientId === clientId,
			);

			// 3. 自分自身（this block）の直下のインナーブロックを取得
			const thisInnerBlocks = getBlocks(clientId) || [];

			return {
				parentClientId: parentId,
				thisBlockIndex: index,
				innerBlocks: thisInnerBlocks,
				thisInputIndex: inputIndex,
				buttonBlocks: buttonBlocks,
				totalInput: inputBlockSiblings.length,
			};
		},
		[clientId],
	);

	// dispatch関数を取得
	const { updateBlockAttributes } = useDispatch("core/block-editor");

	//フォームをサブミットする処理をOnSubmitより早く処理する
	const formRef = usePreventEditorFormSubmit({
		parentClientId,
		currentStep,
		updateBlockAttributes,
	});

	//インナーブロックの制御

	const MAIL_TEMPLATE: TemplateArray = [
		[
			"itmar/design-text-ctrl",
			{
				inputName: "userName",
				labelContent: __("Name", "form-send-blocks"),
				required: { flg: true, display: __("Required", "form-send-blocks") },
				placeFolder: __("Please enter your name", "form-send-blocks"),
			},
		],
		[
			"itmar/design-text-ctrl",
			{
				inputName: "email",
				labelContent: __("E-mail Address", "form-send-blocks"),
				inputType: "email",
				required: { flg: true, display: __("Required", "form-send-blocks") },
				placeFolder: __("Please enter your e-mail address", "form-send-blocks"),
			},
		],
		[
			"itmar/design-text-ctrl",
			{
				inputName: "message",
				labelContent: __("Inquiry details", "form-send-blocks"),
				inputType: "textarea",
				required: { flg: true, display: __("Required", "form-send-blocks") },
				placeFolder: __("Please enter inquiry", "form-send-blocks"),
			},
		],
		[
			"itmar/design-checkbox",
			{
				labelContent: __(
					"Agree to the privacy policy and send.",
					"form-send-blocks",
				),
			},
		],
		[
			"itmar/design-button",
			{
				buttonType: "submit",
				labelContent: __("To confirmation screen", "form-send-blocks"),
				align: "center",
			},
		],
	];
	const MEMBER_TEMPLATE: TemplateArray = [
		[
			"itmar/design-text-ctrl",
			{
				inputName: "memberLastName",
				labelContent: __("Last Name", "form-send-blocks"),
				required: { flg: true, display: __("Required", "form-send-blocks") },
				placeFolder: __("Please enter your last name", "form-send-blocks"),
			},
		],
		[
			"itmar/design-text-ctrl",
			{
				inputName: "memberFirstName",
				labelContent: __("First Name", "form-send-blocks"),
				required: { flg: true, display: __("Required", "form-send-blocks") },
				placeFolder: __("Please enter your first name", "form-send-blocks"),
			},
		],
		[
			"itmar/design-text-ctrl",
			{
				inputName: "email",
				labelContent: __("E-mail Address", "form-send-blocks"),
				inputType: "email",
				required: { flg: true, display: __("Required", "form-send-blocks") },
				placeFolder: __("Please enter your e-mail address", "form-send-blocks"),
			},
		],
		[
			"itmar/design-text-ctrl",
			{
				inputName: "password",
				labelContent: __("PassWord", "form-send-blocks"),
				inputType: "pass",
				required: { flg: true, display: __("Required", "form-send-blocks") },
				placeFolder: __("Please enter Password", "form-send-blocks"),
			},
		],
		[
			"itmar/design-checkbox",
			{
				labelContent: __(
					"Agree to the privacy policy and send.",
					"form-send-blocks",
				),
			},
		],
		[
			"itmar/design-group",
			{
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
			[
				[
					"itmar/design-button",
					{
						buttonType: "submit",
						labelContent: __("Send a confirmation email", "form-send-blocks"),
						align: "center",
						buttonKey: "submit_key",
					},
				],
				[
					"itmar/design-button",
					{
						buttonType: "submit",
						labelContent: __("Cancel", "form-send-blocks"),
						align: "center",
						buttonKey: "cancel_key",
					},
				],
			],
		],
	];

	const LOGIN_TEMPLATE: TemplateArray = [
		[
			"itmar/design-text-ctrl",
			{
				inputName: "userID",
				labelContent: __("ID or email", "form-send-blocks"),
				required: { flg: true, display: __("Required", "form-send-blocks") },
				placeFolder: __("Please enter your name", "form-send-blocks"),
			},
		],
		[
			"itmar/design-text-ctrl",
			{
				inputName: "password",
				labelContent: __("PassWord", "form-send-blocks"),
				inputType: "pass",
				required: { flg: true, display: __("Required", "form-send-blocks") },
				placeFolder: __("Please enter Password", "form-send-blocks"),
			},
		],
		[
			"itmar/design-checkbox",
			{
				labelContent: __(
					"Agree to the privacy policy and send.",
					"form-send-blocks",
				),
			},
		],
		[
			"itmar/design-title",
			{
				headingContent: __(
					"If you haven't registered yet, click here",
					"form-send-blocks",
				),
				headingType: "H3",
				linkKind: "fixed",
				is_underLine: true,
			},
		],

		[
			"itmar/design-group",
			{
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
			[
				[
					"itmar/design-button",
					{
						buttonType: "submit",
						labelContent: __("Login", "form-send-blocks"),
						align: "center",
						buttonKey: "submit_key",
					},
				],
				[
					"itmar/design-button",
					{
						buttonType: "submit",
						labelContent: __("Cancel", "form-send-blocks"),
						align: "center",
						buttonKey: "cancel_key",
					},
				],
			],
		],
	];

	const input_template =
		form_type === "inquiry"
			? MAIL_TEMPLATE
			: form_type === "member"
			? MEMBER_TEMPLATE
			: form_type === "login"
			? LOGIN_TEMPLATE
			: undefined;

	const innerBlocksProps = useInnerBlocksProps(
		{},
		{
			allowedBlocks: [
				"itmar/design-text-ctrl",
				"itmar/design-checkbox",
				"itmar/design-button",
				"itmar/design-select",
				"itmar/design-title",
				"itmar/design-group",
			],
			template: input_template,
			templateLock: false,
		},
	);

	//インナーブロックのラベル幅を取得
	useEffect(() => {
		//'itmar/design-checkbox''itmar/design-button'を除外
		const filteredBlocks = innerBlocks.filter(
			(block: BlockInstance) =>
				block.name !== "itmar/design-checkbox" &&
				block.name !== "itmar/design-button" &&
				block.name !== "itmar/design-title" &&
				block.name !== "itmar/design-group",
		);
		const maxNum = filteredBlocks.reduce(
			(max: number, block: BlockInstance) => {
				//必須項目の表示を設定
				const dispLabel = block.attributes.required.flg
					? `${block.attributes.labelContent}(${block.attributes.required.display})`
					: block.attributes.labelContent;
				//フォントサイズを取得
				const renderFontSize = !isMobile
					? block.attributes.font_style_label.default_fontSize
					: block.attributes.font_style_label.mobile_fontSize;
				//幅の計測
				return Math.max(
					max,
					measureTextWidth(
						dispLabel,
						renderFontSize,
						block.attributes.font_style_label.fontFamily,
					),
				);
			},
			Number.MIN_SAFE_INTEGER,
		);
		setAttributes({ label_width: `${Math.round(maxNum)}px` });
	}, [innerBlocks]);

	//モバイルの判定
	const isMobile = useIsIframeMobile();

	//ブロックの参照
	const blockRef = useRef<HTMLDivElement | null>(null);
	const [styleSheetTarget, setStyleSheetTarget] =
		useState<HTMLHeadElement | null>(null);
	const ownerDocumentRef = useCallback((node: HTMLDivElement | null) => {
		setStyleSheetTarget(node?.ownerDocument.head ?? null);
	}, []);
	const mergedBlockRef = useMergeRefs([blockRef, ownerDocumentRef]);

	//ルート要素にスタイルとクラスを付加
	const blockProps = useBlockProps({
		ref: mergedBlockRef,
		style: blockStyle,
		className: `figure_fieldset ${
			//context["itmar/state_process"] === "input" ? "appear" : ""
			context["itmar/current_step"] === thisBlockIndex ? "appear" : ""
		}`,
		name: form_name,
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

	//最後のブロックかどうかを判定したフラグを格納しておく
	useEffect(() => {
		const isLast = thisInputIndex === totalInput - 1 && totalInput > 0;
		setAttributes({
			inputIndex: thisInputIndex,
		});
		// ✅ 「最後かどうか」が変わった、または「自分の番号」が変わった場合に更新
		if (isLast !== isLastStep) {
			setAttributes({
				isLastStep: isLast,
			});
		}
		// ✅ 依存配列に現在の属性値も含めることで、不整合を防ぎます
	}, [thisInputIndex, totalInput]);

	return (
		<>
			<InspectorControls group="settings">
				<PanelBody
					title={__(
						"Transmission form information setting",
						"form-send-blocks",
					)}
					initialOpen={true}
					className="form_setteing_ctrl"
				>
					<SelectControl
						label={__("Input Form Type", "form-send-blocks")}
						value={form_type as any}
						options={[
							{ label: __("Inquiry", "form-send-blocks"), value: "inquiry" },
							{
								label: __("Membership Registration", "form-send-blocks"),
								value: "member",
							},
							{
								label: __("Login", "form-send-blocks"),
								value: "login",
							},
						]}
						onChange={(newName) => {
							setAttributes({ form_type: newName });
						}}
					/>
					<TextControl
						label={__("Form Name", "form-send-blocks")}
						value={form_name}
						help={__(
							"This is the name used to identify it as a data source.",
							"form-send-blocks",
						)}
						onChange={(newVal) => setAttributes({ form_name: newVal })}
					/>
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
								onColorChange: (newValue?: string) =>
									setAttributes({ bgColor: newValue }),
							},
							{
								colorValue: bgColor_form,
								gradientValue: bgGradient_form,

								label: __("Choose Form Background color", "form-send-blocks"),
								onColorChange: (newValue?: string) =>
									setAttributes({
										bgColor_form: newValue,
									}),
								onGradientChange: (newValue?: string) =>
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
							onChange={(newBrVal: any) =>
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
								? __("Margin settings(desk top)", "itmar_block_collections")
								: __("Margin settings(mobile)", "itmar_block_collections")
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
								? __("Padding settings(desk top)", "itmar_block_collections")
								: __("Padding settings(mobile)", "itmar_block_collections")
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
				<StyleSheetManager target={styleSheetTarget ?? undefined}>
					<StyleComp attributes={attributes}>
						<form ref={formRef}>
							<div {...innerBlocksProps}></div>
						</form>
					</StyleComp>
				</StyleSheetManager>
			</div>
		</>
	);
}
