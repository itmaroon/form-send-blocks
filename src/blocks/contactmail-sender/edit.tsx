import { __ } from "@wordpress/i18n";
import { createContactMailStyleCss } from "./StyleContactMail";
import { store as blockEditorStore } from "@wordpress/block-editor";

import {
	useElementBackgroundColor,
	useIsIframeMobile,
	ShadowStyle,
	ShadowElm,
	flattenBlocks,
} from "itmar-block-packages";
import {
	useBlockProps,
	useInnerBlocksProps,
	InspectorControls,
} from "@wordpress/block-editor";
import {
	BlockEditProps,
	BlockInstance,
	TemplateArray,
} from "@wordpress/blocks";
import {
	PanelBody,
	PanelRow,
	ToggleControl,
	TextareaControl,
	Notice,
	TextControl,
	BoxControl,
	RadioControl,
	Button,
} from "@wordpress/components";

import "./editor.scss";

import { useState, useRef, useEffect } from "@wordpress/element";
import { useSelect, dispatch } from "@wordpress/data";
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
		default_pos,
		mobile_pos,
		is_shadow,
		shadow_element,
		master_mail,
		master_name,
		ret_mail,
		is_retmail,
		is_footer,
		footer_content,
		mailAddressType,
		is_dataSave,
		save_post_type,
	} = attributes;

	//モバイルの判定
	const isMobile = useIsIframeMobile();

	//ブロックの参照
	const blockRef = useRef<HTMLDivElement | null>(null);

	//データのCSV出力ハンドラ
	const handleExportCSV = () => {
		// WordPressの管理画面用Ajax URLを構築
		const exportUrl = `${itmar_option.ajaxUrl}?action=export_inquiry_csv&post_type=${save_post_type}`;

		// 1. 隠しアンカータグを作成
		const link = document.createElement("a");
		link.href = exportUrl;
		link.style.display = "none";

		// 2. ブラウザにダウンロードとして認識させる（ファイル名を指定可能）
		// ※サーバー側でContent-Dispositionヘッダーを出すのが確実ですが、JS側でも指定可能
		link.setAttribute("download", "inquiry_data.csv");

		// 3. DOMに追加してクリック、直後に削除
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	};

	//current_stepの初期化（マウント時だけ）
	useEffect(() => {
		setAttributes({ current_step: 0 });
	}, []);

	const editorStyleClass = `itmar-contact-editor-${clientId.replace(
		/[^a-zA-Z0-9_-]/g,
		"",
	)}`;
	const editorStyleCss = createContactMailStyleCss(
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
		["itmar/design-process", {}],
		[
			"itmar/input-figure-block",
			{ form_type: "inquiry", form_name: "inquiry_form" },
		],
		["itmar/confirm-figure-block", {}],
		[
			"itmar/thanks-figure-block",
			{
				infomail_success: __(
					"The person in charge has been notified of your inquiry. Please wait for a while until we reply.",
					"form-send-blocks",
				),
				infomail_faile: __(
					"Email notification to the person in charge failed.",
					"form-send-blocks",
				),
				retmail_success: __(
					"We have sent an automatic response email to you, so please check it.",
					"form-send-blocks",
				),
				retmail_faile: __(
					"Failed to send automatic response email to you.",
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
	const { inputInnerBlocks } = useSelect(
		(select) => {
			const { getBlocks } = select(blockEditorStore) as any;
			const blocks = getBlocks(clientId) || [];

			// 1. 特定の itmar/input-figure-block をすべて抽出
			const inputFigureBlocks = blocks.filter(
				(block: BlockInstance) => block.name === "itmar/input-figure-block",
			);

			// 2. それらすべてのインナーブロックを平坦化して結合
			const allInnerBlocks = inputFigureBlocks.flatMap((block: BlockInstance) =>
				flattenBlocks(block.innerBlocks || []),
			);
			const inputInnerBlocks = allInnerBlocks.filter(
				(block: BlockInstance) =>
					//block.name !== "itmar/design-checkbox" &&
					block.name !== "itmar/design-button" &&
					block.name !== "itmar/design-group" &&
					(block.name !== "itmar/design-title" || block.attributes.uniqueID),
			);
			return {
				inputInnerBlocks,
			};
		},
		[clientId],
	);

	//Emailのバリデーション正規表現
	const mail_pattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

	//編集中の値を確保するための状態変数
	const [master_mail_editing, setMasterMailValue] = useState(master_mail);
	const [master_name_editing, setMasterNameValue] = useState(master_name);

	const footerOption = [
		{
			label: __("Master Name", "block-collections"),
			value: master_name,
		},
		{
			label: __("Master Mail", "block-collections"),
			value: master_mail,
		},
	];

	return (
		<>
			<InspectorControls group="settings">
				<PanelBody
					title={__(
						"Inquiry information notification email",
						"form-send-blocks",
					)}
					initialOpen={true}
					className="mailinfo_ctrl"
				>
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
				</PanelBody>
				<PanelBody
					title={__("Automatic response email", "form-send-blocks")}
					initialOpen={true}
					className="mailinfo_ctrl"
				>
					<PanelRow>
						<ToggleControl
							label={__("Send automatic response email", "form-send-blocks")}
							checked={is_retmail}
							onChange={(newVal) => setAttributes({ is_retmail: newVal })}
						/>
					</PanelRow>
					{is_retmail && (
						<>
							<PanelRow className="itmar_select_row">
								<RadioControl
									selected={mailAddressType}
									options={[
										{
											label: __("Input Value", "block-collections"),
											value: "inputVal",
										},
										{
											label: __("Logon User", "block-collections"),
											value: "logonUser",
										},
									]}
									onChange={(changeOption) => {
										setAttributes({ mailAddressType: changeOption });
									}}
								/>
							</PanelRow>

							{mailAddressType === "inputVal" && (
								<PanelRow>
									<TextControl
										label={__("Reply to email address", "form-send-blocks")}
										value={ret_mail}
										onChange={(newVal) => setAttributes({ ret_mail: newVal })}
									/>
								</PanelRow>
							)}
							{mailAddressType === "inputVal" &&
								inputInnerBlocks.map(
									(input_elm: BlockInstance, index: number) => {
										if (input_elm.attributes.inputType === "email") {
											const actions = [
												{
													label: "👆",
													onClick: () => {
														setAttributes({
															ret_mail: input_elm.attributes.inputName,
														});
													},
												},
											];
											return (
												<Notice
													key={index}
													actions={actions}
													isDismissible={false}
												>
													<p>{input_elm.attributes.labelContent}</p>
												</Notice>
											);
										}
									},
								)}
						</>
					)}
					<PanelRow>
						<ToggleControl
							label={__("Add Mail Footer", "form-send-blocks")}
							checked={is_footer}
							onChange={(newVal) => setAttributes({ is_footer: newVal })}
						/>
					</PanelRow>

					{is_footer && (
						<PanelRow>
							<TextareaControl
								label={__("Footer Content", "form-send-blocks")}
								value={footer_content}
								onChange={(newVal) => {
									setAttributes({
										footer_content: newVal,
									});
								}}
								rows={5}
							/>
						</PanelRow>
					)}
					{is_footer &&
						footerOption.map((option, index: number) => {
							const actions = [
								{
									label: "👆",
									onClick: () => {
										const newVal = `${footer_content ?? ""} \n ${
											option.value ?? ""
										}`;
										setAttributes({
											footer_content: newVal,
										});
									},
								},
							];
							return (
								<Notice key={index} actions={actions} isDismissible={false}>
									<p>{option.label}</p>
								</Notice>
							);
						})}
				</PanelBody>
				<PanelBody
					title={__("Send Data Save setting", "form-send-blocks")}
					initialOpen={true}
					className="form_setteing_ctrl"
				>
					<ToggleControl
						label={__("Save response contents to DB", "form-send-blocks")}
						checked={is_dataSave}
						onChange={(newVal) => setAttributes({ is_dataSave: newVal })}
					/>
					{is_dataSave && (
						<>
							<TextControl
								label={__("Save Post Type", "form-send-blocks")}
								value={save_post_type}
								help={__(
									"Please enter the post type name to identify the data you want to save.",
									"form-send-blocks",
								)}
								onChange={(newVal) => setAttributes({ save_post_type: newVal })}
							/>
							<p>
								{__(
									"Export the inquiry data as a CSV file.",
									"form-send-blocks",
								)}
							</p>
							<Button
								variant="primary"
								onClick={handleExportCSV}
								disabled={!save_post_type}
							>
								{__("Download CSV", "form-send-blocks")}
							</Button>
						</>
					)}
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
					<div {...innerBlocksProps} />
				</div>
			</div>
		</>
	);
}
