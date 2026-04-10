import { __ } from "@wordpress/i18n";

// プロセスエリアのセット（最初に見つかった要素を取得）
const process_area = document.querySelector(".wp-block-itmar-design-process");

//.wp-block-itmar-contactmail-senderのマージンの計算
const element = document.querySelector(".wp-block-itmar-contactmail-sender");
// 要素が存在する場合のみ実行（エラー防止）
let contactform_top_margin = "0px";
if (element) {
	// ブラウザが計算したスタイルをすべて取得
	const computedStyle = window.getComputedStyle(element);
	// その中から margin-top を取り出す
	contactform_top_margin = computedStyle.marginTop;
}

// プログレスバーの高さ（マージンを含めた高さの計算）
let progress_height = 0;
if (process_area) {
	const style = window.getComputedStyle(process_area);
	const marginTop = parseFloat(style.marginTop);
	const marginBottom = parseFloat(style.marginBottom);

	// offsetHeight（ボーダー・パディング含む） + 上下マージン
	progress_height = process_area.offsetHeight + marginTop + marginBottom;
}

export const errorMap = {
	invalid_token: __(
		"The token has already been used or is invalid.",
		"form-send-blocks",
	),
	expired: __("The token has expired.", "form-send-blocks"),
	user_fail: __("User registration failed.", "form-send-blocks"),
	no_data: __("Input data missing", "form-send-blocks"),
	missing_email: __("No email address entered", "form-send-blocks"),
	invalid_mail: __("The email address format is invalid.", "form-send-blocks"),
	no_require: __("Your name and password are required.", "form-send-blocks"),
	email_exists: __("The email address is already in use.", "form-send-blocks"),
	username_exists: __("The user ID is already in use.", "form-send-blocks"),
	save_error: __(
		"Failed to save temporary registration data.",
		"form-send-blocks",
	),
	mail_error: __(
		"The email containing the provisional registration results could not be sent.",
		"form-send-blocks",
	),
	invite_failed: __("Failed to send email.", "form-send-blocks"),
};

/* ------------------------------
Loading イメージ表示関数
引数： msg 画面に表示する文言
------------------------------ */
export function dispLoading(msg, target) {
	// 引数なし（メッセージなし）を許容
	if (msg == undefined) {
		msg = "";
	}
	// 画面表示メッセージ
	let dispMsg =
		"<div class='loadingMsg'><div class='loading_icon'></div><p>" +
		msg +
		"</p></div>";
	// ローディング画像が表示されていない場合のみ出力
	if (target == undefined) {
		//ターゲット指定がないときはbodyにつける
		target = jQuery("body");
		if (target.find(".loading").length == 0) {
			target.append("<div class='loading body'>" + dispMsg + "</div>");
		}
	} else {
		if (target.find(".loading").length == 0) {
			target.append("<div class='loading'>" + dispMsg + "</div>");
		}
	}
}

/* ------------------------------
Loading イメージ削除関数
------------------------------ */
export function removeLoading(dispMsg, target) {
	if (target == undefined) {
		//ターゲット指定がないときはbodyにつける
		target = jQuery("body");
	}
	target.find(".loading").fadeOut(300, function () {
		jQuery(this).remove();
		if (dispMsg != undefined && dispMsg.length > 0) {
			// 引数ありのとき
			jQuery("body").append("<div id='result_msg' >" + dispMsg + "</div>");
			jQuery("#result_msg").slideDown(300, function () {
				setTimeout(function () {
					jQuery("#result_msg").slideUp(300, function () {
						jQuery(this).remove();
					});
				}, 2000);
			});
		}
	});
}

//メール送信関数
export const sendMail_ajax = (
	send_email,
	subject_mail,
	message_mail,
	master_email,
	master_name,
	is_dataSave,
	is_retMail,
	save_post_type = "",
) => {
	//noceの取得
	const nonce = itmar_option.nonce;

	//ajaxの送り先
	const ajaxUrl = itmar_option.ajaxUrl;

	return new Promise((resolve, reject) => {
		//Promiseを返す
		jQuery
			.ajax({
				type: "POST",
				url: ajaxUrl,
				data: {
					action: "itmar_contact_send",
					nonce: nonce,
					email: send_email,
					//userName: jQuery('input[name="userName"]').val(),
					save_post_type: save_post_type,
					subject: subject_mail,
					message: message_mail,
					reply_address: master_email,
					reply_name: master_name,
					is_dataSave: is_dataSave,
					is_retMail: is_retMail,
				},
			})
			.done(function (data) {
				let ret_obj = JSON.parse(data);
				resolve(ret_obj);
			})
			.fail(function (XMLHttpRequest, textStatus, errorThrown) {
				console.log(XMLHttpRequest.status);
				console.log(textStatus);
				console.log(errorThrown.message);
				reject(errorThrown);
			})
			.always(function () {});
	});
};

