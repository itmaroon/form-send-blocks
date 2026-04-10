import { __ } from "@wordpress/i18n";
import { evaluateCheckboxes } from "../front_common";

jQuery(function ($) {
	let $target_form = $("#itmar_send_exec");
	//確認画面遷移のボタンの有効化
	$(document).ready(function () {
		// ページ読み込み時に関数を実行
		evaluateCheckboxes($target_form);
	});
});
