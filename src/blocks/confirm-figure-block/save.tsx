import { useBlockProps, InnerBlocks } from "@wordpress/block-editor";
import { Attributes } from "./type";

export default function save({ attributes }: { attributes: Attributes }) {
	const { bgColor } = attributes;

	//ブロックのスタイル設定
	const blockStyle = { overflow: "hidden", background: bgColor };

	const blockProps = useBlockProps.save({
		style: blockStyle,
		className: "figure_fieldset",
		"data-attributes": JSON.stringify(attributes),
	});

	return (
		<div {...blockProps}>
			<div className="itmar-wrap">
				<form id="itmar_send_exec">
					<InnerBlocks.Content />
				</form>
			</div>
		</div>
	);
}
