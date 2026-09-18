import { __ } from "@wordpress/i18n";
import "./editor.scss";

import {
	useBlockProps,
	useInnerBlocksProps,
	InspectorControls,
	__experimentalPanelColorGradientSettings as PanelColorGradientSettings,
	__experimentalBorderRadiusControl as BorderRadiusControl,
	__experimentalBlockVariationPicker as BlockVariationPicker,
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

import { useEffect, useRef } from "@wordpress/element";
import { useSelect, useDispatch, select as selectStore } from "@wordpress/data";
import { store as blockEditorStore } from "@wordpress/block-editor";
import { createInputFigureStyleCss } from "./StyleInputFigure";

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
	createBlocksFromInnerBlocksTemplate,
} from "@wordpress/blocks";

/*
 * アイコンは SVG を使う。エディタのキャンバスは iframe で、Dashicons の
 * スタイルシートが読み込まれないため、文字列指定（"email-alt" など）では
 * アイコンが描画されず、選択肢のボタンが見えなくなる。
 */
import { inbox, postCommentsForm, comment, listView } from "@wordpress/icons";

import { usePreventEditorFormSubmit } from "../useEditorFormSubmit";
import {
	INQUIRY_CONFIRM_KEY,
	toConfirmButton,
	fieldLines,
	withFieldLines,
} from "../inquiryStarter";

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

	/*
	 * 問い合わせフォームの入力欄は、挿入時に固定の並びを押し込まず選ばせる。
	 * 入力欄の構成はサイトごとに違い、デザイン済みの完成形はテーマの
	 * パターンが持つもの。ここでは出発点になる並びだけを用意する。
	 * 会員登録とログインは必須の入力欄が決まっているので従来どおり固定。
	 */
	const textCtrl = (
		inputName: string,
		labelContent: string,
		placeFolder: string,
		inputType?: string,
	): [string, Record<string, unknown>] => [
		"itmar/design-text-ctrl",
		{
			inputName,
			labelContent,
			...(inputType ? { inputType } : {}),
			required: { flg: true, display: __("Required", "form-send-blocks") },
			placeFolder,
		},
	];
	const nameField = textCtrl(
		"userName",
		__("Name", "form-send-blocks"),
		__("Please enter your name", "form-send-blocks"),
	);
	const emailField = textCtrl(
		"email",
		__("E-mail Address", "form-send-blocks"),
		__("Please enter your e-mail address", "form-send-blocks"),
		"email",
	);
	const messageField = textCtrl(
		"message",
		__("Inquiry details", "form-send-blocks"),
		__("Please enter inquiry", "form-send-blocks"),
		"textarea",
	);
	// 同意のチェックは確認画面側に置く（inquiryStarter.ts の確認画面）
	const submitButton = toConfirmButton();

	const INQUIRY_VARIATIONS = [
		{
			name: "standard",
			title: __("Standard", "form-send-blocks"),
			description: __(
				"Name, email address and inquiry details.",
				"form-send-blocks",
			),
			icon: postCommentsForm,
			innerBlocks: [nameField, emailField, messageField, submitButton],
		},
		{
			name: "simple",
			title: __("Simple", "form-send-blocks"),
			description: __(
				"Email address and inquiry details only.",
				"form-send-blocks",
			),
			icon: comment,
			innerBlocks: [emailField, messageField, submitButton],
		},
		{
			name: "detailed",
			title: __("Detailed", "form-send-blocks"),
			description: __(
				"Adds phone number and subject to the standard form.",
				"form-send-blocks",
			),
			icon: listView,
			innerBlocks: [
				nameField,
				emailField,
				textCtrl(
					"tel",
					__("Phone number", "form-send-blocks"),
					__("Please enter your phone number", "form-send-blocks"),
				),
				textCtrl(
					"subject",
					__("Subject", "form-send-blocks"),
					__("Please enter the subject", "form-send-blocks"),
				),
				messageField,
				submitButton,
			],
		},
	];

	const input_template =
		form_type === "member"
			? MEMBER_TEMPLATE
			: form_type === "login"
			? LOGIN_TEMPLATE
			: undefined;

	// 問い合わせフォームで入力欄がまだ無いときだけ選択肢を出す
	const showPicker = form_type === "inquiry" && innerBlocks.length === 0;
	const { replaceInnerBlocks } = useDispatch(blockEditorStore) as any;
	const applyVariation = (variation: { innerBlocks: TemplateArray }) => {
		replaceInnerBlocks(
			clientId,
			createBlocksFromInnerBlocksTemplate(variation.innerBlocks),
			true,
		);

		/*
		 * 選んだ入力欄に合わせて、同じフォームの他のブロックを整える。
		 * - 確認画面：メール本文に「ラベル: [入力名]」を足す（本文に差し込み項目が
		 *   まだ無いときだけ。利用者が書いた本文は触らない）
		 * - 送信ブロック：自動応答の宛先に使う入力欄が未設定なら、メール欄を割り当てる
		 *   （空のままだと自動応答が送れない）
		 */
		if (!parentClientId) return;
		const { getBlocks, getBlockAttributes } = selectStore(blockEditorStore) as any;
		const lines = fieldLines(variation.innerBlocks);

		const confirm = (getBlocks(parentClientId) || []).find(
			(block: BlockInstance) => block.name === "itmar/confirm-figure-block",
		);
		const mapping = confirm?.attributes?.displayMapping?.[INQUIRY_CONFIRM_KEY];
		if (confirm && mapping) {
			updateBlockAttributes(confirm.clientId, {
				displayMapping: {
					...confirm.attributes.displayMapping,
					[INQUIRY_CONFIRM_KEY]: {
						...mapping,
						notice_content: withFieldLines(mapping.notice_content, lines),
						response_content: withFieldLines(mapping.response_content, lines),
					},
				},
			});
		}

		const sender = getBlockAttributes(parentClientId);
		const emailField = variation.innerBlocks.find(
			([name, attrs]) =>
				name === "itmar/design-text-ctrl" &&
				(attrs as { inputType?: string })?.inputType === "email",
		);
		if (sender && !sender.ret_mail && emailField) {
			updateBlockAttributes(parentClientId, {
				ret_mail: (emailField[1] as { inputName: string }).inputName,
			});
		}
	};

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
		/*
		 * ラベル付きの入力欄が無いときは幅を決めない。
		 * 以前は初期値の Number.MIN_SAFE_INTEGER がそのまま "-9007199254740991px" として
		 * 保存され、入力欄を後から入れた直後に再計算されないと、フロントでラベル幅が
		 * 揃わなくなっていた（入力欄を選択式にしたことで「空」の状態ができる）。
		 * 値が変わらないときは書き込まない（開くだけで変更扱いにしない）。
		 */
		const nextWidth =
			filteredBlocks.length > 0 && maxNum > 0
				? `${Math.round(maxNum)}px`
				: "auto";
		if (nextWidth !== attributes.label_width) {
			setAttributes({ label_width: nextWidth });
		}
	}, [innerBlocks]);

	//モバイルの判定
	const isMobile = useIsIframeMobile();

	//ブロックの参照
	const blockRef = useRef<HTMLDivElement | null>(null);
	const editorStyleClass = `itmar-input-editor-${clientId.replace(
		/[^a-zA-Z0-9_-]/g,
		"",
	)}`;
	const editorStyleCss = createInputFigureStyleCss(
		attributes,
		`.${editorStyleClass}`,
	);

	//ルート要素にスタイルとクラスを付加
	const blockProps = useBlockProps({
		ref: blockRef,
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
				<style>{editorStyleCss}</style>
				<div className={`itmar-wrap ${editorStyleClass}`}>
						{/*
						 * 選択肢はフォームの外に置く。中に置くと選択ボタンの click が
						 * usePreventEditorFormSubmit の submit 処理（ステップ送り）に拾われる。
						 * フォーム自体は常に描画しておく（フックの ref が外れないように）。
						 */}
						{showPicker && (
							<BlockVariationPicker
								icon={inbox}
								label={__("Inquiry form", "form-send-blocks")}
								instructions={__(
									"Choose the input fields to start with. You can add, remove and rearrange them afterwards.",
									"form-send-blocks",
								)}
								variations={INQUIRY_VARIATIONS}
								onSelect={applyVariation}
							/>
						)}
						<form ref={formRef}>
							{!showPicker && <div {...innerBlocksProps}></div>}
						</form>
				</div>
			</div>
		</>
	);
}
