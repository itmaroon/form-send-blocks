import { __ } from "@wordpress/i18n";
import { registerBlockType, BlockConfiguration } from "@wordpress/blocks";
import { Attributes } from "./type";
import "./style.scss";

/**
 * Internal dependencies
 */
import Edit from "./edit";
import save from "./save";
import metadata from "./block.json";
import { ReactComponent as Confirm } from "./confirm.svg";

// metadata を WordPress のブロック構成型としてキャストします
const blockConfig = metadata as unknown as BlockConfiguration<Attributes>;

registerBlockType(blockConfig, {
	icon: <Confirm />,
	description: __(
		"This block is displayed to confirm the information entered in the form.",
		"form-send-blocks",
	),
	attributes: {
		...metadata.attributes,
		stage_info: {
			type: "string",
			default: __("confirmation", "form-send-blocks"),
		},
	} as any,
	edit: Edit,
	save,
});
