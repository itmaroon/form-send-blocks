import { __ } from "@wordpress/i18n";

jQuery(function ($) {
	//ホームに戻るボタンの処理
	$(document).on("submit", ".figure_fieldset form#itmar_thanks", function (e) {
		e.preventDefault();
		// href属性の[home_url]をhomeUrlに置き換え
		let updatedHref = $(this)
			.data("selected_page")
			.replace("[home_url]", itmar_option.home_url);

		//リダイレクト
		window.location.href = updatedHref;
	});
});
