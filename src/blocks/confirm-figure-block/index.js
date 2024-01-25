import { __ } from '@wordpress/i18n';
import { registerBlockType } from '@wordpress/blocks';
import './style.scss';

/**
 * Internal dependencies
 */
import Edit from './edit';
import save from './save';
import metadata from './block.json';
import { ReactComponent as Confirm } from './confirm.svg';

registerBlockType(metadata.name, {
	icon: <Confirm />,
	description: __("This block is displayed to confirm the information entered in the form.", 'form-send-blocks'),
	attributes: {
		...metadata.attributes,
		stage_info: {
			type: "string",
			default: __('confirmation', 'form-send-blocks')
		}
	},
	edit: Edit,
	save,
});
