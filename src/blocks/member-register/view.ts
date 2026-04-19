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
import {
	sendRegistrationRequest,
	styleComponentApply,
} from "itmar-block-packages";
import { StyleComp } from "./StyleMemberRegister";
import { Attributes } from "./type";

//styled_conponentの適用
styleComponentApply<Attributes>(StyleComp, ".wp-block-itmar-member-register");

jQuery(function ($) {
	//アニメーション関連パラメータ
	let animating = false; //flag to prevent quick multi-click glitches

	//確認画面遷移のボタンの有効化
	let $target_form = $("#send_confirm_form");
	evaluateCheckboxes($target_form);

	//親ブロックの取得
	const register_block = $(".wp-block-itmar-member-register");
	const rawAttributes = register_block.attr("data-attributes");
	if (!rawAttributes) {
		console.error("Attributes parsing failed");
		return;
	}
	// 2. オブジェクトに変換
	const attributes = JSON.parse(rawAttributes);
	const {
		register_type,
		master_mail,
		master_name,
		is_prov_notice,
		subject_provision,
		message_provision,
		subject_ret_pro,
		message_ret_pro,
		is_reg_notice,
		subject_register,
		message_register,
		subject_ret_reg,
		message_ret_reg,
		is_logon,
		is_success_mail,
	} = attributes;
	//ページのセット
	const fieldset_objs = register_block.find(".figure_fieldset");

	//会員仮登録の処理と本登録メールの送信
	$("#send_confirm_form").on("submit", async function (e: any) {
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

		//アニメフラグをオン
		animating = true;

		//ブロックの情報
		const block_info_obj = {
			master_email: master_mail,
			master_name: master_name,
			subject_prov: subject_provision,
			message_prov: message_rebuild(message_provision), //message_provの再構築
			is_retmail: is_success_mail,
			is_logon: is_logon,
		};

		//フォーム内のインプットデータ
		const $form = $(this);
		const formDataObj: Record<string, string> = {};
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

		interface AjaxResult {
			status?: "success" | "error";
			error_code?: string | number;
		}
		const ajax_result: AjaxResult = {};

		//フォーム別にパラメータを生成
		if (register_type === "origin") {
			targetUrl = itmar_option.ajaxUrl;
			postData = {
				action: "itmar_register_send_token",
				nonce: itmar_option.nonce,
				redirect_to: pageUrl,
				form_data: $form.serialize(),
				...block_info_obj,
			};
			isRest = "auto";
		} else if (register_type === "shopify") {
			targetUrl = "/wp-json/itmar-ec-relate/v1/customer/create";
			pendingRecUrl = "/wp-json/itmar-ec-relate/v1/customer/pending-upsert";
			const formDataObj: Record<string, string> = {};
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
					isRest as "rest" | "auto",
				);
			}
			//ユーザー仮登録
			const response = await sendRegistrationRequest(
				targetUrl,
				postData,
				isRest as "rest" | "auto",
			);
			//表示エリアに表示
			const $result_disp = fieldset_objs.eq(1).find("form p");
			console.log($result_disp);
			$result_disp.empty();

			// response が存在し、success が true の場合
			if (response?.success) {
				const successMsg = fieldset_objs
					.eq(1)
					.find("form")
					.data("info_mail_success") as string;
				const $p = $("<p></p>").addClass("success").text(successMsg);

				$result_disp.append($p);
				ajax_result.status = "success";
			} else {
				const errCode = response?.data?.err_code;
				const errorText = fieldset_objs
					.eq(1)
					.find("form")
					.data("info_mail_error") as string;

				const $p = $("<p></p>").addClass("error").text(errorText);
				$result_disp.append($p);

				// errorMap からメッセージを取得（errCode がキーとして妥当かチェック）
				const mappedError = errCode
					? (errorMap as any)[errCode]
					: "Unknown Error";
				const err_msg = `--------------------\nerror content : ${mappedError}`;

				const $err_p = $("<p></p>")
					.addClass("error")
					.html(err_msg.replace(/\n/g, "<br>"));
				$result_disp.append($err_p);

				// 結果の記録
				ajax_result.status = "error";
				ajax_result.error_code = errCode;
			}
		} catch (err: any) {
			// ネットワークエラーなどの例外処理
			const msg =
				err?.responseJSON?.message ||
				err?.responseText ||
				err?.statusText ||
				"Request failed";
			console.error(msg, err);
		}

		//管理者への通知メール
		if (is_prov_notice) {
			let master_email = master_mail;
			let message_ret_prov = message_ret_pro;
			//message_retの再構築
			message_ret_prov = `${message_rebuild(
				message_ret_prov,
			)}\n\n-------------------------------------------------\n${__(
				"Provisional registration results",
				"form-send-blocks",
			)} : ${ajax_result.status}`;
			//エラーの原因を通知
			if (ajax_result.status === "error") {
				// 1. error_code を取得し、存在しない場合のフォールバック（代わりの文字）を用意
				const errorCode = ajax_result.error_code;

				// 2. errorMap からメッセージを取得
				// errorCode が undefined の場合や、map に存在しない場合を考慮
				const errorDetail = errorCode
					? (errorMap as Record<string | number, string>)[errorCode]
					: "Unknown Error";

				// 3. メッセージを組み立て（テンプレートリテラル内の改行も安全に処理）
				const errorCauseLabel = __(
					"Provisional registration error cause",
					"form-send-blocks",
				);

				message_ret_prov = `${message_ret_prov}\n${errorCauseLabel} : ${errorDetail}`;
			}
			//メールの送信
			sendMail_ajax(
				master_email,
				subject_ret_pro,
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

	if (register_block.length > 0) {
		// 1. ajax_result の型を定義
		interface RegisterResult {
			status?: "success" | "error";
			content?: string | null;
		}
		const ajax_result: RegisterResult = {};

		//フィールドセットを取り出す
		const fieldset_objs = register_block.find(".figure_fieldset");

		if (isRegisteredSuccess || isRegisteredError) {
			// アニメーションの実行
			processAnimation(fieldset_objs.eq(0), fieldset_objs.eq(2), true);

			// プログレスエリアの処理
			process_change(fieldset_objs.eq(1), true);
			process_change(fieldset_objs.eq(2), true);

			// 表示エリアに表示
			const $result_disp = fieldset_objs.eq(2).find("form p");
			$result_disp.empty();

			if (isRegisteredSuccess) {
				// ✅ 登録成功時
				const user_name = urlParams.get("user_name") || "";
				const mail_to = urlParams.get("mail_to") || "";

				const $p = $("<p></p>")
					.addClass("success")
					.text(
						fieldset_objs
							.eq(2)
							.find("form")
							.data("info_mail_success") as string,
					);
				$result_disp.append($p);

				// 結果の記録
				ajax_result.status = "success";
				ajax_result.content = `${__(
					"user name",
					"form-send-blocks",
				)} : ${user_name}\n${__(
					"mail address",
					"form-send-blocks",
				)} : ${mail_to}`;

				// 確認メールを送る
				if (is_success_mail) {
					const master_email = master_mail;

					let message_reg = message_register as string;

					message_reg = `${message_rebuild(
						message_reg,
					)}\n\n-------------------------------------------------\n${__(
						"userID",
						"form-send-blocks",
					)} : ${user_name}`;

					sendMail_ajax(
						mail_to,
						subject_register,
						message_reg,
						master_email,
						master_name,
						false,
						true,
					);
				}
			} else if (isRegisteredError) {
				// ❌ 登録エラー時
				const $p = $("<p></p>")
					.addClass("error")
					.text(
						fieldset_objs.eq(2).find("form").data("info_mail_error") as string,
					);
				$result_disp.append($p);

				const errorCode = urlParams.get("error_code") || "unknown";
				const errorDetail =
					(errorMap as any)[errorCode] || "Unknown error occurred";

				const err_msg = `--------------------\n${__(
					"error content",
					"form-send-blocks",
				)} : ${errorDetail}`;

				const $err_p = $("<p></p>")
					.addClass("error")
					.html(err_msg.replace(/\n/g, "<br>"));
				$result_disp.append($err_p);

				// 結果の記録
				ajax_result.status = "error";
				ajax_result.content = errorCode;
			}

			// 管理者への通知メール
			if (is_reg_notice) {
				const master_email = master_mail;
				let message_ret_register = message_ret_reg as string;

				message_ret_register = `${message_rebuild(
					message_ret_register,
				)}\n\n-------------------------------------------------\n${__(
					"Official registration results",
					"form-send-blocks",
				)} : ${ajax_result.status}`;

				if (ajax_result.status === "error") {
					const errorCode = ajax_result.content || "unknown";
					const errorCause = (errorMap as any)[errorCode] || "Unknown";
					message_ret_register = `${message_ret_register}\n${__(
						"Official registration error cause",
						"form-send-blocks",
					)} : ${errorCause}`;
				} else {
					message_ret_register = `${message_ret_reg}\n${__(
						"Official registration info",
						"form-send-blocks",
					)} : ${ajax_result.content}`;
				}

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
