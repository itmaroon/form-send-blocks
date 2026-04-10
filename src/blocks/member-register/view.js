import { __ } from "@wordpress/i18n";
import {
	require_check,
	dispLoading,
	removeLoading,
	processAnimation,
	evaluateCheckboxes,
	process_change,
	message_rebuild,
	sendMail_ajax,
	errorMap,
} from "../front_common";
import { sendRegistrationRequest } from "itmar-block-packages";

jQuery(function ($) {
	//アニメーション関連パラメータ
	let animating = false; //flag to prevent quick multi-click glitches

	//ページのセット
	let fieldset_objs = $(".figure_fieldset");

	//確認画面遷移のボタンの有効化
	$(document).ready(function () {
		let $target_form = $("#send_confirm_form");
		// ページ読み込み時に関数を実行
		evaluateCheckboxes($target_form);
	});

	//会員仮登録の処理と本登録メールの送信
	$("#send_confirm_form").on("submit", async function (e) {
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

		//親ブロックの情報取得
		let parent_block = $(this).parents(".wp-block-itmar-member-register");
		//ブロックの情報
		const block_info_obj = {
			master_email: parent_block.data("master_mail"),
			master_name: parent_block.data("master_name"),
			subject_prov: parent_block.data("subject_prov"),
			message_prov: message_rebuild(parent_block.data("message_prov")), //message_provの再構築
			is_retmail: parent_block.data("is_retmail"),
			is_logon: parent_block.data("is_logon"),
		};

		//フォーム内のインプットデータ
		const $form = $(this);
		const formDataObj = {};
		$form.serializeArray().forEach((item) => {
			formDataObj[item.name] = item.value;
		});

		//現在のページ
		const pageUrl = window.location.href;

		//受け渡しのパラメータ
		let targetUrl = "";
		let pendingRecUrl = "";
		let postData = {};
		let isRest = "auto";
		const ajax_result = {};

		//フォーム別にパラメータを生成
		if (parent_block.data("register_type") === "origin") {
			targetUrl = itmar_option.ajaxUrl;
			postData = {
				action: "itmar_register_send_token",
				nonce: itmar_option.nonce,
				redirect_to: pageUrl,
				form_data: $form.serialize(),
				...block_info_obj,
			};
			isRest = "auto";
		} else if (parent_block.data("register_type") === "shopify") {
			targetUrl = "/wp-json/itmar-ec-relate/v1/customer/create";
			pendingRecUrl = "/wp-json/itmar-ec-relate/v1/customer/pending-upsert";
			const formDataObj = {};
			$form.serializeArray().forEach((item) => {
				formDataObj[item.name] = item.value;
			});
			postData = {
				nonce: itmar_option.nonce, //RestAPI用のnonce
				form_data: formDataObj,
			};
			isRest = "rest";
		}

		//ローディングマークを出す
		dispLoading(__("sending...", "form-send-blocks"), $("#send_confirm_form"));
		try {
			if (pendingRecUrl) {
				//先行してペンディングレコードの生成
				const response = await sendRegistrationRequest(
					pendingRecUrl,
					postData,
					isRest,
				);
			}
			//ユーザー仮登録
			const response = await sendRegistrationRequest(
				targetUrl,
				postData,
				isRest,
			);
			//表示エリアに表示
			let result_disp = $("#to_mail p");
			result_disp.empty();
			if (response.success) {
				// ✅ wp_send_json_success の場合
				//let message = $("#to_home").data(`${key}_${value.status}`);
				let p = $("<p></p>")
					.addClass("success")
					.text($("#to_mail").data("info_mail_success"));
				result_disp.append(p);
				ajax_result.status = "success";
			} else {
				// ❌ wp_send_json_error の場合
				let p = $("<p></p>")
					.addClass("error")
					.text($("#to_mail").data("info_mail_error"));
				result_disp.append(p);
				let err_msg = `--------------------\nerror content : ${
					errorMap[response.data.err_code]
				}`;
				let err_p = $("<p></p>")
					.addClass("error")
					.html(err_msg.replace(/\n/g, "<br>"));
				result_disp.append(err_p);
				//ボタンを消す
				$("#to_mail").find(".wp-block-itmar-design-button").hide();
				//結果の記録
				ajax_result.status = "error";
				ajax_result.error_code = response.data.err_code;
			}
		} catch (err) {
			// jqXHR が飛んでくることが多い
			const msg =
				err?.responseJSON?.message ||
				err?.responseText ||
				err?.statusText ||
				"Request failed";
			console.error(msg, err);

			// UIに表示など
		}

		//管理者への通知メール
		if (parent_block.data("is_prov_notice")) {
			let master_email = parent_block.data("master_mail");
			let master_name = parent_block.data("master_name");
			let subject_ret_prov = parent_block.data("subject_ret_prov");
			let message_ret_prov = parent_block.data("message_ret_prov");
			//message_retの再構築
			message_ret_prov = `${message_rebuild(
				message_ret_prov,
			)}\n\n-------------------------------------------------\n${__(
				"Provisional registration results",
				"form-send-blocks",
			)} : ${ajax_result.status}`;
			//エラーの原因を通知
			if (ajax_result.status === "error") {
				message_ret_prov = `${message_ret_prov}\n${__(
					"Provisional registration error cause",
					"form-send-blocks",
				)} : ${errorMap[ajax_result.error_code]}`;
			}
			//メールの送信
			sendMail_ajax(
				master_email,
				subject_ret_prov,
				message_ret_prov,
				master_email,
				master_name,
				false,
				true,
			);
		}
		//ローディングマーク消去
		removeLoading("", $("#send_confirm_form"));
		//アニメーションの実行
		processAnimation(fieldset_objs.eq(0), fieldset_objs.eq(1), true);
		//プログレスエリアの処理
		process_change(
			$form.parent().parent().nextAll(".figure_fieldset").first(),
			true,
		);
	});

	// クエリパラメータによる処理(本登録の処理)
	const urlParams = new URLSearchParams(window.location.search);
	const isRegisteredSuccess = urlParams.get("registered") === "success";
	const isRegisteredError = urlParams.get("registered") === "error";
	const register_block = $(".wp-block-itmar-member-register");
	if (register_block.length > 0) {
		//block-itmar-member-registerの場合に限定
		const ajax_result = {}; //本登録の結果

		if (isRegisteredSuccess || isRegisteredError) {
			const fieldset_objs = register_block.find(".figure_fieldset");
			const last_fieldset = fieldset_objs.last();
			// アニメーションの実行
			processAnimation(fieldset_objs.eq(0), fieldset_objs.eq(2), true);

			// プログレスエリアの処理
			process_change(fieldset_objs.eq(1), true);
			process_change(last_fieldset, true);

			//表示エリアに表示
			let result_disp = $("#to_regist_page p");
			result_disp.empty();

			if (isRegisteredSuccess) {
				// ✅ wp_send_json_success の場合

				const user_name = urlParams.get("user_name");
				const mail_to = urlParams.get("mail_to");

				let p = $("<p></p>")
					.addClass("success")
					.text($("#to_regist_page").data("info_mail_success"));
				result_disp.append(p);
				//結果の記録
				ajax_result.status = "success";
				ajax_result.content = `${__(
					"user name",
					"form-send-blocks",
				)} : ${user_name}\n${__(
					"mail address",
					"form-send-blocks",
				)} : ${mail_to}`;

				//確認メールをおくる
				if (register_block.data("is_retmail")) {
					// ✅ 登録完了通知メール送信
					let master_email = register_block.data("master_mail");
					let master_name = register_block.data("master_name");
					let subject_register = register_block.data("subject_reg");
					let message_register = register_block.data("message_reg");
					//message_retの再構築
					message_register = `${message_rebuild(
						message_register,
					)}\n\n-------------------------------------------------\n${__(
						"userID",
						"form-send-blocks",
					)} : ${user_name}`;
					//メールの送信
					sendMail_ajax(
						mail_to,
						subject_register,
						message_register,
						master_email,
						master_name,
						false,
						true,
					);
				}
				//自動ログオンが設定されていないときはボタンを消す
				const $parentBlock = $(this).closest(".wp-block-itmar-member-register");
				if ($parentBlock.data("is_logon")) {
					$("#to_regist_page").find(".wp-block-itmar-design-button").hide();
				}
			} else if (isRegisteredError) {
				// ❌ wp_send_json_error の場合
				let p = $("<p></p>")
					.addClass("error")
					.text($("#to_regist_page").data("info_mail_error"));
				result_disp.append(p);
				let err_msg = `--------------------\n${__(
					"error content",
					"form-send-blocks",
				)} : ${errorMap[urlParams.get("error_code")]}`;
				let err_p = $("<p></p>")
					.addClass("error")
					.html(err_msg.replace(/\n/g, "<br>"));
				result_disp.append(err_p);

				//ボタンを消す
				$("#to_regist_page").find(".wp-block-itmar-design-button").hide();
				//結果の記録
				ajax_result.status = "error";
				ajax_result.content = urlParams.get("error_code");
			}

			//管理者への通知メール
			if (register_block.data("is_reg_notice")) {
				let master_email = register_block.data("master_mail");
				let master_name = register_block.data("master_name");
				let subject_ret_reg = register_block.data("subject_ret_reg");
				let message_ret_reg = register_block.data("message_ret_reg");
				//message_retの再構築
				message_ret_reg = `${message_rebuild(
					message_ret_reg,
				)}\n\n-------------------------------------------------\n${__(
					"Official registration results",
					"form-send-blocks",
				)} : ${ajax_result.status}`;

				if (ajax_result.status === "error") {
					//エラーの原因を通知
					message_ret_reg = `${message_ret_reg}\n${__(
						"Official registration error cause",
						"form-send-blocks",
					)} : ${errorMap[ajax_result.content]}`;
				} else {
					//成功の時
					message_ret_reg = `${message_ret_reg}\n${__(
						"Official registration info",
						"form-send-blocks",
					)} : ${ajax_result.content}`;
				}

				//メールの送信
				sendMail_ajax(
					master_email,
					subject_ret_reg,
					message_ret_reg,
					master_email,
					master_name,
					false,
					true,
				);
			}
		}
	}
});
