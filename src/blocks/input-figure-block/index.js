import { __ } from '@wordpress/i18n';
import { registerBlockType } from '@wordpress/blocks';
import './style.scss';

/**
 * Internal dependencies
 */
import Edit from './edit';
import save from './save';
import metadata from './block.json';
import { ReactComponent as Input } from './input.svg';

registerBlockType(metadata.name, {
	icon: <Input />,
	description: __("This is a block for collecting and displaying input elements in a form.", 'form-send-blocks'),
	attributes: {
		...metadata.attributes,
		stage_info: {
			type: "string",
			default: __('Information input', 'form-send-blocks')
		}
	},
	edit: Edit,
	save,
});
