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
	__experimentalBoxControl as BoxControl,
	__experimentalBorderBoxControl as BorderBoxControl,
} from "@wordpress/components";

import "./editor.scss";

import { useEffect, useRef } from "@wordpress/element";
import { useSelect, useDispatch } from "@wordpress/data";
import { StyleComp } from "./StyleInputFigure";
import { useStyleIframe } from "../iframeFooks";
//import ShadowStyle, { ShadowElm } from '../ShadowStyle';
//import { useElementBackgroundColor, useIsIframeMobile } from '../CustomFooks';
import {
	useElementBackgroundColor,
	useIsIframeMobile,
	ShadowStyle,
	ShadowElm,
} from "itmar-block-packages";

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
const measureTextWidth = (text, fontSize, fontFamily) => {
	const canvas = document.createElement("canvas");
	const context = canvas.getContext("2d");
	context.font = `${fontSize} ${fontFamily}`;
	const metrics = context.measureText(text);
	return metrics.width;
};

export default function Edit({ attributes, setAttributes, context, clientId }) {
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
		shadow_element,
		is_shadow,
	} = attributes;

	//ブロックの背景色
	const blockStyle = { background: bgColor };

	//ブロック情報取得ツールの取得
	const { getBlockRootClientId } = useSelect(
		(select) => select("core/block-editor"),
		[clientId],
	);
	// 親ブロックのclientIdを取得
	const parentClientId = getBlockRootClientId(clientId);
	// dispatch関数を取得
	const { updateBlockAttributes } = useDispatch("core/block-editor");

	//Submitによるプロセス変更
	const handleSubmit = (e) => {
		e.preventDefault();
		if (form_type === "login") return; //loginのときは遷移なし
		const new_state =
			form_type === "inquiry"
				? "confirm"
				: form_type === "member"
				? "provision"
				: "";
		// 親ブロックのstate_process属性を更新
		updateBlockAttributes(parentClientId, { state_process: new_state });
	};

	//インナーブロックの制御

	const MAIL_TEMPLATE = [
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
	const MEMBER_TEMPLATE = [
		[
			"itmar/design-text-ctrl",
			{
				inputName: "memberName",
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
			"itmar/design-button",
			{
				buttonType: "submit",
				labelContent: __("Sending a confirmation email", "form-send-blocks"),
				align: "center",
			},
		],
	];

	const LOGIN_TEMPLATE = [
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
			"itmar/design-button",
			{
				buttonType: "submit",
				labelContent: __("Login", "form-send-blocks"),
				align: "center",
			},
		],
	];

	const input_template =
		form_type === "inquiry"
			? MAIL_TEMPLATE
			: form_type === "member"
			? MEMBER_TEMPLATE
			: form_type === "login"
			? LOGIN_TEMPLATE
			: null;

	const innerBlocksProps = useInnerBlocksProps(
		{},
		{
			allowedBlocks: [
				"itmar/design-text-ctrl",
				"itmar/design-checkbox",
				"itmar/design-button",
				"itmar/design-select",
				"itmar/design-title",
			],
			template: input_template,
			templateLock: false,
		},
	);

	//インナーブロックを取得
	const innerBlocks = useSelect(
		(select) => select("core/block-editor").getBlocks(clientId),
		[clientId],
	);

	//インナーブロックのラベル幅を取得
	useEffect(() => {
		//'itmar/design-checkbox''itmar/design-button'を除外
		const filteredBlocks = innerBlocks.filter(
			(block) =>
				block.name !== "itmar/design-checkbox" &&
				block.name !== "itmar/design-button" &&
				block.name !== "itmar/design-title",
		);
		const maxNum = filteredBlocks.reduce((max, block) => {
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
		}, Number.MIN_SAFE_INTEGER);
		setAttributes({ label_width: `${Math.round(maxNum)}px` });
	}, [innerBlocks]);

	//モバイルの判定
	const isMobile = useIsIframeMobile();

	//ブロックの参照
	const blockRef = useRef(null);
	//ルート要素にスタイルとクラスを付加
	const blockProps = useBlockProps({
		ref: blockRef, // ここで参照を blockProps に渡しています
		style: blockStyle,
		className: `figure_fieldset ${
			context["itmar/state_process"] === "input" ? "appear" : ""
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

	//サイトエディタの場合はiframeにスタイルをわたす。
	useStyleIframe(StyleComp, attributes);

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
						label={__("Input Form Type", "block-collections")}
						value={form_type}
						options={[
							{ label: __("Inquiry", "block-collections"), value: "inquiry" },
							{
								label: __("Membership Registration", "block-collections"),
								value: "member",
							},
							{
								label: __("Login", "block-collections"),
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
				<StyleComp attributes={attributes}>
					<form onSubmit={handleSubmit}>
						<div {...innerBlocksProps}></div>
					</form>
				</StyleComp>
			</div>
		</>
	);
}
