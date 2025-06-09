import { registerBlockType } from "@wordpress/blocks";
import "./style.scss";
import { ReactComponent as Contact } from "./custom-login.svg";
import { __ } from "@wordpress/i18n";

/**
 * Internal dependencies
 */
import Edit from "./edit";
import save from "./save";
import metadata from "./block.json";

registerBlockType(metadata.name, {
	icon: <Contact />,
	description: __(
		"This block provides the functionality to display a customized login screen.",
		"form-send-blocks",
	),
	attributes: {
		...metadata.attributes,
		redirectUrl: {
			type: "string",
			default: form_send_blocks.home_url,
		},
	},

	edit: Edit,
	save,
});
