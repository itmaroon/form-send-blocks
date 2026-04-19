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

import { styleComponentApply } from "itmar-block-packages";

import { StyleComp } from "./StyleContactMail";
import { Attributes } from "./type";

interface TableRowData {
	label: string;
	value: string | number | string[];
}

//styled_conponentの適用
styleComponentApply<Attributes>(
	StyleComp,
	".wp-block-itmar-contactmail-sender",
);

jQuery(function ($) {
	//アニメーション関連パラメータ
	let step_count = 0; //ステップカウントを初期化

	//アニメーション関連パラメータ
	let animating = false; //flag to prevent quick multi-click glitches

	//親ブロックの取得
	const parent_block = $(".wp-block-itmar-contactmail-sender");

	//ページのセット
	let fieldset_objs = parent_block.find(".figure_fieldset");
	console.log(fieldset_objs);

	// テーブルの表示を書き換えるヘルパー関数

	function updateTableDisplay(tableId: string, data: TableRowData[]) {
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
		function (e: any) {
			e.preventDefault(); // デフォルトの送信を防止

			const $form = $(e.currentTarget);
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
			if (require_check($, $(this as HTMLElement))) return;

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
						let rowData: TableRowData[] = [];

						input_elms.each(function (this: HTMLElement) {
							const $elm = $(this);
							let tagName = $elm.prop("tagName").toLowerCase();
							let input_val: string | number | string[] = "";
							if (tagName === "input" || tagName === "textarea") {
								input_val = $elm.val() ?? "";
							}
							if (tagName === "select") {
								let selectedTexts: string[] = [];
								$elm.find("option:selected").each(function () {
									// 選択されたoptionのテキストを配列に追加
									selectedTexts.push($elm.text());
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

	$("#itmar_send_exec").on("submit", function (e: any) {
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
		const promises: Promise<unknown>[] = [];

		//親ブロックの情報取得
		const parent_block = $(this).parents(".wp-block-itmar-contactmail-sender");
		const rawAttributes = parent_block.attr("data-attributes");
		if (rawAttributes) {
			try {
				// 2. オブジェクトに変換
				const attributes = JSON.parse(rawAttributes);

				// 3. 必要な変数に割り当て
				// 分割代入（Destructuring）を使うと非常にスッキリします
				const {
					master_mail: master_email,
					master_name,
					subject_info,
					message_info,
					is_retmail,
					subject_ret,
					message_ret,
					ret_mail,
					is_dataSave,
					save_post_type,
				} = attributes;
				//message_infoの再構築
				const rebuild_message_info = message_rebuild(message_info);

				//ローディングマークを出す
				dispLoading(
					__("sending...", "form-send-blocks"),
					$("#itmar_send_exec"),
				);
				//通知メールの送信
				promises.push(
					sendMail_ajax(
						master_email,
						subject_info,
						rebuild_message_info,
						master_email,
						master_name,
						false,
						false,
					),
				);
				//自動応答メール
				if (is_retmail) {
					let ret_email = $(`[name="${ret_mail}"]`).val();

					//message_retの再構築
					const rebuild_message_ret = message_rebuild(message_ret);
					//自動応答メールの送信
					promises.push(
						sendMail_ajax(
							ret_email,
							subject_ret,
							rebuild_message_ret,
							master_email,
							master_name,
							is_dataSave,
							true,
							save_post_type,
						),
					);
				}
				//表示エリア
				let result_disp = $("#itmar_thanks p");
				// Promise.allSettledですべての非同期処理が完了するのを待つ
				Promise.allSettled(promises)
					.then((result) => {
						// 個別の送信結果の構造を定義
						interface SendResultItem {
							status: "success" | "error" | string;
							message?: string;
							[key: string]: any; // その他の動的なプロパティを許容
						}
						// all_result 全体の型（キーが動的なので Record 型を使用）
						type AllResult = Record<string, SendResultItem>;
						//送信結果の取得
						let all_result = (result as any[]).reduce(
							(acc: AllResult, curr) => {
								if (curr && typeof curr === "object" && "value" in curr) {
									Object.assign(acc, curr.value);
								}
								return acc;
							},
							{},
						);

						result_disp.empty();

						$.each(all_result, function (key, value) {
							if (!(key === "save" || key === "error")) {
								let message = $("#itmar_thanks").data(`${key}_${value.status}`);
								let p = $("<p></p>").addClass(value.status).text(message);
								result_disp.append(p);
							} else if (key === "error") {
								let p = $("<p></p>")
									.addClass(value.status)
									.text(value.message || "Error");
								result_disp.append(p);
							}
						});
					})
					.catch((error) => {
						// エラーハンドリング
						console.error("エラーが発生しました: ", error);
						let p = $("<p></p>")
							.addClass("error")
							.text("エラーが発生しました。");
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
			} catch (e) {
				console.error("Attributes parsing failed:", e);
			}
		}
	});
});
