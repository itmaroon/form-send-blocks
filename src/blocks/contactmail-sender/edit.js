
import { __ } from '@wordpress/i18n';
import { StyleComp } from './StyleContactMail';
import { useStyleIframe } from '../iframeFooks';
import ShadowStyle, { ShadowElm } from '../ShadowStyle';
import { useElementBackgroundColor, useIsIframeMobile } from '../CustomFooks';
import {
	useBlockProps,
	useInnerBlocksProps,
	InspectorControls
} from '@wordpress/block-editor';
import {
	PanelBody,
	PanelRow,
	ToggleControl,
	TextareaControl,
	Notice,
	TextControl,
	__experimentalBoxControl as BoxControl
} from '@wordpress/components';

import './editor.scss';

import { useState, useRef, useEffect } from '@wordpress/element';
import { useSelect, dispatch } from '@wordpress/data';

//スペースのリセットバリュー
const padding_resetValues = {
	top: '10px',
	left: '10px',
	right: '10px',
	bottom: '10px',
}

//ボーダーのリセットバリュー
const border_resetValues = {
	top: '0px',
	left: '0px',
	right: '0px',
	bottom: '0px',
}

const units = [
	{ value: 'px', label: 'px' },
	{ value: 'em', label: 'em' },
	{ value: 'rem', label: 'rem' },
];


