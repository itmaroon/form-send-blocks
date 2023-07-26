
import { registerBlockType } from '@wordpress/blocks';
import './style.scss';

/**
 * Internal dependencies
 */
import Edit from './edit';
import save from './save';
import metadata from './block.json';
import { ReactComponent as Process } from './process.svg';

registerBlockType(metadata.name, {
	icon: <Process />,
	edit: Edit,
	save,
});
