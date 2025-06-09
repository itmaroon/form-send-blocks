import { registerBlockType } from "@wordpress/blocks";
import "./style.scss";
import { ReactComponent as Contact } from "./member-register.svg";
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
		"This block sends a verification email to register members and registers them as WordPress members depending on the response.",
		"form-send-blocks",
	),
	attributes: {
		...metadata.attributes,
		subject_provision: {
			type: "string",
			default: __(
				"Thank you for your provisional registration",
				"form-send-blocks",
			),
		},
		message_provision: {
			type: "string",
			default: __(
				"Provisional registration has been completed. To complete your registration, please access the following URL.",
				"form-send-blocks",
			),
		},
		subject_ret_pro: {
			type: "string",
			default: __(
				"Provisional registration completion notice",
				"form-send-blocks",
			),
		},
		message_ret_pro: {
			type: "string",
			default: __(
				"Your provisional registration application has been accepted.",
				"form-send-blocks",
			),
		},
		subject_register: {
			type: "string",
			default: __("This registration is complete", "form-send-blocks"),
		},
		message_register: {
			type: "string",
			default: __(
				"Registration is now complete. You can log in with the user ID below or the email address and password you entered.",
				"form-send-blocks",
			),
		},
		subject_ret_reg: {
			type: "string",
			default: __(
				"Notification of completion of registration",
				"form-send-blocks",
			),
		},
		message_ret_reg: {
			type: "string",
			default: __(
				"The registration process has been completed and the new user has been added.",
				"form-send-blocks",
			),
		},
	},
	edit: Edit,
	save,
});
