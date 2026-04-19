import { __ } from "@wordpress/i18n";
import { evaluateCheckboxes } from "../front_common";

import { StyleComp } from "./StyleConfirmFigure";
import { Attributes } from "./type";
import { styleComponentApply } from "itmar-block-packages";
//import $ from "jquery";

//styled_conponentの適用
styleComponentApply<Attributes>(
	StyleComp,
	".wp-block-itmar-confirm-figure-block",
);

jQuery(function ($) {
	let $target_form = $("#itmar_send_exec");
	//確認画面遷移のボタンの有効化
	evaluateCheckboxes($target_form);
});
