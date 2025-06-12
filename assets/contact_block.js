/* ------------------------------
Loading イメージ表示関数
引数： msg 画面に表示する文言
------------------------------ */
function dispLoading(msg, target) {
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
function removeLoading(dispMsg, target) {
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

jQuery(function ($) {
	//確認画面遷移のボタンの有効化
	$(document).ready(function () {
		$target_form = $("#send_confirm_form, #to_login_form, #to_confirm_form");
		// チェックボックスの状態を評価してsubmitボタンの状態を更新する関数
		function evaluateCheckboxes() {
			// 全てのチェックボックスが選択されているかチェック
			var allChecked = true;

			$target_form
				.find('input[type="checkbox"][data-is_proceed="true"]')
				.each(function () {
					if (!$(this).prop("checked")) {
						allChecked = false;
						return false; // eachループを抜ける
					}
				});

			if (!allChecked) {
				// 一つでもチェックされていなければ、submitボタンを無効化
				$target_form.find('input[type="submit"]').prop("disabled", true);
			} else {
				// すべてチェックされていれば、submitボタンを有効化
				$target_form.find('input[type="submit"]').prop("disabled", false);
			}
		}

		// ページ読み込み時に関数を実行
		evaluateCheckboxes();

		// チェックボックスの変更時に関数を実行
		$target_form
			.find('input[type="checkbox"][data-is_proceed="true"]')
			.on("change", evaluateCheckboxes);
	});

	//メール送信関数
	const sendMail_ajax = (
		send_email,
		subject_mail,
		message_mail,
		master_email,
		master_name,
		is_dataSave,
		is_retMail,
	) => {
		//noceの取得
		const nonce = itmar_form_send_option.nonce;

		//ajaxの送り先
		const ajaxUrl = itmar_form_send_option.ajaxURL;
		return new Promise((resolve, reject) => {
			//Promiseを返す
			$.ajax({
				type: "POST",
				url: ajaxUrl,
				data: {
					action: "itmar_contact_send",
					nonce: nonce,
					email: send_email,
					userName: $('input[name="user_name"]').val(),
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

	//メッセージ再構築関数
	const message_rebuild = (message) => {
		const matches = message.match(/\[(.*?)\]/g);
		if (matches) {
			matches.forEach((match) => {
				let rep_elm = $(`[name="${match.slice(1, -1)}"]`);
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
	const process_change = (figure_elm, set_flg) => {
		const figureClassList = figure_elm
			.attr("class")
			.split(/\s+/)
			.filter((c) => c !== "");

		// wp-block-* のクラスだけを接頭辞を取り除いた形で取得
		const wpBlockClasses = figureClassList
			.filter((c) => c.startsWith("wp-block-"))
			.map((c) => c.replace(/^wp-block-/, ""));

		const lis = $(".wp-block-itmar-design-process").find("li");

		const targetLis = lis.filter(function () {
			const liClassList = $(this)
				.attr("class")
				.split(/\s+/)
				.filter((c) => c !== "");

			// li クラス内の wp-block-* に対応するもの（li 側は接頭辞無し想定）
			const liWpClassCandidates = liClassList.filter((c) =>
				wpBlockClasses.includes(c),
			);

			// li クラス内のその他（つまり wpBlockClass でないもの）
			const liOtherClasses = liClassList.filter(
				(c) => !wpBlockClasses.includes(c),
			);

			// 1. wp-block クラスが1つ以上一致
			const hasMatchingBlockClass = liWpClassCandidates.length > 0;

			// 2. その他のクラスもすべて figure_elm 側に含まれている
			const allOtherClassesMatch = liOtherClasses.every((c) =>
				figureClassList.includes(c),
			);

			return hasMatchingBlockClass && allOtherClassesMatch;
		});

		if (set_flg) {
			targetLis.addClass("ready");
		} else {
			targetLis.removeClass("ready");
		}
	};

	//アニメーション関連パラメータ

	let animating = false; //flag to prevent quick multi-click glitches
	//ページのセット
	let fieldset_objs = $(".figure_fieldset");
	//プロセスエリアのセット
	let process_area = $(".wp-block-itmar-design-process");

	//プログレスバーの高さ
	let progress_height = process_area ? process_area.outerHeight(true) : 0;
	let contactform_top_margin = $(".wp-block-itmar-contactmail-sender>div").css(
		"margin-top",
	);

	//スライドのアニメーション
	const processAnimation = (current_fs, change_fs, next) => {
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

	//必須項目のバリデーションチェック
	function require_check(form) {
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
						const msg = __("This is a required field.", "form-send-blocks");
						console.log(msg);
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

	const { __ } = wp.i18n;
	const errorMap = {
		invalid_token: __(
			"The token has already been used or is invalid.",
			"form-send-blocks",
		),
		expired: __("The token has expired.", "form-send-blocks"),
		user_fail: __("User registration failed.", "form-send-blocks"),
		no_data: __("Input data missing", "form-send-blocks"),
		invalid_mail: __(
			"The email address format is invalid.",
			"form-send-blocks",
		),
		no_require: __("Your name and password are required.", "form-send-blocks"),
		email_exists: __(
			"The email address is already in use.",
			"form-send-blocks",
		),
		username_exists: __("The user ID is already in use.", "form-send-blocks"),
		save_error: __(
			"Failed to save temporary registration data.",
			"form-send-blocks",
		),
		mail_error: __(
			"The email containing the provisional registration results could not be sent.",
			"form-send-blocks",
		),
	};

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
				let err_msg = `--------------------\nerror content : ${
					errorMap[urlParams.get("error_code")]
				}`;
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

	//formの確認画面へボタンが押されたときの処理
	$("#to_confirm_form").on("submit", function (e) {
		e.preventDefault();

		//アニメーション中ならリターン
		if (animating) return false;

		//必須のバリデーションチェック
		if (require_check($(this))) return;

		animating = true; //アニメーションフラグを立てる

		//次の画面に遷移
		//アニメーションの実行
		processAnimation(fieldset_objs.eq(0), fieldset_objs.eq(1), true);
		//プログレスエリアの処理
		process_change(
			$(this).parent().parent().nextAll(".figure_fieldset").first(),
			true,
		);

		//確認データの表示
		let disp_table = $(".wp-block-itmar-design-table");
		let source_name = disp_table.data("source");
		let source_elm = $(`*[name="${source_name}"]`);
		let input_elm = source_elm.find(
			'input:not([type="submit"]):not([type="checkbox"]), textarea, select',
		);
		input_elm.each(function (index) {
			let tagName = $(this).prop("tagName").toLowerCase();
			let input_val = "";
			if (tagName === "input" || tagName === "textarea") {
				input_val = $(this).val();
			}
			if (tagName === "select") {
				let selectedTexts = [];
				$(this)
					.find("option:selected")
					.each(function () {
						// 選択されたoptionのテキストを配列に追加
						selectedTexts.push($(this).text());
					});
				input_val = selectedTexts.join(",");
			}
			$("#itmar_send_exec")
				.find("tbody tr")
				.eq(index)
				.find("td")
				.text(input_val);
		});
	});

	//問い合わせの実行またはキャンセルボタンが押されたときの処理
	$("#itmar_send_exec").on("submit", function (e) {
		e.preventDefault();

		//アニメーション中ならリターン
		if (animating) return false;

		animating = true;

		//押されたボタンの取得
		const click_id = e.originalEvent.submitter.id;

		//キャンセルボタンなら元に戻して終了
		if (click_id === $(this).data("cancel_id")) {
			//アニメーションの実行
			processAnimation(fieldset_objs.eq(1), fieldset_objs.eq(0), false);
			//プログレスエリアの処理
			process_change($(this).parent().parent(), false);
			return;
		}

		// Promiseを格納する配列を作成
		const promises = [];

		//親ブロックの情報取得
		let parent_block = $(this).parents(".wp-block-itmar-contactmail-sender");

		let master_email = parent_block.data("master_mail");
		let master_name = parent_block.data("master_name");
		let subject_info = parent_block.data("subject_info");
		let message_info = parent_block.data("message_info");
		let is_dataSave = parent_block.data("is_datasave");
		//message_infoの再構築
		message_info = message_rebuild(message_info);
		//ローディングマークを出す
		dispLoading(__("sending...", "form-send-blocks"), $("#itmar_send_exec"));
		//通知メールの送信
		promises.push(
			sendMail_ajax(
				master_email,
				subject_info,
				message_info,
				master_email,
				master_name,
				false,
				false,
			),
		);
		//自動応答メール
		let is_retmail = parent_block.data("is_retmail");
		if (is_retmail) {
			let ret_inputName = parent_block.data("ret_mail");
			let ret_email = $(`[name="${ret_inputName}"]`).val();
			let master_email = parent_block.data("master_mail");
			let subject_ret = parent_block.data("subject_ret");
			let message_ret = parent_block.data("message_ret");
			//message_retの再構築
			message_ret = message_rebuild(message_ret);
			//自動応答メールの送信
			promises.push(
				sendMail_ajax(
					ret_email,
					subject_ret,
					message_ret,
					master_email,
					master_name,
					is_dataSave,
					true,
				),
			);
		}

		let figure_elm = $(this).parent();

		// Promise.allSettledですべての非同期処理が完了するのを待つ
		Promise.allSettled(promises)
			.then((result) => {
				//送信結果の取得
				let all_result = result.reduce((acc, curr) => {
					if ("value" in curr) {
						Object.assign(acc, curr.value);
					}
					return acc;
				}, {});
				//表示エリアに表示
				let result_disp = $("#to_home p");
				result_disp.empty();
				$.each(all_result, function (key, value) {
					if (!(key === "save" || key === "error")) {
						let message = $("#to_home").data(`${key}_${value.status}`);
						let p = $("<p></p>").addClass(value.status).text(message);
						result_disp.append(p);
					} else if (key === "error") {
						let p = $("<p></p>").addClass(value.status).text(value.message);
						result_disp.append(p);
					}
				});
			})
			.catch((error) => {
				// エラーハンドリング
				console.error("エラーが発生しました: ", error);
				let p = $("<p></p>").addClass("error").text("エラーが発生しました。");
				result_disp.append(p);
			})
			.finally(() => {
				//ローディングマーク消去
				removeLoading("", $("#itmar_send_exec"));
				//アニメーションの実行
				processAnimation(fieldset_objs.eq(1), fieldset_objs.eq(2), true);
				//プログレスエリアの処理
				process_change(
					$(this).parent().parent().nextAll(".figure_fieldset").first(),
					true,
				);
			});
	});

	//ホームに戻るボタンの処理
	$("#to_home, #error_to_home, #to_mail").on("submit", function (e) {
		e.preventDefault();
		// href属性の[home_url]をhomeUrlに置き換え
		let updatedHref = $(this)
			.data("selected_page")
			.replace("[home_url]", form_send_blocks.home_url);

		//リダイレクト
		window.location.href = updatedHref;
	});

	//会員仮登録の処理と本登録メールの送信
	$("#send_confirm_form").on("submit", function (e) {
		e.preventDefault();

		//アニメーション中ならリターン
		if (animating) return false;
		//必須のバリデーションチェック
		if (require_check($(this))) return;
		animating = true;

		//親ブロックの情報取得
		let parent_block = $(this).parents(".wp-block-itmar-member-register");

		const block_info_obj = {
			master_email: parent_block.data("master_mail"),
			master_name: parent_block.data("master_name"),
			subject_prov: parent_block.data("subject_prov"),
			message_prov: message_rebuild(parent_block.data("message_prov")), //message_provの再構築
			is_retmail: parent_block.data("is_retmail"),
			is_logon: parent_block.data("is_logon"),
		};

		//現在のページ
		const pageUrl = window.location.href;

		//ローディングマークを出す
		dispLoading(__("sending...", "form-send-blocks"), $("#send_confirm_form"));

		//noceの取得
		const nonce = itmar_form_send_option.nonce;

		//ajaxの送り先
		const ajaxUrl = itmar_form_send_option.ajaxURL;

		const $form = $(this);
		const formData = $form.serialize();

		const ajax_result = {};

		$.ajax({
			url: ajaxUrl,

			type: "POST",
			data: {
				action: "itmar_register_send_token",
				nonce: nonce,
				redirect_to: pageUrl, // ← 現在のURLを追加
				form_data: formData,
				...block_info_obj,
			},
			dataType: "json",
		})
			.done(function (response) {
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
			})
			.fail(function (xhr, status, error) {
				ajax_result.status = "error";
			})
			.always(function () {
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
	});

	//カスタムログインの処理
	$("#to_login_form").on("submit", function (e) {
		e.preventDefault();

		//アニメーション中ならリターン
		if (animating) return false;

		//必須のバリデーションチェック
		if (require_check($(this))) return;

		animating = true;

		//ローディングマークを出す
		dispLoading(__("sending...", "form-send-blocks"), $("#to_login_form"));

		//noceの取得
		const nonce = itmar_form_send_option.nonce;

		//ajaxの送り先
		const ajaxUrl = itmar_form_send_option.ajaxURL;

		const $form = $(this);
		const formData = $form.serialize();
		const formParent = $form.closest(".wp-block-itmar-coustom-login");

		$.ajax({
			url: ajaxUrl,

			type: "POST",
			data: {
				action: "itmar_custom_login",
				nonce: nonce,
				form_data: formData,
				remember: formParent.data("is_remember") ? 1 : 0, // 数値で渡すのが確実
			},
			dataType: "json",
		})
			.done(function (response) {
				if (response.success) {
					// [home_url]をhomeUrlに置き換え
					let updatedHref = formParent
						.data("redirect_url")
						.replace("[home_url]", form_send_blocks.home_url);
					window.location.href = updatedHref;
				} else {
					//表示エリアに表示
					let result_disp = $("#error_to_home p");
					result_disp.empty();

					let p = $("<p></p>")
						.addClass("error")
						.text($("#error_to_home").data("info_mail_error"));
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

	//専用ページを開くボタンの処理
	$("#to_regist_page").on("submit", function (e) {
		e.preventDefault();

		// href属性の[home_url]をhomeUrlに置き換え
		let updatedHref = $(this)
			.data("selected_page")
			.replace("[home_url]", form_send_blocks.home_url);
		console.log(updatedHref);
		//リダイレクト
		window.location.href = updatedHref;
	});
});
