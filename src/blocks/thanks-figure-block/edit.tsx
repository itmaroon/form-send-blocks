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
	ToggleControl,
	TextareaControl,
	TextControl,
	ComboboxControl,
	BoxControl,
	BorderBoxControl,
} from "@wordpress/components";

import "./editor.scss";

import { useEffect, useRef } from "@wordpress/element";
import { useSelect, useDispatch } from "@wordpress/data";
import { StyleComp } from "./StyleThanksFigure";

import {
	useElementBackgroundColor,
	useIsIframeMobile,
	ShadowStyle,
	ShadowElm,
	PageSelectControl,
	flattenBlocks,
	useStyleIframe,
} from "itmar-block-packages";

import { usePreventEditorFormSubmit } from "../front_common";

import { store as blockEditorStore } from "@wordpress/block-editor";
import {
	BlockEditProps,
	BlockInstance,
	TemplateArray,
} from "@wordpress/blocks";

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

export default function Edit({
	attributes,
	setAttributes,
	context,
	clientId,
}: BlockEditProps<Attributes>) {
	const {
		displayMapping,
		bgColor,
		bgColor_form,
		bgGradient_form,
		radius_form,
		border_form,
		default_pos,
		mobile_pos,
		stage_info,
		shadow_element,
		is_shadow,
		selectedSlug,
	} = attributes;

	//ブロックのスタイル設定
	const blockStyle = { background: bgColor };

	//親のcontextから今のステップ数を取得
	const currentStep = context["itmar/current_step"] as number;

	//ブロック情報取得ツールの取得
	const {
		parentClientId,
		thisBlockIndex,
		inputFigureBlocks,
		messageBlocksOption,
	} = useSelect(
		(select) => {
			const { getBlockRootClientId, getBlocks } = select(
				blockEditorStore,
			) as any;
			// 親ブロックのclientIdを取得
			const parentClientId = getBlockRootClientId(clientId);

			// まず直下のブロックを取得
			const rootInnerBlocks = getBlocks(clientId) || [];

			// 「孫」まで平坦化
			// topBlockAttributesなどで使っていたロジックと同じです
			const flatBlocks = flattenBlocks(rootInnerBlocks);

			// 兄弟ブロックを取得
			const siblings = getBlocks(parentClientId);

			//兄弟のfigure-blockを取得し、その順番を返す
			const figureBlockSiblings = siblings.filter((block: BlockInstance) =>
				block.name.includes("figure-block"),
			);
			const index = figureBlockSiblings.findIndex(
				(block: BlockInstance) => block.clientId === clientId,
			);

			const inputFigureBlocks = siblings.filter(
				(block: BlockInstance) => block.name === "itmar/input-figure-block",
			);

			const messageBlocksOption = flatBlocks
				.filter(
					(block: BlockInstance) =>
						block.name === "itmar/design-title" && block.attributes.uniqueID,
				)
				.map((block) => ({
					value: block.attributes.uniqueID,
					label: block.attributes.uniqueID,
				}));
			return {
				parentClientId: parentClientId,
				thisBlockIndex: index,
				inputFigureBlocks: inputFigureBlocks,
				messageBlocksOption: messageBlocksOption,
			};
		},
		[clientId],
	);
	// 親ブロックのclientIdを取得

	// dispatch関数を取得
	const { updateBlockAttributes } = useDispatch("core/block-editor");

	//フォームをサブミットする処理をOnSubmitより早く処理する
	const formRef = usePreventEditorFormSubmit({
		parentClientId,
		currentStep,
		updateBlockAttributes,
	});

	//info typeごとのデフォルトの標題

	//インナーブロックの制御
	const TEMPLATE: TemplateArray = [
		[
			"itmar/design-title",
			{
				headingContent: __(
					"The subject line set by the user will be inserted into the sent email.",
					"form-send-blocks",
				),
			},
		],
		[
			"core/paragraph",
			{
				className: "itmar_ex_block",
				content: __(
					"The contents set in the sidebar will be displayed here as the transmission result. Any changes you make to the contents of this paragraph block will not be reflected anywhere. Only design settings are valid.",
					"form-send-blocks",
				),
			},
		],
		[
			"itmar/design-button",
			{
				buttonType: "submit",
				align: "center",
			},
		],
	];
	const innerBlocksProps = useInnerBlocksProps(
		{},
		{
			template: TEMPLATE,
			templateLock: false,
		},
	);

	//モバイルの判定
	const isMobile = useIsIframeMobile();

	//ブロックの参照
	const blockRef = useRef(null);
	//ルート要素にスタイルとクラスを付加
	const blockProps = useBlockProps({
		ref: blockRef, // ここで参照を blockProps に渡しています
		style: blockStyle,
		className: `figure_fieldset ${
			//context["itmar/state_process"] === appear_state ? "appear" : ""
			context["itmar/current_step"] === thisBlockIndex ? "appear" : ""
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
	const styledEditorContent = useStyleIframe(StyleComp, attributes);

	return (
		<>
			<InspectorControls group="settings">
				<PanelBody
					title={__("Completion form information settings", "form-send-blocks")}
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

					<PanelBody title={__("Input Figure Mapping", "itmar")}>
						{inputFigureBlocks.map((block: BlockInstance) => {
							//インプットフィギュアごとにデザインボタンブロックを取得（buttonKeyを持つもの）
							const buttonBlocks = flattenBlocks(
								block.innerBlocks || [],
							).filter(
								(fb) =>
									fb.name === "itmar/design-button" && fb.attributes?.buttonKey,
							);
							return (
								<div key={block.clientId}>
									{buttonBlocks.map((btnBlock: BlockInstance) => {
										const buttonKey = btnBlock.attributes.buttonKey;
										const currentObj = displayMapping?.[buttonKey];

										return (
											<PanelBody
												title={`${btnBlock.attributes.buttonKey || ""} ${__(
													"Button Mapping",
													"form-send-blocks",
												)}`}
												initialOpen={false}
											>
												<TextControl
													key={btnBlock.clientId}
													label={__("Thanks Main Message", "form-send-blocks")}
													value={currentObj?.main_mess || ""}
													onChange={(newVal) => {
														if (buttonKey) {
															setAttributes({
																displayMapping: {
																	...displayMapping,
																	[buttonKey]: {
																		...(displayMapping?.[buttonKey] || {}),
																		main_mess: newVal,
																	},
																},
															});
														}
													}}
												/>
												<ComboboxControl
													label={__(
														"Main Message Display ID",
														"form-send-blocks",
													)}
													value={currentObj?.message_Id || ""}
													options={messageBlocksOption}
													onChange={(newVal) => {
														if (buttonKey) {
															setAttributes({
																displayMapping: {
																	...displayMapping,
																	[buttonKey]: {
																		...(displayMapping?.[buttonKey] || {}),
																		message_Id: newVal,
																	},
																},
															});
														}
													}}
												/>

												<TextareaControl
													label={__(
														"Notificication Success Infomation",
														"form-send-blocks",
													)}
													value={currentObj?.success_notice || ""}
													onChange={(newVal) => {
														if (buttonKey) {
															setAttributes({
																displayMapping: {
																	...displayMapping,
																	[buttonKey]: {
																		...(displayMapping?.[buttonKey] || {}),
																		success_notice: newVal,
																	},
																},
															});
														}
													}} // 一時的な編集値として保存する
													rows={5}
												/>
												<TextareaControl
													label={__(
														"Notificication Error Infomation",
														"form-send-blocks",
													)}
													value={currentObj?.error_notice || ""}
													onChange={(newVal) => {
														if (buttonKey) {
															setAttributes({
																displayMapping: {
																	...displayMapping,
																	[buttonKey]: {
																		...(displayMapping?.[buttonKey] || {}),
																		error_notice: newVal,
																	},
																},
															});
														}
													}} // 一時的な編集値として保存する
													rows={5}
												/>
												<TextareaControl
													label={__(
														"Responce Success Information",
														"form-send-blocks",
													)}
													value={currentObj?.success_responce || ""}
													onChange={(newVal) => {
														if (buttonKey) {
															setAttributes({
																displayMapping: {
																	...displayMapping,
																	[buttonKey]: {
																		...(displayMapping?.[buttonKey] || {}),
																		success_responce: newVal,
																	},
																},
															});
														}
													}} // 一時的な編集値として保存する
													rows={5}
												/>
												<TextareaControl
													label={__(
														"Responce Error Information",
														"form-send-blocks",
													)}
													value={currentObj?.responce_error || ""}
													onChange={(newVal) => {
														if (buttonKey) {
															setAttributes({
																displayMapping: {
																	...displayMapping,
																	[buttonKey]: {
																		...(displayMapping?.[buttonKey] || {}),
																		responce_error: newVal,
																	},
																},
															});
														}
													}} // 一時的な編集値として保存する
													rows={5}
												/>
											</PanelBody>
										);
									})}
								</div>
							);
						})}
					</PanelBody>
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

								label: __("Choose Background color", "form-send-blocks"),
								onColorChange: (newValue?: string) =>
									setAttributes({ bgColor_form: newValue }),
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
				{styledEditorContent}
				<StyleComp attributes={attributes}>
					<form ref={formRef}>
						<div {...innerBlocksProps}></div>
					</form>
				</StyleComp>
			</div>
		</>
	);
}
