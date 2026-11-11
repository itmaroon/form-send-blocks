import { __ } from "@wordpress/i18n";
import { createThanksFigureStyleCss } from "./StyleThanksFigure";
import { Attributes } from "./type";
import { styleDataApply } from "itmar-block-packages/front";
import { enterTitle, errorMap, viewText } from "../front_common";

//保存済み属性から、React非依存のスコープ付きCSSを適用
styleDataApply<Attributes>(
	createThanksFigureStyleCss,
	".wp-block-itmar-thanks-figure-block",
	{
		selector: ".itmar-wrap",
		target: "inner",
		classPrefix: "itmar-thanks-style-",
		observe: true,
	},
);

/**
 * 送信結果を出す要素。displayMapping に design-title のユニークID（notice_Id / responce_Id）があれば、その design-title。
 * 無ければ従来どおり、ブロック内の段落（p）を上から順に使う。
 */
const resultTarget = (
	$root: JQuery<HTMLElement>,
	id: unknown,
	fallbackIndex: number,
): JQuery<HTMLElement> => {
	if (id) {
		const $byId = $root.find(`[data-unique_id=${id}]`);
		if ($byId.length) return $byId;
	}
	return $root.find("p").eq(fallbackIndex);
};
//文字を書き込む先。design-title なら見出しの中の div、段落ならその要素そのもの
const textHolder = ($elm: JQuery<HTMLElement>): JQuery<HTMLElement> => {
	const $div = $elm.find("h1, h2, h3, h4, h5, h6").find("div");
	return $div.length ? $div : $elm;
};

jQuery(function ($) {
	const parent_block = $(".wp-block-itmar-thanks-figure-block");

	//ネイティブのフォーム送信による再読み込みだけを防ぐ。
	//遷移先は内部のdesign-buttonが決定する。
	parent_block.find("form").on("submit", function (e) {
		e.preventDefault();
	});

	//表示用の文言をセット
	$(document).on(
		"clickButtonIdChanged",
		".wp-block-itmar-thanks-figure-block",
		function (event, clickKey) {
			const rawAttributes = $(this).attr("data-attributes");
			if (rawAttributes) {
				const attributes = JSON.parse(rawAttributes);
				const displayObj = attributes.displayMapping?.[clickKey];

				//メインメッセージの書き換え
					const $messageElm = $(this).find(
						`[data-unique_id=${displayObj?.message_Id}]`,
					);
					if ($messageElm) {
						enterTitle($messageElm, viewText(displayObj?.main_mess));
					}
					//送信結果の書き換え（通知メールの結果と自動応答メールの結果。それぞれ design-title か段落）
					const $notice = resultTarget($(this), displayObj?.notice_Id, 0);
					const $responce = resultTarget($(this), displayObj?.responce_Id, 1);
					const $resultElm = {
						eq: (i: number) => (i === 0 ? $notice : $responce),
						append: (...args: any[]) => (textHolder($notice) as any).append(...args),
					};
					{
						//いったんクリア
						[$notice, $responce].forEach(($e) => {
							$e.removeClass("error");
							textHolder($e).text("");
						});
					//送信結果の取り出し
					const resultAttributes = $(this).attr("data-send-result");

					if (resultAttributes) {
						const attributes = JSON.parse(resultAttributes);

						let noticeResult = "";
						let responceResult = "";
						//問い合わせメールの送信結果
						if (attributes.info_mail) {
							noticeResult =
								attributes.info_mail.status === "success"
? viewText(displayObj?.success_notice)
									: `${viewText(displayObj?.error_notice)}(${attributes.info_mail.message})`;
								if (attributes.info_mail.status === "error") {
									$resultElm.eq(0).addClass("error");
								}
								textHolder($resultElm.eq(0)).text(noticeResult);
						}
						//自動応答メールの送信結果
						if (attributes.ret_mail) {
							responceResult =
								attributes.ret_mail.status === "success"
? viewText(displayObj?.success_responce)
									: `${viewText(displayObj?.responce_error)}(${attributes.ret_mail.message})`;
								if (attributes.ret_mail.status === "error") {
									$resultElm.eq(1).addClass("error");
								}
								textHolder($resultElm.eq(1)).text(responceResult);
						}
						//エラーが返った場合
						if (attributes.error) {
							const errorResult = `${__("Error:", "form-send-blocks")}(${
								attributes.error.message
							})`;
							$resultElm.eq(0).addClass("error");
							textHolder($resultElm.eq(0)).text(errorResult);
						}
						//ユーザー仮登録成功の場合
						if (attributes.status === true) {
textHolder($resultElm.eq(0)).text(viewText(displayObj?.success_notice));
						}
						//ユーザー本登録成功の場合
						if (attributes.status === "success") {
							const successResult = `${viewText(displayObj?.success_notice)} \n${attributes.message?.content}`;
							textHolder($resultElm.eq(0))
								.css("white-space", "pre-wrap")
								.text(successResult);
						}
						//ログインエラーの場合
						if (attributes.status === false) {
							//最上位に無ければ message の中も見る（呼び出し側の形の違いを吸収）
							const code =
								attributes.error_code ?? attributes.message?.error_code;
							const error_result =
								code === "incorrect_password"
									? attributes.message
									: (errorMap as Record<string, string>)[code] ??
										code ??
										__("Unknown error", "form-send-blocks");
							const errorResult = `${viewText(displayObj?.error_notice)} \n${error_result}`;
							$resultElm.eq(0).addClass("error");
							textHolder($resultElm.eq(0))
								.css("white-space", "pre-wrap")
								.text(errorResult);
							if (code === "incorrect_password") {
								$resultElm.append("\n");
								$resultElm.append(
									$("<a>")
										.attr("href", attributes.lost_password_url)
										.text(
											__(
												"You can reset your password using this link.",
												"form-send-blocks",
											),
										),
								);
							}
						}
					}
				}
			}
		},
	);
});
