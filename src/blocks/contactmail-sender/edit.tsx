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

import { useRef, useEffect } from "@wordpress/element";
import { useSelect, useDispatch } from "@wordpress/data";
import type { Attributes } from "./type";
import SiteMailSettings from "./SiteMailSettings";
import {
	INQUIRY_FORM_NAME,
	inquiryConfirmAttributes,
	inquiryConfirmInnerBlocks,
	inquiryThanksAttributes,
	inquiryThanksInnerBlocks,
} from "../inquiryStarter";

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

// block.json の既定値。未設定として扱う（includes/mail-settings.php と揃える）
const PLACEHOLDER_MAIL = "master@sample.com";
const PLACEHOLDER_NAME = "Contact Mail Sender";

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

	/*
	 * インナーブロックの制御
	 *
	 * 入力 → 確認 → 完了 の3ステップは、view.ts が直下の .figure_fieldset を
	 * この順で送る前提で動いている。削除や並べ替えをするとフロントで無言で
	 * 壊れるので、3つのステップには移動・削除のロックをかける。
	 * 進捗表示（design-process）は任意なので外せるままにしておく。
	 * 入力欄の中身は input-figure-block 側で選ばせる（ここでは決めない）。
	 *
	 * 確認画面と完了画面は、入力画面のボタンのキーで設定を引くので、
	 * キー・フォーム名・テーブルIDを揃えた状態で置く（inquiryStarter.ts）。
	 * 以前は完了画面に infomail_success などを渡していたが、どれも
	 * thanks-figure-block の属性ではなく、黙って捨てられていた。
	 */
	const STEP_LOCK = { move: true, remove: true };
	const TEMPLATE: TemplateArray = [
		//同一ブロックを２つ以上入れないこと（名称の文字列が重ならないこと）
		["itmar/design-process", {}],
		[
			"itmar/input-figure-block",
			{ form_type: "inquiry", form_name: INQUIRY_FORM_NAME, lock: STEP_LOCK },
		],
		[
			"itmar/confirm-figure-block",
			{ ...inquiryConfirmAttributes(), lock: STEP_LOCK },
			inquiryConfirmInnerBlocks(),
		],
		[
			"itmar/thanks-figure-block",
			{ ...inquiryThanksAttributes(), lock: STEP_LOCK },
			inquiryThanksInnerBlocks(),
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
	const { inputInnerBlocks, confirmClientId, hasKeyedButton } = useSelect(
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
			// メール本文の設定先（確認画面）と、設定パネルが出る条件（キー付きボタン）
			const confirmBlock = blocks.find(
				(block: BlockInstance) => block.name === "itmar/confirm-figure-block",
			);
			const hasKeyedButton = allInnerBlocks.some(
				(block: BlockInstance) =>
					block.name === "itmar/design-button" && !!block.attributes.buttonKey,
			);
			return {
				inputInnerBlocks,
				confirmClientId: confirmBlock?.clientId as string | undefined,
				hasKeyedButton,
			};
		},
		[clientId],
	);
	const { selectBlock } = useDispatch(blockEditorStore) as any;

	/*
	 * 送信先と差出人名はサイト設定（インスペクターで編集）を使う。
	 * 旧来の個別設定がブロックに残っている場合だけ、その値が優先される。
	 * block.json の既定値（master@sample.com / Contact Mail Sender）は
	 * 既存ブロックの検証のため据え置いており、「未設定」として扱う。
	 */
	const ownMail = master_mail === PLACEHOLDER_MAIL ? "" : master_mail ?? "";
	const ownName = master_name === PLACEHOLDER_NAME ? "" : master_name ?? "";

	/*
	 * フッターに差し込むのは値そのものではなくプレースホルダー。
	 * 送信時にサーバーが差出人名・差出人アドレスへ置き換える。
	 * 実アドレスを書き込むと、テンプレートやパターンと一緒に他サイトへ運ばれる。
	 */
	const footerOption = [
		{
			label: __("Master Name", "form-send-blocks"),
			value: "[master_name]",
		},
		{
			label: __("Master Mail", "form-send-blocks"),
			value: "[master_mail]",
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
					<SiteMailSettings
						ownMail={ownMail}
						ownName={ownName}
						onClearOverride={() =>
							setAttributes({ master_mail: "", master_name: "" })
						}
					/>
				</PanelBody>
				{/*
				 * メールの件名・本文は確認画面ブロックが持つ（送信処理もそこを読む）。
				 * 以前はこのブロックに本文の欄があったため、ここに案内を置く。
				 */}
				<PanelBody
					title={__("Mail subject and body", "form-send-blocks")}
					initialOpen={true}
					className="mailinfo_ctrl"
				>
					<p className="itmar_mail_body_note">
						{__(
							"The subject and body of the notification and automatic response emails are set in the Confirm Figure block, under \"Input screens and mail settings\".",
							"form-send-blocks",
						)}
					</p>
					{!hasKeyedButton && (
						<Notice status="warning" isDismissible={false}>
							{__(
								"The mail settings appear only when a button on the input screen has a button identification key.",
								"form-send-blocks",
							)}
						</Notice>
					)}
					<Button
						variant="secondary"
						disabled={!confirmClientId}
						onClick={() => confirmClientId && selectBlock(confirmClientId)}
					>
						{__("Select the Confirm Figure block", "form-send-blocks")}
					</Button>
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
											label: __("Input Value", "form-send-blocks"),
											value: "inputVal",
										},
										{
											label: __("Logon User", "form-send-blocks"),
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
								help={__(
									"[master_name] and [master_mail] are replaced with the sender name and address when the email is sent.",
									"form-send-blocks",
								)}
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
									<p>
										{option.label} <code>{option.value}</code>
									</p>
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
