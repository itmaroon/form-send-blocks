import { __ } from "@wordpress/i18n";
import { evaluateCheckboxes } from "../front_common";

import { StyleComp } from "./StyleConfirmFigure";
import { Attributes } from "./type";
import { styleComponentApply } from "itmar-block-packages";
import { enterTitle } from "../front_common";
//import $ from "jquery";

//styled_conponentの適用
styleComponentApply<Attributes>(
	StyleComp,
	".wp-block-itmar-confirm-figure-block",
	{ selector: ".itmar-wrap", target: "inner" },
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
