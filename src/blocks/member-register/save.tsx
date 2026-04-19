import { useBlockProps, InnerBlocks } from "@wordpress/block-editor";

import { Attributes } from "./type";

export default function save({ attributes }: { attributes: Attributes }) {
	const blockProps = useBlockProps.save({
		"data-attributes": JSON.stringify(attributes),
	});

	return (
		<div {...blockProps}>
			<InnerBlocks.Content />
		</div>
	);
}
