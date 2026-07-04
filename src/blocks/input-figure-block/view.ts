import { __ } from "@wordpress/i18n";
import { styleDataApply } from "itmar-block-packages";
import { createInputFigureStyleCss } from "./StyleInputFigure";
import { Attributes } from "./type";

//保存済み属性から、React非依存のスコープ付きCSSを適用
styleDataApply<Attributes>(
	createInputFigureStyleCss,
	".wp-block-itmar-input-figure-block",
	{
		selector: ".itmar-wrap",
		target: "inner",
		classPrefix: "itmar-input-style-",
		observe: true,
	},
);