export default function Edit({ attributes, setAttributes, clientId }) {
	const {
		default_pos,
		mobile_pos,
		is_shadow,
		shadow_element,
		master_mail,
		master_name,
		subject_info,
		message_info,
		ret_mail,
		subject_ret,
		message_ret,
		is_retmail,
		is_dataSave,
	} = attributes;


	//モバイルの判定
	const isMobile = useIsIframeMobile();

	//ブロックの参照
	const blockRef = useRef(null);
	const blockProps = useBlockProps({
		ref: blockRef,// ここで参照を blockProps に渡しています
	});

	//背景色の取得
	const baseColor = useElementBackgroundColor(blockRef, blockProps.style);

	//背景色変更によるシャドー属性の書き換え
	useEffect(() => {
		if (baseColor) {
			setAttributes({ shadow_element: { ...shadow_element, baseColor: baseColor } });
			const new_shadow = ShadowElm({ ...shadow_element, baseColor: baseColor });
			if (new_shadow) { setAttributes({ shadow_result: new_shadow.style }); }
		}
	}, [baseColor]);

	//サイトエディタの場合はiframeにスタイルをわたす。
	useStyleIframe(StyleComp, attributes);


	//インナーブロックの制御
	const TEMPLATE = [//同一ブロックを２つ以上入れないこと（名称の文字列が重ならないこと）
		['itmar/design-process', {}],
		['itmar/input-figure-block', { form_name: "inquiry_form" }],
		['itmar/confirm-figure-block', {}],
		['itmar/thanks-figure-block', {
			infomail_success: __("The person in charge has been notified of your inquiry. Please wait for a while until we reply.", 'itmar_form_send_blocks'),
			infomail_faile: __("Email notification to the person in charge failed.", 'itmar_form_send_blocks'),
			retmail_success: __("We have sent an automatic response email to you, so please check it.", 'itmar_form_send_blocks'),
			retmail_faile: __("Failed to send automatic response email to you.", 'itmar_form_send_blocks'),
		}]
	];
	const innerBlocksProps = useInnerBlocksProps(
		{},
		{
			template: TEMPLATE,
			templateLock: true
		}
	);

	//インナーブロックを取得
	const innerBlocks = useSelect((select) => select('core/block-editor').getBlocks(clientId), [clientId]);
	const inputFigureBlock = innerBlocks.find(block => block.name === 'itmar/input-figure-block');
	const inputInnerBlocks = inputFigureBlock ? inputFigureBlock.innerBlocks : [];

	//Emailのバリデーション正規表現
	const mail_pattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

	//編集中の値を確保するための状態変数
	const [master_mail_editing, setMasterMailValue] = useState(master_mail);
	const [master_name_editing, setMasterNameValue] = useState(master_name);
	const [subject_info_editing, setSubjectInfoValue] = useState(subject_info);
	const [message_info_editing, setMessageInfoValue] = useState(message_info);
	const [subject_ret_editing, setSubjectRetValue] = useState(subject_ret);
	const [message_ret_editing, setMessageRetValue] = useState(message_ret);

	return (
		<>
			<InspectorControls group="settings">
				<PanelBody title={__("Inquiry information notification email", 'itmar_form_send_blocks')} initialOpen={true} className="mailinfo_ctrl">
					<PanelRow>
						<TextControl
							label={__("Notification email address (Master)", 'itmar_form_send_blocks')}
							value={master_mail_editing}
							onChange={(newVal) => setMasterMailValue(newVal)}// 一時的な編集値として保存する
							onBlur={() => {
								//メールバリデーションチェック
								if (master_mail_editing.length == 0 || !mail_pattern.test(master_mail_editing)) {
									dispatch('core/notices').createNotice(
										'error',
										__('The notification email address is blank or has an invalid format. ', 'itmar_form_send_blocks'),
										{ type: 'snackbar', isDismissible: true, }
									);
									// バリデーションエラーがある場合、編集値を元の値にリセットする
									setMasterMailValue(master_mail);
								} else {
									// バリデーションが成功した場合、編集値を確定する
									setAttributes({ master_mail: master_mail_editing });
								}
							}}
						/>
					</PanelRow>
					<PanelRow>
						<TextControl
							label={__("Master Name", 'itmar_form_send_blocks')}
							value={master_name_editing}
							onChange={(newVal) => setMasterNameValue(newVal)}// 一時的な編集値として保存する
							onBlur={() => {
								if (master_name_editing.length == 0) {
									dispatch('core/notices').createNotice(
										'error',
										__('Do not leave the master name blank. ', 'itmar_form_send_blocks'),
										{ type: 'snackbar', isDismissible: true, }
									);
									// バリデーションエラーがある場合、編集値を元の値にリセットする
									setMasterNameValue(master_name);
								} else {
									// バリデーションが成功した場合、編集値を確定する
									setAttributes({ master_name: master_name_editing });
								}
							}}
						/>
					</PanelRow>
					<PanelRow>
						<TextControl
							label={__("Notification email subject", 'itmar_form_send_blocks')}
							value={subject_info_editing}
							onChange={(newVal) => setSubjectInfoValue(newVal)}// 一時的な編集値として保存する
							onBlur={() => {
								if (subject_info_editing.length == 0) {
									dispatch('core/notices').createNotice(
										'error',
										__('Do not leave the subject of the notification email blank. ', 'itmar_form_send_blocks'),
										{ type: 'snackbar', isDismissible: true, }
									);
									// バリデーションエラーがある場合、編集値を元の値にリセットする
									setSubjectInfoValue(subject_info);
								} else {
									// バリデーションが成功した場合、編集値を確定する
									setAttributes({ subject_info: subject_info_editing });
								}
							}}
						/>
					</PanelRow>
					<PanelRow>
						<TextareaControl
							label={__("Notification email body", 'itmar_form_send_blocks')}
							value={message_info_editing}
							onChange={(newVal) => setMessageInfoValue(newVal)}// 一時的な編集値として保存する
							onBlur={() => {
								if (message_info_editing.length == 0) {
									dispatch('core/notices').createNotice(
										'error',
										__('Do not leave the body of the notification email blank. ', 'itmar_form_send_blocks'),
										{ type: 'snackbar', isDismissible: true, }
									);
									// バリデーションエラーがある場合、編集値を元の値にリセットする
									setMessageInfoValue(message_info);
								} else {
									// バリデーションが成功した場合、編集値を確定する
									setAttributes({ message_info: message_info_editing });
								}
							}}
							rows="5"
							help={__("Click the input item displayed below to quote it in the text.", 'itmar_form_send_blocks')}
						/>
					</PanelRow>
					{inputInnerBlocks.filter(block => block.name !== 'itmar/design-checkbox' && block.name !== 'itmar/design-button').map((input_elm, index) => {
						const actions = [
							{
								label: '👆',
								onClick: () => {
									const newVal = `${message_info}[${input_elm.attributes.inputName}]`
									setMessageInfoValue(newVal)
									setAttributes({ message_info: newVal })
								}
							},
						];
						return (
							<Notice key={index} actions={actions} isDismissible={false}>
								<p>{input_elm.attributes.labelContent}</p>
							</Notice>
						);
					})}
				</PanelBody>
				<PanelBody title={__("Automatic response email", 'itmar_form_send_blocks')} initialOpen={true} className="mailinfo_ctrl">
					<PanelRow>
						<ToggleControl
							label={__('Send automatic response email', 'itmar_form_send_blocks')}
							checked={is_retmail}
							onChange={(newVal) => setAttributes({ is_retmail: newVal })}
						/>

					</PanelRow>
					{is_retmail &&
						<>
							<PanelRow>
								<TextControl
									label={__("Reply to email address", 'itmar_form_send_blocks')}
									value={ret_mail}
									isPressEnterToChange
									onChange={(newVal) => setAttributes({ ret_mail: newVal })}
									help={__("Click on the email address displayed below to set the response destination.", 'itmar_form_send_blocks')}
								/>
							</PanelRow>
							{inputInnerBlocks.filter(block => block.name !== 'itmar/design-checkbox' && block.name !== 'itmar/design-button').map((input_elm, index) => {
								if (input_elm.attributes.inputType === 'email') {
									const actions = [
										{
											label: '👆',
											onClick: () => {
												setAttributes({ ret_mail: input_elm.attributes.inputName })
											}
										},
									];
									return (
										<Notice key={index} actions={actions} isDismissible={false}>
											<p>{input_elm.attributes.labelContent}</p>
										</Notice>
									);
								}
							})}
							<PanelRow>
								<TextControl
									label={__("Automatic response email title", 'itmar_form_send_blocks')}
									value={subject_ret_editing}
									onChange={(newVal) => setSubjectRetValue(newVal)}// 一時的な編集値として保存する
									onBlur={() => {
										if (subject_ret_editing.length == 0) {
											dispatch('core/notices').createNotice(
												'error',
												__('Do not leave the subject of the notification email blank. ', 'itmar_form_send_blocks'),
												{ type: 'snackbar', isDismissible: true, }
											);
											// バリデーションエラーがある場合、編集値を元の値にリセットする
											setSubjectRetValue(subject_ret);
										} else {
											// バリデーションが成功した場合、編集値を確定する
											setAttributes({ subject_ret: subject_ret_editing });
										}
									}}
								/>
							</PanelRow>
							<PanelRow>
								<TextareaControl
									label={__("Automatic response email body", 'itmar_form_send_blocks')}
									value={message_ret_editing}
									onChange={(newVal) => setMessageRetValue(newVal)}// 一時的な編集値として保存する
									onBlur={() => {
										if (message_ret_editing.length == 0) {
											dispatch('core/notices').createNotice(
												'error',
												__('Do not leave the subject of the notification email blank. ', 'itmar_form_send_blocks'),
												{ type: 'snackbar', isDismissible: true, }
											);
											// バリデーションエラーがある場合、編集値を元の値にリセットする
											setMessageRetValue(message_info);
										} else {
											// バリデーションが成功した場合、編集値を確定する
											setAttributes({ message_ret: message_ret_editing });
										}
									}}
									rows="5"
									help={__("Click on the input field below to quote it in the text.", 'itmar_form_send_blocks')}
								/>
							</PanelRow>
							{inputInnerBlocks.filter(block => block.name !== 'itmar/design-checkbox' && block.name !== 'itmar/design-button').map((input_elm, index) => {

								const actions = [
									{
										label: '👆',
										onClick: () => {
											const newVal = `${message_ret}[${input_elm.attributes.inputName}]`
											setMessageRetValue(newVal)
											setAttributes({ message_ret: newVal })
										}
									},
								];
								return (
									<Notice key={index} actions={actions} isDismissible={false}>
										<p>{input_elm.attributes.labelContent}</p>
									</Notice>
								);
							})}
							<PanelRow>
								<ToggleControl
									label={__('Save response contents to DB', 'itmar_form_send_blocks')}
									checked={is_dataSave}
									onChange={(newVal) => setAttributes({ is_dataSave: newVal })}
								/>

							</PanelRow>
						</>
					}
				</PanelBody>

			</InspectorControls>

			<InspectorControls group="styles">
				<PanelBody title={__("Space settings", 'itmar_form_send_blocks')} initialOpen={true} className="form_design_ctrl">
					<BoxControl
						label={!isMobile ?
							__("Margin settings(desk top)", 'itmar_form_send_blocks')
							: __("Margin settings(mobile)", 'itmar_form_send_blocks')
						}
						values={!isMobile ? default_pos.margin_value : mobile_pos.margin_value}
						onChange={value => {
							if (!isMobile) {
								setAttributes({ default_pos: { ...default_pos, margin_value: value } });
							} else {
								setAttributes({ mobile_pos: { ...mobile_pos, margin_value: value } });
							}
						}}
						units={units}	// 許可する単位
						allowReset={true}	// リセットの可否
						resetValues={padding_resetValues}	// リセット時の値

					/>
					<BoxControl
						label={!isMobile ?
							__("Padding settings(desk top)", 'itmar_form_send_blocks')
							: __("Padding settings(mobile)", 'itmar_form_send_blocks')
						}
						values={!isMobile ? default_pos.padding_value : mobile_pos.padding_value}
						onChange={value => {
							if (!isMobile) {
								setAttributes({ default_pos: { ...default_pos, padding_value: value } })
							} else {
								setAttributes({ mobile_pos: { ...mobile_pos, padding_value: value } })
							}
						}}
						units={units}	// 許可する単位
						allowReset={true}	// リセットの可否
						resetValues={padding_resetValues}	// リセット時の値

					/>

				</PanelBody>
				<PanelBody title={__("Shadow settings", 'itmar_form_send_blocks')} initialOpen={true} className="form_design_ctrl">
					<ToggleControl
						label={__('Is Shadow', 'itmar_form_send_blocks')}
						checked={is_shadow}
						onChange={(newVal) => {
							setAttributes({ is_shadow: newVal })
						}}
					/>
					{is_shadow &&
						<ShadowStyle
							shadowStyle={{ ...shadow_element }}
							onChange={(newStyle, newState) => {
								setAttributes({ shadow_result: newStyle.style });
								setAttributes({ shadow_element: newState })
							}}
						/>
					}
				</PanelBody>

			</InspectorControls>

			<div {...blockProps}>
				<StyleComp attributes={attributes}>
					<div {...innerBlocksProps}></div>
				</StyleComp>
			</div>

		</>
	);
}
