import { __ } from "@wordpress/i18n";
import { StyleComp } from "./StyleThanksFigure";
import { Attributes } from "./type";
import { styleComponentApply } from "itmar-block-packages";
import { enterTitle, errorMap } from "../front_common";

//styled_conponentの適用
styleComponentApply<Attributes>(
	StyleComp,
	".wp-block-itmar-thanks-figure-block",
	{ selector: ".itmar-wrap", target: "inner" },
);

jQuery(function ($) {
	const parent_block = $(".wp-block-itmar-thanks-figure-block");
	const rawAttributes = parent_block.attr("data-attributes");

	//ホームに戻るボタンの処理
	parent_block.find("form").on("submit", function (e) {
		e.preventDefault();

		if (rawAttributes) {
			try {
				// オブジェクトに変換
				const attributes = JSON.parse(rawAttributes);
				const { selectedPageUrl } = attributes;
				// href属性の[home_url]をhomeUrlに置き換え
				let updatedHref = selectedPageUrl.replace(
					"[home_url]",
					itmar_option.home_url,
				);

				//リダイレクト
				window.location.href = updatedHref;
			} catch (e) {
				console.error("Attributes parsing failed:", e);
			}
		}
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
					enterTitle($messageElm, displayObj?.main_mess);
				}
				//送信結果の書き換え
				const $resultElm = $(this).find("p");
				if ($resultElm) {
					//いったんクリア
					$resultElm.text("");
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
									? displayObj?.success_notice
									: `${displayObj?.error_notice}(${attributes.info_mail.message})`;
							if (attributes.info_mail.status === "error") {
								$resultElm.eq(0).addClass("error");
							}
							$resultElm.eq(0).text(noticeResult);
						}
						//自動応答メールの送信結果
						if (attributes.ret_mail) {
							responceResult =
								attributes.ret_mail.status === "success"
									? displayObj?.success_responce
									: `${displayObj?.responce_error}(${attributes.ret_mail.message})`;
							if (attributes.ret_mail.status === "error") {
								$resultElm.eq(1).addClass("error");
							}
							$resultElm.eq(1).text(responceResult);
						}
						//エラーが返った場合
						if (attributes.error) {
							const errorResult = `${__("Error:", "form-send-blocks")}(${
								attributes.error.message
							})`;
							$resultElm.eq(0).addClass("error");
							$resultElm.eq(0).text(errorResult);
						}
						//ユーザー仮登録成功の場合
						if (attributes.status === true) {
							$resultElm.eq(0).text(displayObj?.success_notice);
						}
						//ユーザー本登録成功の場合
						if (attributes.status === "success") {
							const successResult = `${displayObj?.success_notice} \n${attributes.message?.content}`;
							$resultElm
								.eq(0)
								.css("white-space", "pre-wrap")
								.text(successResult);
						}
						//ログインエラーの場合
						if (attributes.status === false) {
							const code = attributes.error_code;
							const error_result =
								code === "incorrect_password"
									? attributes.message
									: errorMap[code];
							const errorResult = `${displayObj?.error_notice} \n${error_result}`;
							$resultElm
								.eq(0)
								.addClass("error")
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
