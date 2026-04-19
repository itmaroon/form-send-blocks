// attributes の型定義（block.json の内容と一致させる）

interface PositionSettings {
	margin_form?: any; // BoxControlなどが使うオブジェクト型
	padding_form?: any;
}

export interface Attributes {
	default_pos: PositionSettings;
	mobile_pos: PositionSettings;
	is_shadow: boolean;
	shadow_element: any;
	shadow_result: any;
	selectedSlug: string;
	redirectUrl: string;
	isRemember: boolean;
	form_type: string;
	form_name: string;
	bgColor: string;
	bgColor_form: string;
	bgGradient_form: string;
	radius_form: any;
	border_form: any;
	label_width: string;
	inputIndex: number;
	stage_info: string;
	isLastStep: boolean;
}
