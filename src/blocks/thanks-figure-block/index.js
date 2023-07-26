
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
	icon: <Thanks />,
	edit: Edit,
	save,
});
