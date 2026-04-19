// attributes の型定義（block.json の内容と一致させる）

interface BlockTableMap {
	blockId: string;
	tableId: string;
}

interface PositionSettings {
	margin_form?: any; // BoxControlなどが使うオブジェクト型
	padding_form?: any;
}

export interface Attributes {
	bgColor: string;
	bgColor_form: string;
	bgGradient_form: string;
	radius_form: any;
	border_form: any;
	default_pos: PositionSettings;
	mobile_pos: PositionSettings;
	stage_info: string;
	blockTableMapping: BlockTableMap[];
	send_id: string;
	cancel_id: string;
	shadow_element: any;
	shadow_result: any;
	is_shadow: boolean;
}
