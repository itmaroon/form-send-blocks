import { __ } from '@wordpress/i18n';
import { registerBlockType } from '@wordpress/blocks';
import './style.scss';

/**
 * Internal dependencies
 */
import Edit from './edit';
import save from './save';
import metadata from './block.json';
import { ReactComponent as Thanks } from './thanks.svg';

registerBlockType(metadata.name, {
	description: __("It is a block that displays to convey gratitude when processing is completed", 'form-send-blocks'),
	attributes: {
		...metadata.attributes,
		stage_info: {
			type: "string",
			default: __('Processing completed', 'form-send-blocks')
		},
		selectedPageUrl: {
			type: "string",
			default: itmar_form_send_option.home_url
		}
	},
	icon: <Thanks />,
	edit: Edit,
	save,
});
