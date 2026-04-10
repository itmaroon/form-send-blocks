import { __ } from "@wordpress/i18n";
import {
	require_check,
	dispLoading,
	removeLoading,
	processAnimation,
	process_change,
	message_rebuild,
	sendMail_ajax,
} from "../front_common";

jQuery(function ($) {
	//アニメーション関連パラメータ
	let step_count = 0; //ステップカウントを初期化

	//アニメーション関連パラメータ
	let animating = false; //flag to prevent quick multi-click glitches

	//ページのセット
	let fieldset_objs = $(".figure_fieldset");

	// テーブルの表示を書き換えるヘルパー関数
	function updateTableDisplay(tableId, data) {
		const $targetTable = $(
			`.wp-block-itmar-design-table[data-define_id="${tableId}"]`,
		);
		const $tbody = $targetTable.find("tbody");

		// 一旦中身を空にして再描画（または特定のセルを更新）
		$tbody.empty();
		data.forEach((item) => {
			$tbody.append(`
            <tr>
                <td>${item.label}</td>
                <td>${item.value}</td>
            </tr>
        `);
		});
	}

	// ページ内の特定のクラスを持つ要素の中にあるitmar_send_exec以外の全てのformを対象にする
	$(document).on(
		"submit",
		".figure_fieldset form:not(#itmar_send_exec):not(#itmar_thanks)",
		function (e) {
			e.preventDefault(); // デフォルトの送信を防止

			const $form = $(this);
			const formId = $form.attr("id"); // どのフォームが送信されたか識別

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
			} else if (click_key === "back_id") {
				//アニメーションの実行
				processAnimation(
					fieldset_objs.eq(step_count),
					fieldset_objs.eq(step_count - 1),
					false,
				);
				//プログレスエリアの処理
				process_change($(this).parent().parent(), false);

				step_count--; //ステップカウントのデクリメント
				animating = false;
				return;
			}

			//必須のバリデーションチェック
			if (require_check($, $(this))) return;

			animating = true; //アニメーションフラグを立てる

			//確認データの表示
			if (formId === "to_confirm_form") {
				let disp_table = $(".wp-block-itmar-design-table");
				// 各要素から data-define_id を取得して配列化
				let defineIds = disp_table
					.map(function () {
						return $(this).attr("data-define_id"); // または $(this).data("define_id")
					})
					.get();

				// defineIds をループして、対応する fieldset を探す
				defineIds.forEach((id) => {
					// name 属性がテーブルの defineID と一致する fieldset を特定
					let source_elm = $(`.figure_fieldset[name="${id}"]`);

					if (source_elm.length > 0) {
						// 3. その fieldset 内の入力要素を抽出
						let input_elms = source_elm.find(
							'input:not([type="submit"]):not([type="checkbox"]), textarea, select',
						);

						// 抽出したデータを格納する配列
						let rowData = [];

						input_elms.each(function () {
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

							// ラベルの取得（inputのidに関連付けられたlabel、または直近のlabel）
							const labelText =
								$(`label[for="${$(this).attr("id")}"]`).text() ||
								$(this).closest("label").text() ||
								"項目";

							rowData.push({ label: labelText, value: input_val });
						});
						// 4. 対応するテーブルの表示を更新する関数（自作の反映ロジック）を呼ぶ
						updateTableDisplay(id, rowData);
					}
				});
			}

			//アニメーションの実行
			processAnimation(
				fieldset_objs.eq(step_count),
				fieldset_objs.eq(step_count + 1),
				true,
			);
			//プログレスエリアの処理
			process_change(
				$(this).parent().parent().nextAll(".figure_fieldset").first(),
				true,
			);

			step_count++; //ステップカウントのインクリメント
			animating = false; //アニメーションフラグを下げる
		},
	);

	$("#itmar_send_exec").on("submit", function (e) {
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
		} else if (click_key === "back_id") {
			//アニメーションの実行
			processAnimation(
				fieldset_objs.eq(step_count),
				fieldset_objs.eq(step_count - 1),
				false,
			);
			//プログレスエリアの処理
			process_change($(this).parent().parent(), false);

			step_count--; //ステップカウントのデクリメント
			animating = false;
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
		let save_post_type = parent_block.data("save_post_type");
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
					save_post_type,
				),
			);
		}

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
				let result_disp = $("#itmar_thanks p");

				result_disp.empty();
				$.each(all_result, function (key, value) {
					if (!(key === "save" || key === "error")) {
						let message = $("#itmar_thanks").data(`${key}_${value.status}`);
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
				processAnimation(
					fieldset_objs.eq(step_count),
					fieldset_objs.eq(step_count + 1),
					true,
				);
				//プログレスエリアの処理;
				process_change(
					$(this).parent().parent().nextAll(".figure_fieldset").first(),
					true,
				);
				step_count++; //ステップカウントのインクリメント
				animating = false; //アニメーションフラグを下げる
			});
	});
});
