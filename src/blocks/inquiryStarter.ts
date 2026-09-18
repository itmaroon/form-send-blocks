/**
 * 問い合わせフォームを置いたときの初期構成（エディタ専用）。
 *
 * 入力 → 確認 → 完了 は、入力画面で押されたボタンのキー（buttonKey）で
 * 確認画面の displayMapping（メールの件名・本文、送信ボタンの表示）と
 * 完了画面の displayMapping（結果メッセージ）を引く仕組みになっている
 * （contactmail-sender / confirm-figure-block / thanks-figure-block の view.ts）。
 * キー・フォーム名・テーブルIDが1つでもずれると、見た目は揃っていても
 * メールが送られないので、ここで一か所にまとめて持つ。
 *
 * 【重要】@wordpress/blocks を使うので view.ts からは import しないこと。
 */
import { __ } from "@wordpress/i18n";
import { getBlockType, TemplateArray } from "@wordpress/blocks";

// 入力画面（input-figure-block）の form_name
export const INQUIRY_FORM_NAME = "inquiry_form";
// 確認画面のデータ表示テーブル（design-table）の defineID
export const INQUIRY_TABLE_ID = "inquiry_table";
// 入力画面の「確認画面へ」ボタンのキー。確認・完了画面の displayMapping のキーになる
export const INQUIRY_CONFIRM_KEY = "send_confirm";
// 確認画面の注意書き・完了画面のメインメッセージを差し込む design-title の uniqueID
export const CONFIRM_ATTENTION_ID = "confirm_attention";
export const THANKS_MESSAGE_ID = "thanks_message";

type TemplateItem = TemplateArray[number];

// design-group の既定値に上書きを重ねる（部分的なオブジェクトで既定値を丸ごと消さないため）
const groupDefault = (key: "default_val" | "mobile_val"): Record<string, unknown> => {
	const value = (getBlockType("itmar/design-group") as any)?.attributes?.[key]?.default;
	return value && typeof value === "object" ? value : {};
};

// ボタンを中央に横並びにする design-group
export const buttonRow = (buttons: TemplateArray): TemplateItem => {
	const row = {
		direction: "horizen",
		inner_align: "center",
		outer_align: "center",
		width_val: "fit",
		max_width: "fit",
		reverse: false,
		wrap: false,
		outer_vertical: "center",
		height_val: "fit",
	};
	return [
		"itmar/design-group",
		{
			default_val: { ...groupDefault("default_val"), ...row },
			mobile_val: { ...groupDefault("mobile_val"), ...row },
		},
		buttons,
	];
};

// 入力画面の「確認画面へ」ボタン
export const toConfirmButton = (): TemplateItem => [
	"itmar/design-button",
	{
		buttonType: "submit",
		// エディタのプレビューでも次のステップへ進める
		linkKind: "forward",
		// 確認・完了画面の設定を引くキー（これが無いとメールが送られない）
		buttonKey: INQUIRY_CONFIRM_KEY,
		labelContent: __("To confirmation screen", "form-send-blocks"),
		align: "center",
	},
];

// 確認画面（confirm-figure-block）の属性
export const inquiryConfirmAttributes = () => ({
	blockTableMapping: [{ blockId: INQUIRY_FORM_NAME, tableId: INQUIRY_TABLE_ID }],
	displayMapping: {
		[INQUIRY_CONFIRM_KEY]: {
			// 送信ボタンの表示はここで上書きされる（空だとボタンの文字が消える）
			button_label: __("Send", "form-send-blocks"),
			attention_Id: CONFIRM_ATTENTION_ID,
			// 注意書きの見出しと同じ文言にしておく（見出しの型によっては差し替えられないため）
			attention_mess: __("Please check your input", "form-send-blocks"),
			notice_subject: __("We have received an inquiry.", "form-send-blocks"),
			// 本文の入力項目は、入力欄を選んだときに追記する（withFieldLines）
			notice_content: __(
				"We have received an inquiry regarding the following information.",
				"form-send-blocks",
			),
			response_subject: __("Thank you for contacting us.", "form-send-blocks"),
			response_content: __(
				"We have received your inquiry with the following details.",
				"form-send-blocks",
			),
		},
	},
});

