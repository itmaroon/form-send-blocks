import { useBlockProps, InnerBlocks } from "@wordpress/block-editor";
import { Attributes } from "./type";

export default function save({ attributes }: { attributes: Attributes }) {
	const {
		info_type,
		infomail_success,
		infomail_faile,
		retmail_success,
		retmail_faile,
		selectedPageUrl,
		bgColor,
	} = attributes;

	const blockStyle = { overflow: "hidden", background: bgColor };

	const blockProps = useBlockProps.save({
		style: blockStyle,
		className: `figure_fieldset ${info_type}`,
		"data-attributes": JSON.stringify(attributes),
	});

	return (
		<div {...blockProps}>
			<div className="itmar-wrap">
				<form
					id="itmar_thanks"
					data-info_mail_success={infomail_success}
					data-info_mail_error={infomail_faile}
					data-ret_mail_success={retmail_success}
					data-ret_mail_error={retmail_faile}
					data-selected_page={selectedPageUrl}
				>
					<InnerBlocks.Content />
				</form>
			</div>
		</div>
	);
}
