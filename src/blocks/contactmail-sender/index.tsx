import { registerBlockType, BlockConfiguration } from "@wordpress/blocks";
import "./style.scss";
import { ReactComponent as Contact } from "./envelopes-bulk-solid.svg";
import { Attributes } from "./type";
import { __ } from "@wordpress/i18n";

/**
 * Internal dependencies
 */
import Edit from "./edit";
import save from "./save";
import metadata from "./block.json";

// metadata を WordPress のブロック構成型としてキャストします
const blockConfig = metadata as unknown as BlockConfiguration<Attributes>;

registerBlockType(blockConfig, {
	icon: <Contact />,
	description: __(
		"This is a block for setting up an inquiry form.",
		"form-send-blocks",
	),
	attributes: {
		...metadata.attributes,
		subject_info: {
			type: "string",
			default: __("We have received an inquiry.", "form-send-blocks"),
		},
		message_info: {
			type: "string",
			default: __(
				"We have received an inquiry regarding the following information.",
				"form-send-blocks",
			),
		},
		subject_ret: {
			type: "string",
			default: __("Thank you for contacting us.", "form-send-blocks"),
		},
		message_ret: {
			type: "string",
			default: __(
				"We have received your inquiry with the following details.",
				"form-send-blocks",
			),
		},
	} as any,
	edit: Edit,
	save,
});
