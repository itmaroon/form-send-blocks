
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
	edit: Edit,
	save,
});
