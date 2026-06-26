import { __ } from "@wordpress/i18n";
import { styleComponentApply } from "itmar-block-packages";
import { StyleComp } from "./StyleInputFigure";
import { Attributes } from "./type";

//styled_conponentの適用
styleComponentApply<Attributes>(
	StyleComp,
	".wp-block-itmar-input-figure-block",
	{ selector: ".itmar-wrap", target: "inner" },
);
