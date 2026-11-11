import { plainText } from "../plainText";
import { useStageInfo, LangTextControl } from "../stageLang";
import { __, sprintf } from "@wordpress/i18n";
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
import { createThanksFigureStyleCss } from "./StyleThanksFigure";

import {
	useElementBackgroundColor,
	useIsIframeMobile,
	ShadowStyle,
	ShadowElm,
	flattenBlocks,
} from "itmar-block-packages";

import { usePreventEditorFormSubmit } from "../useEditorFormSubmit";

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
	} = attributes;

	//進行バーに出す段階の名前は、言語ごとに持てる（編集言語の切り替えと自動翻訳）
	const stage = useStageInfo("itmar/thanks-figure-block", stage_info, (next) =>
		setAttributes({ stage_info: next }),
	);

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
				labelContent: __("Return to home", "form-send-blocks"),
				linkKind: "fixed",
				selectedSlug: "__home__",
				selectedPageUrl: "[home_url]",
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
	const blockRef = useRef<HTMLDivElement | null>(null);
	const editorStyleClass = `itmar-thanks-editor-${clientId.replace(
		/[^a-zA-Z0-9_-]/g,
		"",
	)}`;
	const editorStyleCss = createThanksFigureStyleCss(
		attributes,
		`.${editorStyleClass}`,
	);

	//ルート要素にスタイルとクラスを付加
	const blockProps = useBlockProps({
		ref: blockRef,
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
			if ((attributes.shadow_element as { baseColor?: string } | undefined)?.baseColor !== baseColor) {
				setAttributes({
					shadow_element: { ...shadow_element, baseColor: baseColor },
				});
			}
			const new_shadow = ShadowElm({ ...shadow_element, baseColor: baseColor });
			if (new_shadow) {
				const nextShadow = new_shadow.style;
				if (JSON.stringify(nextShadow) !== JSON.stringify(attributes.shadow_result)) {
					setAttributes({ shadow_result: nextShadow });
				}
			}
		}
	}, [baseColor]);

	return (
		<>
			{stage.toolbar}
			<InspectorControls group="settings">
				<PanelBody
					title={__("Completion form information settings", "form-send-blocks")}
					initialOpen={true}
					className="form_setteing_ctrl"
				>
					{stage.control}

					<PanelBody
						title={__("Messages after sending", "form-send-blocks")}
					>
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
											<div key={btnBlock.clientId}>
	{(buttonBlocks.length > 1 || inputFigureBlocks.length > 1) && (
		<p style={{ fontWeight: 600 }}>
			{plainText(btnBlock.attributes.labelContent)} ({buttonKey})
		</p>
	)}
												<LangTextControl
	blockName="itmar/thanks-figure-block"
	label={__("Thanks Main Message", "form-send-blocks")}
	value={currentObj?.main_mess}
	
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

												<LangTextControl
	blockName="itmar/thanks-figure-block"
	label={__(
														"Notification success message",
														"form-send-blocks",
													)}
	value={currentObj?.success_notice}
	multiline
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
	}}
/>
												<LangTextControl
	blockName="itmar/thanks-figure-block"
	label={__(
														"Notification error message",
														"form-send-blocks",
													)}
	value={currentObj?.error_notice}
	multiline
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
	}}
/>
<ComboboxControl
	label={__("Notification result display ID", "form-send-blocks")}
	help={__("Leave empty to use the paragraph blocks in order.", "form-send-blocks")}
	value={currentObj?.notice_Id || ""}
	options={messageBlocksOption}
	onChange={(newVal) => {
		if (buttonKey) {
			setAttributes({
				displayMapping: {
					...displayMapping,
					[buttonKey]: {
						...(displayMapping?.[buttonKey] || {}),
						notice_Id: newVal,
					},
				},
			});
		}
	}}
/>
												<LangTextControl
	blockName="itmar/thanks-figure-block"
	label={__(
														"Automatic response success message",
														"form-send-blocks",
													)}
	value={currentObj?.success_responce}
	multiline
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
	}}
/>
												<LangTextControl
	blockName="itmar/thanks-figure-block"
	label={__(
														"Automatic response error message",
														"form-send-blocks",
													)}
	value={currentObj?.responce_error}
	multiline
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
	}}
/>
<ComboboxControl
	label={__("Automatic response result display ID", "form-send-blocks")}
	help={__("Leave empty to use the paragraph blocks in order.", "form-send-blocks")}
	value={currentObj?.responce_Id || ""}
	options={messageBlocksOption}
	onChange={(newVal) => {
		if (buttonKey) {
			setAttributes({
				displayMapping: {
					...displayMapping,
					[buttonKey]: {
						...(displayMapping?.[buttonKey] || {}),
						responce_Id: newVal,
					},
				},
			});
		}
	}}
/>
											</div>
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
				<style>{editorStyleCss}</style>
				<div className={`itmar-wrap ${editorStyleClass}`}>
						<form ref={formRef}>
							<div {...innerBlocksProps}></div>
						</form>
				</div>
			</div>
		</>
	);
}
