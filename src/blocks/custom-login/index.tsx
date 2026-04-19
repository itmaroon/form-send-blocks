import { registerBlockType, BlockConfiguration } from "@wordpress/blocks";
import { Attributes } from "./type";
import "./style.scss";
import { ReactComponent as Contact } from "./custom-login.svg";
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
		"This block provides the functionality to display a customized login screen.",
		"form-send-blocks",
	),
	attributes: {
		...metadata.attributes,
		redirectUrl: {
			type: "string",
			default: itmar_option.home_url,
		},
	} as any,

	edit: Edit,
	save,
});
