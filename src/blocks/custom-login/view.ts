import { __ } from "@wordpress/i18n";
import {
	require_check,
	dispLoading,
	removeLoading,
	processAnimation,
	evaluateCheckboxes,
} from "../front_common";
import {
	redirectCustomerAuthorize,
	styleComponentApply,
} from "itmar-block-packages";

import { StyleComp } from "./StyleCustomLogin";
import { Attributes } from "./type";

//styled_conponentの適用
styleComponentApply<Attributes>(StyleComp, ".wp-block-itmar-coustom-login");

jQuery(function ($) {
	//アニメーション関連パラメータ
	let animating = false; //flag to prevent quick multi-click glitches

	//親ブロックの取得
	const login_block = $(".wp-block-itmar-coustom-login");
	const rawAttributes = login_block.attr("data-attributes");
	if (!rawAttributes) {
		console.error("Attributes parsing failed");
		return;
	}
	// 2. オブジェクトに変換
	const attributes = JSON.parse(rawAttributes);
	const { redirectUrl, isRemember } = attributes;

	//ページのセット
	let fieldset_objs = login_block.find(".figure_fieldset");

	//確認画面遷移のボタンの有効化
	let $target_form = $("#to_login_form");
	// ページ読み込み時に関数を実行
	evaluateCheckboxes($target_form);

	//カスタムログインの処理
	$("#to_login_form").on("submit", function (e: any) {
		e.preventDefault();
		//アニメーション中ならリターン
		if (animating) return false;

		//cancelの処理
		const click_key = e.originalEvent.submitter?.dataset.key;
		if (click_key === "cancel_key") {
			const params = new URLSearchParams(window.location.search);
			const redirectUrl = params.get("redirect_to");
			if (redirectUrl) {
				window.location.href = redirectUrl;
			} else {
				window.history.back();
			}
			return;
		}

		//必須のバリデーションチェック
		if (require_check($, $(this))) return;

		animating = true;

		//ローディングマークを出す
		dispLoading(__("sending...", "form-send-blocks"), $("#to_login_form"));

		//noceの取得
		const nonce = itmar_option.nonce;

		//ajaxの送り先
		const ajaxUrl = itmar_option.ajaxUrl;

		const $form = $(this);
		const formData = $form.serialize();

		$.ajax({
			url: ajaxUrl,

			type: "POST",
			data: {
				action: "itmar_custom_login",
				nonce: nonce,
				form_data: formData,
				remember: isRemember ? 1 : 0, // 数値で渡すのが確実
			},
			dataType: "json",
		})
			.done(function (response) {
				if (response.success) {
					const urlParams = new URLSearchParams(window.location.search);

					// リダイレクト先URL（指定がなければルートに戻す）
					const redirectUrl = urlParams.get("redirect_to") || "/";

					// Shopify 関連のパラメータ
					const shopId = urlParams.get("shop_id") || "";
					const headlessId = urlParams.get("headless_id") || "";
					const form_data: Record<string, string> = {};
					$form.serializeArray().forEach((item) => {
						form_data[item.name] = item.value;
					});
					const userMail = form_data.userID; //入力されたメールアドレス
					const authCalllbackUrl = redirectUrl.replace(
						"[home_url]",
						itmar_option.home_url,
					);

					console.log(shopId, headlessId);

					// Shopify の認証が必要であればここで実行
					if (shopId && headlessId) {
						redirectCustomerAuthorize(
							shopId,
							headlessId,
							userMail,
							authCalllbackUrl,
							redirectUrl,
						);
					} else {
						// [home_url]をhomeUrlに置き換え
						let updatedHref = redirectUrl
							? redirectUrl.replace("[home_url]", itmar_option.home_url) //指定したリダイレクト先を優先
							: redirectUrl;
						window.location.href = updatedHref;
					}
				} else {
					//表示エリアに表示
					let result_disp = fieldset_objs.eq(1).find("form p");
					result_disp.empty();

					let p = $("<p></p>")
						.addClass("error")
						.text(fieldset_objs.eq(1).find("form").data("info_mail_error"));
					result_disp.append(p);
					let err_msg = `--------------------\n${response.data.message}`;
					let err_p = $("<p></p>")
						.addClass("error")
						.html(err_msg.replace(/\n/g, "<br>"));
					result_disp.append(err_p);
					//alert("ログインエラー: " + response.data.message);
					//アニメーションの実行
					processAnimation(fieldset_objs.eq(0), fieldset_objs.eq(1), true);
				}
			})
			.fail(function (xhr, status, error) {
				alert("通信エラーが発生しました：" + error);
			})
			.always(function () {
				//ローディングマーク消去
				removeLoading("", $("#to_login_form"));
			});
	});
});
