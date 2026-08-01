import { __ } from "@wordpress/i18n";
import { createCustomLoginStyleCss } from "./StyleCustomLogin";
import type { Attributes } from "./type";

import {
	useElementBackgroundColor,
	useIsIframeMobile,
	ShadowStyle,
	ShadowElm,
	PageSelectControl,
} from "itmar-block-packages";
import {
	useBlockProps,
	useInnerBlocksProps,
	InspectorControls,
} from "@wordpress/block-editor";
import { PanelBody, ToggleControl, BoxControl } from "@wordpress/components";

import { BlockEditProps, TemplateArray } from "@wordpress/blocks";

import "./editor.scss";

import { useEffect, useRef } from "@wordpress/element";

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
	clientId,
}: BlockEditProps<Attributes>) {
	const {
		default_pos,
		mobile_pos,
		is_shadow,
		shadow_element,
		selectedSlug,
		isRemember,
	} = attributes;

	//モバイルの判定
	const isMobile = useIsIframeMobile();

	//ブロックの参照
	const blockRef = useRef<HTMLDivElement | null>(null);
	const editorStyleClass = `itmar-login-editor-${clientId.replace(
		/[^a-zA-Z0-9_-]/g,
		"",
	)}`;
	const editorStyleCss = createCustomLoginStyleCss(
		attributes,
		`.${editorStyleClass}`,
	);

	const blockProps = useBlockProps({
		ref: blockRef,
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

	//インナーブロックの制御
	const TEMPLATE: TemplateArray = [
		//同一ブロックを２つ以上入れないこと（名称の文字列が重ならないこと）
		[
			"itmar/input-figure-block",
			{ form_type: "login", form_name: "login_form" },
		],
		[
			"itmar/thanks-figure-block",
			{
				info_type: "logonErr",
				stage_info: __("Logon Error", "form-send-blocks"),
				infomail_faile: __(
					"Login failed for the following reasons:",
					"form-send-blocks",
				),
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

	//インナーブロックを取得

	return (
		<>
			<InspectorControls group="settings">
				<PanelBody
					title={__("Custom Login Setting", "form-send-blocks")}
					initialOpen={true}
					className="mailinfo_ctrl"
				>
					<PanelBody
						title={__(
							"Select redirect destination when loged in success",
							"form-send-blocks",
						)}
					>
						<PageSelectControl
							label={__("Select Redirect Page", "form-send-blocks")}
							selectedSlug={selectedSlug}
							homeUrl="[home_url]"
							onChange={(postInfo) => {
								if (postInfo) {
									setAttributes({
										selectedSlug: postInfo.slug,
										redirectUrl: postInfo.link,
									});
								}
							}}
						/>
					</PanelBody>

					<PanelBody title={__("Stay logged in", "form-send-blocks")}>
						<ToggleControl
							label={__("Remember Me", "form-send-blocks")}
							checked={isRemember}
							onChange={(newVal) => {
								setAttributes({ isRemember: newVal });
							}}
						/>
					</PanelBody>
				</PanelBody>
			</InspectorControls>

			<InspectorControls group="styles">
				<PanelBody
					title={__("Space settings", "form-send-blocks")}
					initialOpen={true}
					className="form_design_ctrl"
				>
					<BoxControl
						label={
							!isMobile
								? __("Margin settings(desk top)", "form-send-blocks")
								: __("Margin settings(mobile)", "form-send-blocks")
						}
						values={
							!isMobile ? default_pos.margin_value : mobile_pos.margin_value
						}
						onChange={(value) => {
							if (!isMobile) {
								setAttributes({
									default_pos: { ...default_pos, margin_value: value },
								});
							} else {
								setAttributes({
									mobile_pos: { ...mobile_pos, margin_value: value },
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
							!isMobile ? default_pos.padding_value : mobile_pos.padding_value
						}
						onChange={(value) => {
							if (!isMobile) {
								setAttributes({
									default_pos: { ...default_pos, padding_value: value },
								});
							} else {
								setAttributes({
									mobile_pos: { ...mobile_pos, padding_value: value },
								});
							}
						}}
						units={units} // 許可する単位
						allowReset={true} // リセットの可否
						resetValues={padding_resetValues} // リセット時の値
					/>
				</PanelBody>
				<PanelBody
					title={__("Shadow settings", "form-send-blocks")}
					initialOpen={true}
					className="form_design_ctrl"
				>
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
						<div {...innerBlocksProps}></div>
				</div>
			</div>
		</>
	);
}
