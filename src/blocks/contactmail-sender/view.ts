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
	{ selector: ".itmar-wrap", target: "inner" },
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

	// 抽出したデータを格納する配列
	let rowData: TableRowData[] = [];

	// テーブルの表示を書き換えるヘルパー関数

	function updateTableDisplay(tableId: string, data: TableRowData[]) {
		const $targetTable = $(
			`.wp-block-itmar-design-table[data-define_id="${tableId}"]`,
		);
		const $tbody = $targetTable.find("tbody");

		// 一旦中身を空にして再描画（または特定のセルを更新）
		$tbody.empty();
		const rowHeadings = $targetTable.data("row_heading");
		data.forEach((item, index) => {
			if (rowHeadings && rowHeadings[index]) {
				$tbody.append(`
					<tr>
						<th>${rowHeadings[index]}</th>
						<td>${item.value}</td>
					</tr>
					}
					
				`);
			} else {
				$tbody.append(`
					<tr>
						<th>${item.label}</th>
						<td>${item.value}</td>
					</tr>
					}
					
				`);
			}
		});
	}

	//親ブロックの指示があればfieldsetの一部をdetachするようにする
	// 型定義
	type DetachedItem = {
		elm: JQuery<HTMLElement>;
		prevSibling: JQuery<HTMLElement> | null;
		parent: JQuery<HTMLElement>;
	};

	// 配列で複数を管理
	let detachedElms: DetachedItem[] = [];
	let detachedLis: DetachedItem[] = [];
	// 親からのリセット指示を受け取る
	parent_block.on("fieldset:action", function (e, data) {
		//まず、detachしたものをもどす
		if (detachedElms.length > 0) {
			detachedElms.forEach(({ elm, prevSibling, parent }) => {
				if (prevSibling) {
					prevSibling.after(elm);
				} else {
					parent.prepend(elm);
				}
			});

			detachedLis.forEach(({ elm, prevSibling, parent }) => {
				if (prevSibling) {
					prevSibling.after(elm);
				} else {
					parent.prepend(elm);
				}
			});

			// リセット
			detachedElms = [];
			detachedLis = [];
		}
		//fieldset_objsの再読み込み
		fieldset_objs = parent_block.find(".figure_fieldset");
		//プログレスの要素
		let process_lis = $(".wp-block-itmar-design-process")?.find("li");
		//親ブロックがトリガーしたタイプによってdetachするformを決める
		const form_name = data.type;

		if (!form_name) return;

		fieldset_objs.each(function (index) {
			try {
				const attrs = JSON.parse($(this).attr("data-attributes") || "{}");
				if (attrs.form_name === form_name) {
					// fieldset の位置情報を保存してから detach
					const elmPrevSibling = $(this).prev().length ? $(this).prev() : null;
					const elmParent = $(this).parent();
					detachedElms.push({
						elm: $(this).detach(),
						prevSibling: elmPrevSibling,
						parent: elmParent,
					});

					// li の位置情報を保存してから detach
					const $li = process_lis.length > 0 ? process_lis.eq(index) : null;
					if ($li && $li.length > 0) {
						// ① detach 前に位置情報を保存
						const liPrevSibling = $li.prev().length ? $li.prev() : null;
						const liParent = $li.parent();

						// ② detach 実行
						detachedLis.push({
							elm: $li.detach(),
							prevSibling: liPrevSibling,
							parent: liParent,
						});

						// ③ 残りの li の幅を均等に再計算
						const remaining_lis = liParent.find("li");
						const newWidth = 100 / remaining_lis.length + "%";
						remaining_lis.css("width", newWidth);
					}
				}
			} catch (e) {}
		});
		//fieldset_objsの再読み込み
		fieldset_objs = parent_block.find(".figure_fieldset");
		// クラス名に "wp-block-itmar-input-figure-block" を含む最後の要素内の form の ID を変更
		fieldset_objs
			.filter(function () {
				return /wp-block-itmar-input-figure-block/.test(
					$(this).attr("class") || "",
				);
			})
			.last()
			.find("form")
			.attr("id", "to_confirm_form");

		// アニメーション中であれば即停止（キューもクリア）
		fieldset_objs.stop(true, false);

		// CSS を初期状態に戻す
		fieldset_objs.css({
			position: "",
			opacity: "",
			transform: "",
			left: "",
			top: "",
		});

		// 一つ目だけ表示、他は非表示
		fieldset_objs.first().show();
		fieldset_objs.not(":first").hide();

		// ステップカウントをリセット
		step_count = 0;

		//プログレスの初期化
		process_lis = $(".wp-block-itmar-design-process")?.find("li");
		if (process_lis.length > 0) {
			process_lis.eq(step_count).addClass("ready");
			process_lis.not(process_lis.eq(step_count)).removeClass("ready");
		}
	});

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

			//戻るの処理
			const pageDirection = e.originalEvent.submitter?.dataset.back;

			if (pageDirection === "back") {
				//アニメーションの実行
				processAnimation(
					fieldset_objs.eq(step_count),
					fieldset_objs.eq(step_count - 1),
					false,
				);
				//プログレスエリアの処理
				process_change($(this).closest(".figure_fieldset"), false);

				step_count--; //ステップカウントのデクリメント
				animating = false;
				return;
			}

			//必須のバリデーションチェック
			if (require_check($, $(this as HTMLElement))) return;

			animating = true; //アニメーションフラグを立てる

			//確認データの表示
			if (formId === "to_confirm_form") {
				//クリックされたボタンのkeyを確認フィギュアに記録してイベントトリガー
				const $confirmBlock = parent_block.find(
					".wp-block-itmar-confirm-figure-block",
				);
				const click_key = e.originalEvent?.submitter?.dataset.key;

				$confirmBlock
					.attr("data-click-button-id", click_key)
					.trigger("clickButtonIdChanged", [click_key]);

				//確認フィギュアからテーブルを取得
				const disp_table = $("#itmar_send_exec").find(
					".wp-block-itmar-design-table",
				);
				const confirm_attrs = $("#itmar_send_exec")
					.parent()
					.parent()
					.data("attributes");
				const block_mapping = confirm_attrs.blockTableMapping;

				// 各要素から data-define_id を取得して配列化
				let defineIds = disp_table
					.map(function () {
						return $(this).attr("data-define_id"); // または $(this).data("define_id")
					})
					.get();

				// defineIds をループして、対応する fieldset を探す
				for (const id of defineIds) {
					//データクリア
					rowData = [];

					const blockIds = block_mapping
						.filter((item) => item.tableId === id)
						.map((item) => item.blockId);

					// name 属性がテーブルの defineID と一致する fieldset を特定
					const selector = blockIds
						.map((id) => `.figure_fieldset[name="${id}"]`)
						.join(", ");

					let source_elm = $(selector);

					if (source_elm.length > 0) {
						// 3. その fieldset 内の入力要素(submitを除くinput要素とデザインタイトル）を抽出
						let input_elms = source_elm
							.find(
								'input:not([type="submit"]), textarea, select,.wp-block-itmar-design-title',
							)
							.filter(function () {
								if ($(this).hasClass("wp-block-itmar-design-title")) {
									// title の場合は unique_id があるものだけ残す
									return !!$(this).data("unique_id");
								}
								// それ以外はすべて通す
								return true;
							});

						input_elms.each(function (this: HTMLElement) {
							const $elm = $(this);

							let tagName = $elm.prop("tagName").toLowerCase();
							let input_val: string | number | string[] = "";
							if (tagName === "input" || tagName === "textarea") {
								if ($elm.is('input[type="checkbox"]')) {
									input_val = $elm.prop("checked")
										? __("Do", "form-send-blocks")
										: __("Don't", "form-send-blocks");
								} else if (
									$elm.data("prev_value") &&
									Number($elm.data("prev_value")) !== Number($elm.val())
								) {
									input_val = `${$elm.data("prev_value")}→${$elm.val() ?? ""}`;
								} else {
									input_val = $elm.val() ?? "";
								}
							} else if (tagName === "select") {
								let selectedTexts: string[] = [];
								$elm.find("option:selected").each(function () {
									// 選択されたoptionのテキストを配列に追加
									selectedTexts.push($elm.text());
								});
								input_val = selectedTexts.join(",");
							} else if ($elm.data("unique_id")) {
								input_val = $elm.text();
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
				}
			}

			//アニメーションの実行
			processAnimation(
				fieldset_objs.eq(step_count),
				fieldset_objs.eq(step_count + 1),
				true,
			);
			//プログレスエリアの処理
			process_change(
				$(this).closest(".figure_fieldset").nextAll(".figure_fieldset").first(),
				true,
			);

			step_count++; //ステップカウントのインクリメント
			animating = false; //アニメーションフラグを下げる
		},
	);

	$("#itmar_send_exec").on("submit", function (e: any, data) {
		e.preventDefault();

		//アニメーション中ならリターン
		if (animating) return false;

		//戻るの処理
		const pageDirection = e.originalEvent?.submitter?.dataset.back;

		if (pageDirection === "back") {
			//アニメーションの実行
			processAnimation(
				fieldset_objs.eq(step_count),
				fieldset_objs.eq(step_count - 1),
				false,
			);
			//プログレスエリアの処理
			process_change($(this).closest(".figure_fieldset"), false);

			step_count--; //ステップカウントのデクリメント
			animating = false;
			return;
		}
		//確認フィギュアの情報取得
		const confirm_block = $(this).parents(
			".wp-block-itmar-confirm-figure-block",
		);
		const confirmAttrJson = confirm_block.attr("data-attributes");
		if (!confirmAttrJson) return;
		const confirmAttributes = JSON.parse(confirmAttrJson || "");

		//確認フィギュアが送信停止になっていてトリガーにdataがわたっていないときは送信せずに終了
		if (confirmAttributes?.isSendPause && !data) {
			return;
		}

		// Promiseを格納する配列を作成
		const promises: Promise<unknown>[] = [];

		//親ブロックの情報取得
		const parent_block = $(this).parents(".wp-block-itmar-contactmail-sender");
		const rawAttributes = parent_block.attr("data-attributes");

		//確認フィギュアからの情報取得
		const clickKey = confirm_block.attr("data-click-button-id") || "";
		const displayObj = confirmAttributes.displayMapping?.[clickKey];

		if (rawAttributes && displayObj) {
			try {
				// 2. オブジェクトに変換
				const attributes = JSON.parse(rawAttributes);

				// 3. 必要な変数に割り当て
				// 分割代入（Destructuring）を使うと非常にスッキリします
				const {
					master_mail: master_email,
					mailAddressType,
					master_name,
					is_retmail,
					is_footer,
					footer_content,
					ret_mail,
					is_dataSave,
					save_post_type,
				} = attributes;

				const {
					notice_subject,
					notice_content,
					response_subject,
					response_content,
				} = displayObj;

				//message_infoの再構築
				const rebuild_message_info = `${
					data?.message ? data.message.text : ""
				} \n ${message_rebuild(notice_content)} 
				`;

				//ローディングマークを出す
				dispLoading(
					__("sending...", "form-send-blocks"),
					$("#itmar_send_exec"),
				);
				//通知メールの送信
				promises.push(
					sendMail_ajax(
						master_email,
						notice_subject,
						rebuild_message_info,
						master_email,
						master_name,
						false,
						false,
						"",
						"",
					),
				);
				//自動応答メール
				if (is_retmail) {
					let ret_email = $(`[name="${ret_mail}"]`).val();

					//message_retの再構築
					const rebuild_message_ret = `${
						data?.message ? data.message.text : ""
					} \n ${message_rebuild(response_content)}\n ${
						is_footer ? footer_content : ""
					} 
				`;

					//自動応答メールの送信
					promises.push(
						sendMail_ajax(
							ret_email,
							response_subject,
							rebuild_message_ret,
							master_email,
							master_name,
							is_dataSave,
							true,
							save_post_type,
							mailAddressType,
						),
					);
				}
				//表示エリア
				//サンキューフィギュアからの情報取得
				const thank_block = parent_block.find(
					".wp-block-itmar-thanks-figure-block",
				);

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
						const all_result = (result as any[]).reduce(
							(acc: AllResult, curr) => {
								if (curr && typeof curr === "object" && "value" in curr) {
									Object.assign(acc, curr.value);
								}
								return acc;
							},
							{},
						);
						//ブロックに属性を付けてトリガー
						thank_block
							.attr("data-click-button-id", clickKey)
							.attr("data-send-result", JSON.stringify(all_result))
							.trigger("clickButtonIdChanged", [clickKey]);
					})
					.catch((error) => {
						// エラーハンドリング
						console.error("エラーが発生しました: ", error);
						//ブロックに属性を付けてトリガー
						thank_block
							.attr("data-click-button-id", clickKey)
							.attr("data-send-result", JSON.stringify(error))
							.trigger("clickButtonIdChanged", [clickKey]);
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
							$(this)
								.closest(".figure_fieldset")
								.nextAll(".figure_fieldset")
								.first(),
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
