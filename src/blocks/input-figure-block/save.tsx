import { useBlockProps, InnerBlocks } from "@wordpress/block-editor";
import { Attributes } from "./type";

export default function save({ attributes }: { attributes: Attributes }) {
	const { form_type, form_name, isLastStep, inputIndex, bgColor } = attributes;
	//問い合わせの場合は最後のフォームかどうかでIDを変える
	const inpuery_id = isLastStep
		? "to_confirm_form"
		: `to_input_next_${inputIndex}`;
	const appear_flg = inputIndex === 0 ? "appear" : "";

	//form_typeでフォームのIDを決定
	const form_id =
		form_type === "inquiry"
			? inpuery_id
			: form_type === "member"
			? "send_confirm_form"
			: form_type === "login"
			? "to_login_form"
			: "";

	//ブロックのスタイル設定
	const blockStyle = { overflow: "hidden", background: bgColor };

	const blockProps = useBlockProps.save({
		style: blockStyle,
		className: `figure_fieldset ${form_type} ${appear_flg}`,
		"data-attributes": JSON.stringify(attributes),
		name: form_name,
	});

	return (
		<div {...blockProps}>
			<form id={form_id}>
				<InnerBlocks.Content />
			</form>
		</div>
	);
}
