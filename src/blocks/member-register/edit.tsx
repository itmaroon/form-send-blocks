import { __ } from "@wordpress/i18n";
import { StyleComp } from "./StyleMemberRegister";

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
} from "@wordpress/block-editor";
import {
	PanelBody,
	PanelRow,
	ToggleControl,
	TextareaControl,
	Notice,
	TextControl,
	SelectControl,
	BoxControl,
} from "@wordpress/components";

import "./editor.scss";

import { useCallback, useEffect, useRef, useState } from "@wordpress/element";
import { useMergeRefs } from "@wordpress/compose";
import { StyleSheetManager } from "styled-components";
import { useSelect, dispatch } from "@wordpress/data";
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
	clientId,
}: BlockEditProps<Attributes>) {
	const {
		register_type,
		default_pos,
		mobile_pos,
		is_shadow,
		shadow_element,
		master_mail,
		master_name,
		is_prov_notice,
		is_reg_notice,
		subject_provision,
		message_provision,
		subject_ret_pro,
		message_ret_pro,
		subject_register,
		message_register,
		subject_ret_reg,
		message_ret_reg,
		is_logon,
		is_success_mail,
	} = attributes;

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

	const blockProps = useBlockProps({
		ref: mergedBlockRef,
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
		["itmar/design-process", {}],
		[
			"itmar/input-figure-block",
			{
				form_type: "member",
				form_name: "registration_form",
				stage_info: __("Provisional registration input", "form-send-blocks"),
			},
		],
		[
			"itmar/thanks-figure-block",
			{
				info_type: "provision",
				stage_info: __("Official Registration", "form-send-blocks"),
				infomail_success: __(
					"Your provisional registration has been processed successfully. We have sent you an email, so please access the URL in the email to complete your registration.",
					"form-send-blocks",
				),
				infomail_faile: __(
					"The provisional registration process has failed. Please check your email address and try again.",
					"form-send-blocks",
				),
			},
		],
		[
			"itmar/thanks-figure-block",
			{
				info_type: "register",
				stage_info: __("Registration complete", "form-send-blocks"),
				infomail_success: __(
					"Your registration has been processed successfully. Thank you for registering.",
					"form-send-blocks",
				),
				infomail_faile: __(
					"We are sorry, but please try again with temporary registration.",
					"form-send-blocks",
				),
				retmail_success: __(
					"We have sent you an email confirming your registration. Please check the details.",
					"form-send-blocks",
				),
				retmail_faile: __(
					"The email confirming your registration could not be sent.",
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
	const innerBlocks = useSelect(
		(select) => {
			const { getBlocks } = select(blockEditorStore) as any;
			return getBlocks(clientId);
		},
		[clientId],
	);
	const inputFigureBlock = innerBlocks.find(
		(block: BlockInstance) => block.name === "itmar/input-figure-block",
	);
	const inputInnerBlocks = inputFigureBlock ? inputFigureBlock.innerBlocks : [];

	//編集中の値を確保するための状態変数
	const [master_mail_editing, setMasterMailValue] = useState(master_mail);
	const [master_name_editing, setMasterNameValue] = useState(master_name);
	const [subject_prov_editing, setSubjectProvValue] =
		useState(subject_provision);
	const [message_prov_editing, setMessageProvValue] =
		useState(message_provision);
	const [subject_ret_prov_editing, setSubjectRetProvValue] =
		useState(subject_ret_pro);
	const [message_ret_prov_editing, setMessageRetProvValue] =
		useState(message_ret_pro);
	const [subject_reg_editing, setSubjectRegValue] = useState(subject_register);
	const [message_reg_editing, setMessageRegValue] = useState(message_register);
	const [subject_ret_reg_editing, setSubjectRetRegValue] =
		useState(subject_ret_reg);
	const [message_ret_reg_editing, setMessageRetRegValue] =
		useState(message_ret_reg);

	//Emailのバリデーション正規表現
	const mail_pattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

	return (
		<>
			<InspectorControls group="settings">
				<PanelBody
					title={__("Registration Type settings", "form-send-blocks")}
					initialOpen={true}
					className="mailinfo_ctrl"
				>
					<SelectControl
						label={__("Select Registration Type", "form-send-blocks")}
						value={register_type as any}
						options={[
							{ label: __("Original", "form-send-blocks"), value: "origin" },
							{
								label: __("Shopify", "form-send-blocks"),
								value: "shopify",
							},
							{
								label: __("Stripe", "form-send-blocks"),
								value: "stripe",
							},
						]}
						onChange={(newName) => {
							setAttributes({ register_type: newName });
						}}
					/>
				</PanelBody>
				<PanelBody
					title={__("Administrator notification settings", "form-send-blocks")}
					initialOpen={true}
					className="mailinfo_ctrl"
				>
					<PanelRow>
						<TextControl
							label={__("Master Name", "form-send-blocks")}
							value={master_name_editing}
							onChange={(newVal) => setMasterNameValue(newVal)} // 一時的な編集値として保存する
							onBlur={() => {
								if (master_name_editing.length == 0) {
									(dispatch("core/notices") as any).createNotice(
										"error",
										__(
											"Do not leave the master name blank. ",
											"form-send-blocks",
										),
										{ type: "snackbar", isDismissible: true },
									);
									// バリデーションエラーがある場合、編集値を元の値にリセットする
									setMasterNameValue(master_name);
								} else {
									// バリデーションが成功した場合、編集値を確定する
									setAttributes({ master_name: master_name_editing });
								}
							}}
						/>
					</PanelRow>
					<PanelRow>
						<TextControl
							label={__(
								"Notification email address (Master)",
								"form-send-blocks",
							)}
							value={master_mail_editing}
							onChange={(newVal) => setMasterMailValue(newVal)} // 一時的な編集値として保存する
							onBlur={() => {
								//メールバリデーションチェック
								if (
									master_mail_editing.length == 0 ||
									!mail_pattern.test(master_mail_editing)
								) {
									(dispatch("core/notices") as any).createNotice(
										"error",
										__(
											"The notification email address is blank or has an invalid format. ",
											"form-send-blocks",
										),
										{ type: "snackbar", isDismissible: true },
									);
									// バリデーションエラーがある場合、編集値を元の値にリセットする
									setMasterMailValue(master_mail);
								} else {
									// バリデーションが成功した場合、編集値を確定する
									setAttributes({ master_mail: master_mail_editing });
								}
							}}
						/>
					</PanelRow>
					<PanelRow>
						<ToggleControl
							label={__(
								"Notification of provisional registration application",
								"form-send-blocks",
							)}
							checked={is_prov_notice}
							onChange={(newVal) => setAttributes({ is_prov_notice: newVal })}
						/>
					</PanelRow>
					{is_prov_notice && (
						<>
							<PanelRow>
								<TextControl
									label={__(
										"Provisional registration email subject",
										"form-send-blocks",
									)}
									value={subject_ret_prov_editing}
									onChange={(newVal) => setSubjectRetProvValue(newVal)} // 一時的な編集値として保存する
									onBlur={() => {
										if (subject_ret_prov_editing.length == 0) {
											(dispatch("core/notices") as any).createNotice(
												"error",
												__(
													"Do not leave the subject of the notification email blank. ",
													"form-send-blocks",
												),
												{ type: "snackbar", isDismissible: true },
											);
											// バリデーションエラーがある場合、編集値を元の値にリセットする
											setSubjectRetProvValue(subject_ret_pro);
										} else {
											// バリデーションが成功した場合、編集値を確定する
											setAttributes({
												subject_ret_pro: subject_ret_prov_editing,
											});
										}
									}}
								/>
							</PanelRow>
							<PanelRow>
								<TextareaControl
									label={__(
										"Provisional registration email body",
										"form-send-blocks",
									)}
									value={message_ret_prov_editing}
									onChange={(newVal) => setMessageRetProvValue(newVal)} // 一時的な編集値として保存する
									onBlur={() => {
										if (message_ret_prov_editing.length == 0) {
											(dispatch("core/notices") as any).createNotice(
												"error",
												__(
													"Do not leave the body of the notification email blank. ",
													"form-send-blocks",
												),
												{ type: "snackbar", isDismissible: true },
											);
											// バリデーションエラーがある場合、編集値を元の値にリセットする
											setMessageRetProvValue(message_ret_pro);
										} else {
											// バリデーションが成功した場合、編集値を確定する
											setAttributes({
												message_ret_pro: message_ret_prov_editing,
											});
										}
									}}
									rows={5}
									help={__(
										"Click the input item displayed below to quote it in the text.",
										"form-send-blocks",
									)}
								/>
							</PanelRow>
							{inputInnerBlocks
								.filter(
									(block: BlockInstance) =>
										block.name !== "itmar/design-checkbox" &&
										block.name !== "itmar/design-group" &&
										block.name !== "itmar/design-button",
								)
								.map((input_elm: BlockInstance, index: number) => {
									const actions = [
										{
											label: "👆",
											onClick: () => {
												const newVal = `${message_ret_pro}[${input_elm.attributes.inputName}]`;
												setMessageRetProvValue(newVal);
												setAttributes({ message_ret_pro: newVal });
											},
										},
									];
									return (
										<Notice key={index} actions={actions} isDismissible={false}>
											<p>{input_elm.attributes.labelContent}</p>
										</Notice>
									);
								})}
						</>
					)}
					<PanelRow>
						<ToggleControl
							label={__(
								"Notification of official registration",
								"form-send-blocks",
							)}
							checked={is_reg_notice}
							onChange={(newVal) => setAttributes({ is_reg_notice: newVal })}
						/>
					</PanelRow>
					{is_reg_notice && (
						<>
							<PanelRow>
								<TextControl
									label={__(
										"Official registration email subject",
										"form-send-blocks",
									)}
									value={subject_ret_reg_editing}
									onChange={(newVal) => setSubjectRetRegValue(newVal)} // 一時的な編集値として保存する
									onBlur={() => {
										if (subject_ret_reg_editing.length == 0) {
											(dispatch("core/notices") as any).createNotice(
												"error",
												__(
													"Do not leave the subject of the notification email blank. ",
													"form-send-blocks",
												),
												{ type: "snackbar", isDismissible: true },
											);
											// バリデーションエラーがある場合、編集値を元の値にリセットする
											setSubjectRetRegValue(subject_ret_reg);
										} else {
											// バリデーションが成功した場合、編集値を確定する
											setAttributes({
												subject_ret_reg: subject_ret_reg_editing,
											});
										}
									}}
								/>
							</PanelRow>
							<PanelRow>
								<TextareaControl
									label={__(
										"Official registration email body",
										"form-send-blocks",
									)}
									value={message_ret_reg_editing}
									onChange={(newVal) => setMessageRetRegValue(newVal)} // 一時的な編集値として保存する
									onBlur={() => {
										if (message_ret_reg_editing.length == 0) {
											(dispatch("core/notices") as any).createNotice(
												"error",
												__(
													"Do not leave the body of the notification email blank. ",
													"form-send-blocks",
												),
												{ type: "snackbar", isDismissible: true },
											);
											// バリデーションエラーがある場合、編集値を元の値にリセットする
											setMessageRetRegValue(message_ret_reg);
										} else {
											// バリデーションが成功した場合、編集値を確定する
											setAttributes({
												message_ret_reg: message_ret_reg_editing,
											});
										}
									}}
									rows={5}
									help={__(
										"Click the input item displayed below to quote it in the text.",
										"form-send-blocks",
									)}
								/>
							</PanelRow>
							{inputInnerBlocks
								.filter(
									(block: BlockInstance) =>
										block.name !== "itmar/design-checkbox" &&
										block.name !== "itmar/design-group" &&
										block.name !== "itmar/design-button",
								)
								.map((input_elm: BlockInstance, index: number) => {
									const actions = [
										{
											label: "👆",
											onClick: () => {
												const newVal = `${message_ret_reg}[${input_elm.attributes.inputName}]`;
												setMessageRetRegValue(newVal);
												setAttributes({ message_ret_reg: newVal });
											},
										},
									];
									return (
										<Notice key={index} actions={actions} isDismissible={false}>
											<p>{input_elm.attributes.labelContent}</p>
										</Notice>
									);
								})}
						</>
					)}
				</PanelBody>
				<PanelBody
					title={__("User notification settings", "form-send-blocks")}
					initialOpen={true}
					className="mailinfo_ctrl"
				>
					<PanelRow>
						<TextControl
							label={__(
								"Provisional registration email subject",
								"form-send-blocks",
							)}
							value={subject_prov_editing}
							onChange={(newVal) => setSubjectProvValue(newVal)} // 一時的な編集値として保存する
							onBlur={() => {
								if (subject_prov_editing.length == 0) {
									(dispatch("core/notices") as any).createNotice(
										"error",
										__(
											"Do not leave the subject of the notification email blank. ",
											"form-send-blocks",
										),
										{ type: "snackbar", isDismissible: true },
									);
									// バリデーションエラーがある場合、編集値を元の値にリセットする
									setSubjectProvValue(subject_provision);
								} else {
									// バリデーションが成功した場合、編集値を確定する
									setAttributes({
										subject_provision: subject_prov_editing,
									});
								}
							}}
						/>
					</PanelRow>
					<PanelRow>
						<TextareaControl
							label={__(
								"Provisional registration email body",
								"form-send-blocks",
							)}
							value={message_prov_editing}
							onChange={(newVal) => setMessageProvValue(newVal)} // 一時的な編集値として保存する
							onBlur={() => {
								if (message_prov_editing.length == 0) {
									(dispatch("core/notices") as any).createNotice(
										"error",
										__(
											"Do not leave the body of the notification email blank. ",
											"form-send-blocks",
										),
										{ type: "snackbar", isDismissible: true },
									);
									// バリデーションエラーがある場合、編集値を元の値にリセットする
									setMessageProvValue(message_provision);
								} else {
									// バリデーションが成功した場合、編集値を確定する
									setAttributes({
										message_provision: message_prov_editing,
									});
								}
							}}
							rows={5}
							help={__(
								"Click the input item displayed below to quote it in the text.",
								"form-send-blocks",
							)}
						/>
					</PanelRow>
					{inputInnerBlocks
						.filter(
							(block: BlockInstance) =>
								block.name !== "itmar/design-checkbox" &&
								block.name !== "itmar/design-group" &&
								block.name !== "itmar/design-button",
						)
						.map((input_elm: BlockInstance, index: number) => {
							const actions = [
								{
									label: "👆",
									onClick: () => {
										const newVal = `${message_provision}[${input_elm.attributes.inputName}]`;
										setMessageProvValue(newVal);
										setAttributes({ message_provision: newVal });
									},
								},
							];
							return (
								<Notice key={index} actions={actions} isDismissible={false}>
									<p>{input_elm.attributes.labelContent}</p>
								</Notice>
							);
						})}

					<PanelRow>
						<ToggleControl
							label={__(
								"An email will be sent to confirm your registration",
								"form-send-blocks",
							)}
							checked={is_success_mail}
							onChange={(newVal) => setAttributes({ is_success_mail: newVal })}
						/>
					</PanelRow>
					{is_success_mail && (
						<>
							<PanelRow>
								<TextControl
									label={__(
										"Official registration email subject",
										"form-send-blocks",
									)}
									value={subject_reg_editing}
									onChange={(newVal) => setSubjectRegValue(newVal)} // 一時的な編集値として保存する
									onBlur={() => {
										if (subject_reg_editing.length == 0) {
											(dispatch("core/notices") as any).createNotice(
												"error",
												__(
													"Do not leave the subject of the notification email blank. ",
													"form-send-blocks",
												),
												{ type: "snackbar", isDismissible: true },
											);
											// バリデーションエラーがある場合、編集値を元の値にリセットする
											setSubjectRegValue(subject_register);
										} else {
											// バリデーションが成功した場合、編集値を確定する
											setAttributes({
												subject_register: subject_reg_editing,
											});
										}
									}}
								/>
							</PanelRow>
							<PanelRow>
								<TextareaControl
									label={__(
										"Official registration email body",
										"form-send-blocks",
									)}
									value={message_reg_editing}
									onChange={(newVal) => setMessageRegValue(newVal)} // 一時的な編集値として保存する
									onBlur={() => {
										if (message_reg_editing.length == 0) {
											(dispatch("core/notices") as any).createNotice(
												"error",
												__(
													"Do not leave the body of the notification email blank. ",
													"form-send-blocks",
												),
												{ type: "snackbar", isDismissible: true },
											);
											// バリデーションエラーがある場合、編集値を元の値にリセットする
											setMessageRegValue(message_register);
										} else {
											// バリデーションが成功した場合、編集値を確定する
											setAttributes({
												message_register: message_reg_editing,
											});
										}
									}}
									rows={5}
									help={__(
										"Click the input item displayed below to quote it in the text.",
										"form-send-blocks",
									)}
								/>
							</PanelRow>
							{inputInnerBlocks
								.filter(
									(block: BlockInstance) =>
										block.name !== "itmar/design-checkbox" &&
										block.name !== "itmar/design-button",
								)
								.map((input_elm: BlockInstance, index: number) => {
									const actions = [
										{
											label: "👆",
											onClick: () => {
												const newVal = `${message_register}[${input_elm.attributes.inputName}]`;
												setMessageRegValue(newVal);
												setAttributes({ message_register: newVal });
											},
										},
									];
									return (
										<Notice key={index} actions={actions} isDismissible={false}>
											<p>{input_elm.attributes.labelContent}</p>
										</Notice>
									);
								})}
						</>
					)}
				</PanelBody>

				<PanelRow>
					<ToggleControl
						label={__("Automatic logon after registration", "form-send-blocks")}
						checked={is_logon}
						onChange={(newVal) => setAttributes({ is_logon: newVal })}
					/>
				</PanelRow>
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
				<StyleSheetManager target={styleSheetTarget ?? undefined}>
					<StyleComp attributes={attributes}>
						<div {...innerBlocksProps}></div>
					</StyleComp>
				</StyleSheetManager>
			</div>
		</>
	);
}
