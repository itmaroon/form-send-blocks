import { __ } from "@wordpress/i18n";
import { registerBlockType, BlockConfiguration } from "@wordpress/blocks";
import "./style.scss";
import { Attributes } from "./type";

/**
 * Internal dependencies
 */
import Edit from "./edit";
import save from "./save";
import metadata from "./block.json";
import { ReactComponent as Thanks } from "./thanks.svg";

// metadata を WordPress のブロック構成型としてキャストします
const blockConfig = metadata as unknown as BlockConfiguration<Attributes>;

registerBlockType(blockConfig, {
	description: __(
		"It is a block that displays to convey gratitude when processing is completed",
		"form-send-blocks",
	),
	attributes: {
		...metadata.attributes,
		stage_info: {
			type: "string",
			default: __("Processing completed", "form-send-blocks"),
		},
	} as any,
	icon: <Thanks />,
	edit: Edit,
	save,
});
