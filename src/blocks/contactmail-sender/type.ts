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
	master_mail: string;
	master_name: string;
	subject_info: string;
	message_info: string;
	ret_mail: string;
	subject_ret: string;
	message_ret: string;
	is_retmail: boolean;
	is_dataSave: boolean;
	save_post_type: string;
	current_step: number;
}
