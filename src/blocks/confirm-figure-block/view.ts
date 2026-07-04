import { __ } from "@wordpress/i18n";
import { evaluateCheckboxes } from "../front_common";

import { createConfirmFigureStyleCss } from "./StyleConfirmFigure";
import { Attributes } from "./type";
import { styleDataApply } from "itmar-block-packages";
import { enterTitle } from "../front_common";
//import $ from "jquery";

//保存済み属性から、React非依存のスコープ付きCSSを適用
styleDataApply<Attributes>(
	createConfirmFigureStyleCss,
	".wp-block-itmar-confirm-figure-block",
	{
		selector: ".itmar-wrap",
		target: "inner",
		classPrefix: "itmar-confirm-style-",
		observe: true,
	},
);

jQuery(function ($) {
	let $target_form = $("#itmar_send_exec");
	//確認画面遷移のボタンの有効化
	evaluateCheckboxes($target_form);
	//表示用の文言をセット
	$(document).on(
		"clickButtonIdChanged",
		".wp-block-itmar-confirm-figure-block",
		function (event, clickKey) {
			const rawAttributes = $(this).attr("data-attributes");
			if (rawAttributes) {
				const attributes = JSON.parse(rawAttributes);
				const displayObj = attributes.displayMapping?.[clickKey];
				//実行ボタンの表示
				const $submitButton = $(this).find(
					'button[type="submit"][data-back="none"]',
				);

				if ($submitButton) {
					$submitButton.text(displayObj?.button_label);
				}
				//注意メッセージの書き換え
				const $attentionElm = $(this).find(
					`[data-unique_id=${displayObj?.attention_Id}]`,
				);
				if ($attentionElm) {
					enterTitle($attentionElm, displayObj?.attention_mess);
				}
			}
		},
	);
});
