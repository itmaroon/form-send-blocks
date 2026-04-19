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
	current_step: number;
	info_type: string;
	infomail_success: string;
	infomail_faile: string;
	retmail_success: string;
	retmail_faile: string;
	bgColor: string;
	bgColor_form: string;
	bgGradient_form: string;
	radius_form: any;
	border_form: any;
	stage_info: string;
	selectedSlug: string;
	selectedPageUrl: string;
}
