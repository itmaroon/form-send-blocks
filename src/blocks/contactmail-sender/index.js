import { registerBlockType } from '@wordpress/blocks';
import './style.scss';
import { ReactComponent as Contact } from './envelopes-bulk-solid.svg';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Edit from './edit';
import save from './save';
import metadata from './block.json';


registerBlockType(metadata.name, {
	icon: <Contact />,
	description: __('This is a block for setting up an inquiry form.', 'itmar_form_send_blocks'),
	attributes: {
		...metadata.attributes,
		subject_info: {
			type: "string",
			default: __('We have received an inquiry.', 'itmar_form_send_blocks'),
		},
		message_info: {
			type: "string",
			default: __('We have received an inquiry regarding the following information.', 'itmar_form_send_blocks')
		},
		subject_ret: {
			type: "string",
			default: __('Thank you for contacting us.', 'itmar_form_send_blocks'),
		},
		message_ret: {
			type: "string",
			default: __('We have received your inquiry with the following details.', 'itmar_form_send_blocks'),
		}
	},
	edit: Edit,
	save,
});