// 確認画面の中身（注意書き・入力内容の表・戻る／送信ボタン）
export const inquiryConfirmInnerBlocks = (): TemplateArray => [
	[
		"itmar/design-title",
		{
			headingContent: __("Please check your input", "form-send-blocks"),
			uniqueID: CONFIRM_ATTENTION_ID,
		},
	],
	[
		"itmar/design-table",
		{
			defineID: INQUIRY_TABLE_ID,
			is_data_form: true,
			tableLayout: "fixed",
		},
	],
	/*
	 * プライバシーポリシーへの同意は確認画面に置く。
	 * proceedCheck を立てたチェックボックスは、確認画面の view.ts
	 * （evaluateCheckboxes）が送信ボタンの有効・無効に使う。
	 * 入力画面に置くと、確認用の表に「項目 Do」のような行として出てしまう。
	 */
	[
		"itmar/design-checkbox",
		{
			inputName: "privacy_agree",
			labelContent: __(
				"Agree to the privacy policy and send.",
				"form-send-blocks",
			),
			proceedCheck: true,
		},
	],
	buttonRow([
		[
			"itmar/design-button",
			{
				buttonType: "submit",
				linkKind: "back",
				labelContent: __("Back to input", "form-send-blocks"),
				align: "center",
			},
		],
		[
			// 送信ボタンは「リンクなし」の submit（確認画面の view.ts がこの条件で探す）
			"itmar/design-button",
			{
				buttonType: "submit",
				buttonKey: "send_exec",
				labelContent: __("Send", "form-send-blocks"),
				align: "center",
			},
		],
	]),
];

// 完了画面（thanks-figure-block）の属性
export const inquiryThanksAttributes = () => ({
	displayMapping: {
		[INQUIRY_CONFIRM_KEY]: {
			main_mess: __("Thank you for your inquiry.", "form-send-blocks"),
			message_Id: THANKS_MESSAGE_ID,
			success_notice: __(
				"The person in charge has been notified of your inquiry. Please wait for a while until we reply.",
				"form-send-blocks",
			),
			error_notice: __(
				"Email notification to the person in charge failed.",
				"form-send-blocks",
			),
			success_responce: __(
				"We have sent an automatic response email to you, so please check it.",
				"form-send-blocks",
			),
			responce_error: __(
				"Failed to send automatic response email to you.",
				"form-send-blocks",
			),
		},
	},
});

/*
 * 完了画面の中身
 * 完了画面の view.ts は、段落の1つ目に管理者への通知結果、2つ目に自動応答の
 * 結果を書き込む。thanks-figure-block 自身の既定は段落が1つ（会員登録・ログインと
 * 共用）なので、問い合わせ用はここで2つ置く。
 */
export const inquiryThanksInnerBlocks = (): TemplateArray => {
	const resultParagraph: TemplateItem = [
		"core/paragraph",
		{
			className: "itmar_ex_block",
			content: __(
				"The contents set in the sidebar will be displayed here as the transmission result. Any changes you make to the contents of this paragraph block will not be reflected anywhere. Only design settings are valid.",
				"form-send-blocks",
			),
		},
	];
	return [
		[
			"itmar/design-title",
			{
				headingContent: __("Thank you for your inquiry.", "form-send-blocks"),
				uniqueID: THANKS_MESSAGE_ID,
			},
		],
		resultParagraph,
		resultParagraph,
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
};

// 入力欄の並びから、メール本文に差し込む「ラベル: [入力名]」の行を作る
export const fieldLines = (template: TemplateArray): string =>
	template
		.filter(([name]) => name === "itmar/design-text-ctrl")
		.map(([, attrs]) => {
			const { labelContent, inputName } = attrs as {
				labelContent?: string;
				inputName?: string;
			};
			return inputName ? `${labelContent ?? inputName}: [${inputName}]` : "";
		})
		.filter(Boolean)
		.join("\n");

// 本文にまだ差し込み項目が無いときだけ、項目の行を足す（利用者が書いた本文は壊さない）
export const withFieldLines = (body: string | undefined, lines: string): string => {
	const current = body ?? "";
	if (lines === "" || /\[[^\]]+\]/.test(current)) {
		return current;
	}
	return current === "" ? lines : `${current}\n\n${lines}`;
};
