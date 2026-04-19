import { __ } from "@wordpress/i18n";
import { StyleComp } from "./StyleThanksFigure";
import { Attributes } from "./type";
import { styleComponentApply } from "itmar-block-packages";

//styled_conponentの適用
styleComponentApply<Attributes>(
	StyleComp,
	".wp-block-itmar-thanks-figure-block",
);

jQuery(function ($) {
	const parent_block = $(".wp-block-itmar-thanks-figure-block");

	//ホームに戻るボタンの処理
	parent_block.find("form").on("submit", function (e) {
		e.preventDefault();

		const rawAttributes = parent_block.attr("data-attributes");
		if (rawAttributes) {
			try {
				// オブジェクトに変換
				const attributes = JSON.parse(rawAttributes);
				const { selectedPageUrl } = attributes;
				// href属性の[home_url]をhomeUrlに置き換え
				let updatedHref = selectedPageUrl.replace(
					"[home_url]",
					itmar_option.home_url,
				);

				//リダイレクト
				window.location.href = updatedHref;
			} catch (e) {
				console.error("Attributes parsing failed:", e);
			}
		}
	});
});
