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
	register_type: string;
	is_prov_notice: boolean;
	is_reg_notice: boolean;
	master_mail: string;
	master_name: string;
	ret_mail: string;
	subject_provision: string;
	message_provision: string;
	subject_ret_pro: string;
	message_ret_pro: string;
	subject_register: string;
	message_register: string;
	subject_ret_reg: string;
	message_ret_reg: string;
	is_logon: boolean;
	is_success_mail: boolean;
	current_step: number;
}