// チェックボックスの状態を評価してsubmitボタンの状態を更新する関数
export function evaluateCheckboxes($target_form) {
	// ターゲットとなるチェックボックス群を定義
	const $checkboxes = $target_form.find(
		'input[type="checkbox"][data-is_proceed="true"]',
	);
	const $submitButton = $target_form.find(
		'button[type="submit"][data-key="foword_id"]',
	);

	// --- A. 実際の判定ロジック ---
	const runValidation = () => {
		let allChecked = true;

		$checkboxes.each(function () {
			if (!jQuery(this).prop("checked")) {
				allChecked = false;
				return false; // ループを抜ける
			}
		});

		// ボタンの有効・無効を切り替え
		$submitButton.prop("disabled", !allChecked);
	};

	// --- B. イベントリスナーの登録 ---
	// 重複登録を避けるため、一度 off() してから on() するのが定石です
	$checkboxes.off("change.validation").on("change.validation", runValidation);

	// --- C. 初回の判定実行 ---
	runValidation();
}

//スライドのアニメーション
export const processAnimation = (current_fs, change_fs, next, animating) => {
	//show the next fieldset
	change_fs.show();
	if (next) {
		change_fs.css({ position: "absolute" });
	} else {
		current_fs.css({ position: "absolute" });
	}

	let left, opacity, scale; //fieldset properties which we will animate

	current_fs.animate(
		{ opacity: 0 },
		{
			step: function (now) {
				//as the opacity of current_fs reduces to 0 - stored in "now"
				//1. scale current_fs down to 80%
				scale = next ? 1 - (1 - now) * 0.2 : 0.8 + (1 - now) * 0.2;
				//2. bring change_fs from the right(50%)
				left = next ? now * 50 + "%" : (1 - now) * 50 + "%";
				//3. increase opacity of change_fs to 1 as it moves in
				opacity = 1 - now;
				if (next) {
					current_fs.css({ transform: "scale(" + scale + ")" });
					change_fs.css({
						top: progress_height,
						left: left,
						opacity: opacity,
					});
				} else {
					current_fs.css({
						top: `calc(${progress_height}px + ${contactform_top_margin} )`,
						left: left,
					});
					change_fs.css({
						transform: "scale(" + scale + ")",
						opacity: opacity,
					});
				}
			},
			duration: 800,
			complete: function () {
				current_fs.hide();
				animating = false;
				change_fs.css({ position: "static" });
			},
			//this comes from the custom easing plugin
			easing: "easeInBack",
		},
	);
};

//メッセージ再構築関数
export const message_rebuild = (message) => {
	const matches = message.match(/\[(.*?)\]/g);
	if (matches) {
		matches.forEach((match) => {
			let rep_elm = jQuery(`[name="${match.slice(1, -1)}"]`);
			let elm_tag = rep_elm.prop("tagName").toLowerCase();

			let rep_word = "";
			if (elm_tag === "input" || elm_tag === "textarea") {
				//input要素かtextarea要素の場合
				rep_word = rep_elm.val();
			} else if (elm_tag === "select") {
				//select要素の場合
				let selectedTexts = [];
				rep_elm.find("option:selected").each(function () {
					// 選択されたoptionのテキストを配列に追加
					selectedTexts.push($(this).text());
				});
				rep_word = selectedTexts.join(",");
			}

			message = message.replace(match, rep_word);
		});
	}
	return message;
};

//プロセスブロックの更新
export const process_change = (figure_elm, set_flg) => {
	// 1. 全てのステップ要素（.figure_fieldset）を取得し、現在の要素が何番目か特定する
	const allFieldsets = jQuery(".figure_fieldset");
	const currentIndex = allFieldsets.index(figure_elm);

	if (currentIndex === -1) return; // 見つからない場合は終了

	// 2. 進捗ブロック内の全 li を取得
	const lis = jQuery(".wp-block-itmar-design-process").find("li");

	// 3. インデックスが一致する li を特定
	// 同一クラス名が複数あっても、DOMの並び順（Index）で 1対1 に紐付けます
	const targetLi = lis.eq(currentIndex);

	// 4. クラスの付け外し
	if (set_flg) {
		targetLi.addClass("ready");
	} else {
		targetLi.removeClass("ready");
	}
};

//必須項目のバリデーションチェック
export function require_check($, form) {
	let err_flg = false; //エラーフラグをセット
	//バリデーションチェック
	form
		.find(".wp-block-itmar-design-text-ctrl, .wp-block-itmar-design-select")
		.each(function () {
			let required = $(this).data("required");
			if (required) {
				let input_elm =
					$(this).find("input, textarea").length !== 0
						? $(this).find("input, textarea")
						: undefined;
				let select_elm =
					$(this).find("select").length !== 0
						? $(this).find("select")
						: undefined;
				//セレクトが選択肢を持っているかどうかの判定（単数選択・複数選択）
				let select_flg = select_elm?.attr("multiple")
					? select_elm?.val().length == 0
					: select_elm?.val();
				let required_err = false;
				if (input_elm) {
					required_err = input_elm.val().length == 0;
				}
				if (select_elm) {
					required_err =
						select_flg == true || select_flg == null || select_flg === "";
				}

				if (required_err) {
					let err_msg_elm = $(
						`<div class="err_msg">${__(
							"This is a required field.",
							"form-send-blocks",
						)}</div>`,
					);
					$(this).find("> div").append(err_msg_elm);
					err_flg = true;
				} else {
					$(this).find(".err_msg").remove();
				}
			}
		});
	return err_flg;
}
