import { useBlockProps, InnerBlocks } from "@wordpress/block-editor";
import { Attributes } from "./type";

export default function save({ attributes }: { attributes: Attributes }) {
	//属性をまとめて書き出し
	const blockProps = useBlockProps.save({
		"data-attributes": JSON.stringify(attributes),
	});

	return (
		<div {...blockProps}>
			<div className="itmar-wrap">
				<InnerBlocks.Content />
			</div>
		</div>
	);
}
