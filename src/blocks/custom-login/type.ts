// attributes の型定義（block.json の内容と一致させる）

interface PositionSettings {
	margin_value?: any; // BoxControlなどが使うオブジェクト型
	padding_value?: any;
}

export interface Attributes {
	default_pos: PositionSettings;
	mobile_pos: PositionSettings;
	is_shadow: boolean;
	shadow_element: any;
	shadow_result: any;
	selectedSlug: string;
	redirectPath: string;
	isRemember: boolean;
}
