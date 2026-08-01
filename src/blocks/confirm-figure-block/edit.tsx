import { __ } from "@wordpress/i18n";
import "./editor.scss";
import { useSelect, useDispatch } from "@wordpress/data";
import { store as blockEditorStore } from "@wordpress/block-editor";
import {
	useEffect,
	useRef,
	useState,
	useMemo,
} from "@wordpress/element";
import { createConfirmFigureStyleCss } from "./StyleConfirmFigure";
import { usePreventEditorFormSubmit } from "../front_common";
import {
	useElementBackgroundColor,
	useIsIframeMobile,
	ShadowStyle,
	ShadowElm,
	ShadowState,
	flattenBlocks,
} from "itmar-block-packages";
import {
	useBlockProps,
	useInnerBlocksProps,
	InspectorControls,
	__experimentalPanelColorGradientSettings as PanelColorGradientSettings,
	__experimentalBorderRadiusControl as BorderRadiusControl,
} from "@wordpress/block-editor";
import {
	BlockEditProps,
	BlockInstance,
	TemplateArray,
} from "@wordpress/blocks";
import {
	PanelBody,
	PanelRow,
	ToggleControl,
	TextControl,
	TextareaControl,
	ComboboxControl,
	BoxControl,
	Notice,
	BorderBoxControl,
} from "@wordpress/components";

import type { Attributes } from "./type";

//スペースのリセットバリュー
const padding_resetValues = {
	top: "10px",
	left: "10px",
	right: "10px",
	bottom: "10px",
};

//ボーダーのリセットバリュー
const border_resetValues = {
	top: "0px",
	left: "0px",
	right: "0px",
	bottom: "0px",
};

const units = [
	{ value: "px", label: "px" },
	{ value: "em", label: "em" },
	{ value: "rem", label: "rem" },
];

export default function Edit({
	attributes,
	setAttributes,
	context,
	clientId,
}: BlockEditProps<Attributes>) {
	const {
		bgColor,
		bgColor_form,
		bgGradient_form,
		radius_form,
		border_form,
		default_pos,
		mobile_pos,
		stage_info,
		blockTableMapping,
		displayMapping,
		is_shadow,
		isSendPause,
	} = attributes;
	const shadow_element = attributes.shadow_element as ShadowState;

	//親のcontextから今のステップ数を取得
	const currentStep = context["itmar/current_step"] as number;
	//ブロックの背景色
	const blockStyle = { background: bgColor };

	// dispatch関数を取得
	const { updateBlockAttributes } = useDispatch("core/block-editor");
	//他のブロック情報の取得
	const {
		parentClientId,
		thisBlockIndex,
		inputFigureBlocks,
		tableBlocks,
		tableOption,
		attentionBlocksOption,
		tableDataFormStates,
	} = useSelect(
		(select) => {
			const { getBlockRootClientId, getBlocks } = select(
				blockEditorStore,
			) as any;
			// 親ブロックのclientIdを取得
			const parentClientId = getBlockRootClientId(clientId);

			// まず直下のブロックを取得
			const rootInnerBlocks = getBlocks(clientId) || [];

			// 「孫」まで平坦化
			// topBlockAttributesなどで使っていたロジックと同じです
			const flatBlocks = flattenBlocks(rootInnerBlocks);

			// 兄弟ブロックを取得
			const siblings = getBlocks(parentClientId);

			//兄弟のfigure-blockを取得し、その順番を返す
			const figureBlockSiblings = siblings.filter((block: BlockInstance) =>
				block.name.includes("figure-block"),
			);
			const index = figureBlockSiblings.findIndex(
				(block: BlockInstance) => block.clientId === clientId,
			);

			const inputFigureBlocks = siblings.filter(
				(block: BlockInstance) => block.name === "itmar/input-figure-block",
			);

			//テーブル属性の取得・初期化
			const tableBlocks = flatBlocks.filter(
				(block) => block.name === "itmar/design-table",
			);
			//テーブル選択用のオプションを生成
			const tableOption = tableBlocks
				.filter((block) => block.attributes && block.attributes.defineID) // IDがあるものだけ抽出
				.map((block) => ({
					value: block.attributes.defineID,
					label: block.attributes.defineID,
				}));
			//注意書きtitleブロックの選択オプション
			const attentionBlocksOption = flatBlocks
				.filter(
					(block: BlockInstance) =>
						block.name === "itmar/design-title" && block.attributes.uniqueID,
				)
				.map((block) => ({
					value: block.attributes.uniqueID,
					label: block.attributes.uniqueID,
				}));

			// tableBlocks の中身（属性）の変化を監視するための値を生成 ---
			const tableDataFormStates = JSON.stringify(
				tableBlocks.map((block) => ({
					clientId: block.clientId,
					isDataForm: block.attributes.is_data_form,
				})),
			);

			return {
				parentClientId: parentClientId,
				thisBlockIndex: index,
				inputFigureBlocks: inputFigureBlocks,
				tableBlocks: tableBlocks,
				tableOption: tableOption,
				attentionBlocksOption: attentionBlocksOption,
				tableDataFormStates: tableDataFormStates,
			};
		},
		[clientId],
	);

	// 紐付けを更新する関数
	const updateMapping = (blockId: string, tableId: string) => {
		// 既存のリストから、該当ブロックの古いデータを消して新しいデータを追加
		const newMapping = [
			...blockTableMapping.filter((item) => item.blockId !== blockId),
			{ blockId, tableId },
		];
		setAttributes({ blockTableMapping: newMapping });
	};

	// セル要素を生成する関数
	interface SelectOption {
		id: string | number;
		label: string;
	}
	const cellObjectsForm = (inputFigureInnerBlocks: BlockInstance[]) => {
		//'itmar/design-checkbox''itmar/design-button'を除外
		return inputFigureInnerBlocks.map((input_elm) => {
			//design-selectで選択された要素を抽出
			const sel_content = input_elm.attributes.selectValues
				? input_elm.attributes.selectValues.filter((obj: SelectOption) =>
						input_elm.attributes.selectedValues.includes(obj.id),
				  )
				: undefined;
			//選択された要素をカンマ区切りの文字列にして、input要素と選択
			const content_td = sel_content
				? sel_content.map((obj: SelectOption) => obj.label).join(", ")
				: input_elm.attributes.inputValue;

			const message_label =
				input_elm.name === "itmar/design-title"
					? input_elm.attributes.headingContent
					: input_elm.name === "itmar/design-text-ctrl" ||
					  input_elm.name === "itmar/design-checkbox"
					? input_elm.attributes.labelContent
					: "";

			return {
				cells: [
					{
						content: message_label,
						tag: "th",
					},
					{
						content: content_td,
						tag: "td",
					},
				],
			};
		});
	};

	//入力フォームのデータを取得
	const [dataSources, setdataSources] = useState([]);
	useEffect(() => {
		// 1. 現在エディタ上に実在する input-figure-block の form_name リストを作成
		const existingFormNames = inputFigureBlocks
			.map((block: BlockInstance) => block.attributes.form_name)
			.filter(Boolean); // 空のものは除外

		// 2. 保存されているマッピングのうち、実在する名前のものだけに絞り込む
		const cleanedMapping = blockTableMapping.filter((mapping) =>
			existingFormNames.includes(mapping.blockId),
		);

		// 3. もし数が合わない（＝削除されたデータがある）場合のみ、属性を更新する
		// 無条件に setAttributes すると無限ループになるため、長さの比較が重要です
		if (cleanedMapping.length !== blockTableMapping.length) {
			setAttributes({ blockTableMapping: cleanedMapping });
		}

		// 1. 各 input-figure-block ごとにデータを整形して配列を作成
		const newDataSources = inputFigureBlocks.map((block: BlockInstance) => {
			const stepFormName = block.attributes.form_name;

			// blockTableMapping から、このステップに紐付いているテーブルIDを探す
			const mapping = blockTableMapping.find((m) => m.blockId === stepFormName);
			const targetTableId = mapping ? mapping.tableId : null;

			// このブロック自身のインナーブロックを抽出して tableSource を生成
			// (cellObjectsForm は個別のブロックの innerBlocks を引数に取ると想定)
			const allInnerBlocks = flattenBlocks(block.innerBlocks || []);
			const inputInnerBlocks = allInnerBlocks.filter(
				(block: BlockInstance) =>
					//block.name !== "itmar/design-checkbox" &&
					block.name !== "itmar/design-button" &&
					block.name !== "itmar/design-group" &&
					(block.name !== "itmar/design-title" || block.attributes.uniqueID),
			);

			const tableSource = cellObjectsForm(inputInnerBlocks || []);

			// テーブルIDとソースデータを紐付けたオブジェクトを返す
			return {
				tableId: targetTableId, // どのテーブルに流すか
				source: tableSource, // フォームの入力データ構造
				stepId: stepFormName, // デバッグ・管理用のステップ名
			};
		});

		// 2. まとめて state に格納
		setdataSources(newDataSources);
	}, [inputFigureBlocks, blockTableMapping]);

	// useRef の初期値をオブジェクトにする
	interface LastInjection {
		data: string;
		formState: string;
	}
	const lastInjectionRef = useRef<LastInjection | null>(null);
	useEffect(() => {
		// 1. 注入するデータがあるかチェック
		if (!dataSources || dataSources.length === 0) return;

		// 2. 無限ループガード用の文字列化
		const currentDataStr = JSON.stringify(dataSources);

		// 3. 【重要】全データが前回と全く同じなら何もしない
		// ※ 複数のテーブルを扱うため、比較対象はデータ全体（currentDataStr,tableDataFormStates）のみでOKです
		if (
			lastInjectionRef.current?.data === currentDataStr &&
			lastInjectionRef.current?.formState === tableDataFormStates
		)
			return;

		// 4. dataSources をループして、それぞれのターゲットテーブルに注入
		dataSources.forEach((item) => {
			const { tableId, source } = item;

			// 紐付け先のテーブルID（ユーザー定義のdefineID）が設定されていない場合はスキップ
			if (!tableId || !source) return;

			// エディタ内の全ブロックから、その defineID を持つ実際のテーブルブロックを探す
			// (useSelect で取得済みの tableBlocks を利用します)
			const targetBlock = tableBlocks.find(
				(block) => block.attributes?.defineID === tableId,
			);

			if (targetBlock?.clientId) {
				if (targetBlock.attributes.is_data_form) {
					//出力対象のテーブルが動的データ受け入れモードか
					updateBlockAttributes(targetBlock.clientId, {
						tableLayout: "fixed",
						tableSource: source, // このステップ専用のソースを注入
					});
				}
			}
		});

		// 5. 今回の「注入済みセット」を保存（再発火防止）
		lastInjectionRef.current = {
			data: currentDataStr,
			formState: tableDataFormStates,
		};
	}, [dataSources, tableBlocks, tableDataFormStates, updateBlockAttributes]);
	//インナーブロックのテンプレートを初期化
	const orgTemplate: TemplateArray = [];

	//インナーブロックのひな型を作る
	const innerBlocksProps = useInnerBlocksProps(
		{},
		{
			//allowedBlocks: ['itmar/input-figure-block'],
			template: orgTemplate,
			templateLock: false,
		},
	);

	//フォームをサブミットする処理をOnSubmitより早く処理する
	const formRef = usePreventEditorFormSubmit({
		parentClientId,
		currentStep,
		updateBlockAttributes,
	});

	//モバイルの判定
	const isMobile = useIsIframeMobile();

	//ブロックの参照
	const blockRef = useRef(null);
	const editorStyleClass = `itmar-confirm-editor-${clientId.replace(
		/[^a-zA-Z0-9_-]/g,
		"",
	)}`;
	const editorStyleCss = createConfirmFigureStyleCss(
		attributes,
		`.${editorStyleClass}`,
	);
	//ルート要素にスタイルとクラスを付加
	const blockProps = useBlockProps({
		ref: blockRef,
		style: blockStyle,
		className: `figure_fieldset ${
			//context["itmar/state_process"] === "confirm" ? "appear" : ""
			context["itmar/current_step"] === thisBlockIndex ? "appear" : ""
		}`,
	});

	//背景色の取得
	const baseColor = useElementBackgroundColor(blockRef, blockProps.style);

	//背景色変更によるシャドー属性の書き換え
	useEffect(() => {
		if (baseColor) {
			setAttributes({
				shadow_element: { ...shadow_element, baseColor: baseColor },
			});
			const new_shadow = ShadowElm({ ...shadow_element, baseColor: baseColor });
			if (new_shadow) {
				setAttributes({ shadow_result: new_shadow.style });
			}
		}
	}, [baseColor]);

	//メール文書編成用のNoticeを返す関数
	const createMailNotice = (
		input_elm: BlockInstance,
		index: number,
		targetMessage: string,
		targetButton: string,
		targetAttributeKey: string,
	) => {
		const message_value =
			input_elm.name === "itmar/design-title"
				? input_elm.attributes.uniqueID
				: input_elm.name === "itmar/design-text-ctrl" ||
				  input_elm.name === "itmar/design-checkbox"
				? input_elm.attributes.inputName
				: "";
		const message_label =
			input_elm.name === "itmar/design-title"
				? input_elm.attributes.headingContent
				: input_elm.name === "itmar/design-text-ctrl" ||
				  input_elm.name === "itmar/design-checkbox"
				? input_elm.attributes.labelContent
				: "";
		const actions = [
			{
				label: "👆",
				onClick: () => {
					const newVal = `${targetMessage ?? ""}[${message_value ?? ""}]`;
					setAttributes({
						displayMapping: {
							...displayMapping,
							[targetButton]: {
								...(displayMapping?.[targetButton] || {}),
								[targetAttributeKey]: newVal,
							},
						},
					});
				},
			},
		];
		return (
			<Notice key={index} actions={actions} isDismissible={false}>
				<p>{message_label}</p>
			</Notice>
		);
	};

	//ボタンに割り当てるインナーブロック
	const inputBlocksByButtonKey: Record<string, BlockInstance[]> =
		useMemo(() => {
			const result: Record<string, BlockInstance[]> = {};
			let accumulatedInputBlocks: BlockInstance[] = [];

			inputFigureBlocks.forEach((figureBlock: BlockInstance) => {
				const allInnerBlocks = flattenBlocks(figureBlock.innerBlocks || []);

				const buttonBlocks = allInnerBlocks.filter(
					(innerBlock: BlockInstance) =>
						innerBlock.name === "itmar/design-button" &&
						innerBlock.attributes?.buttonKey,
				);

				const inputInnerBlocks = allInnerBlocks.filter(
					(innerBlock: BlockInstance) =>
						innerBlock.name !== "itmar/design-button" &&
						innerBlock.name !== "itmar/design-group" &&
						(innerBlock.name !== "itmar/design-title" ||
							innerBlock.attributes.uniqueID),
				);

				const currentInputBlocks = [
					...accumulatedInputBlocks,
					...inputInnerBlocks,
				];

				if (buttonBlocks.length > 0) {
					buttonBlocks.forEach((buttonBlock: BlockInstance) => {
						const buttonKey = buttonBlock.attributes.buttonKey;

						if (buttonKey) {
							result[buttonKey] = currentInputBlocks;
						}
					});

					accumulatedInputBlocks = [];
					return;
				}

				accumulatedInputBlocks = currentInputBlocks;
			});

			return result;
		}, [inputFigureBlocks]);

	return (
		<>
			<InspectorControls group="settings">
				<PanelBody title={__("Input Figure Mapping", "itmar")}>
					{inputFigureBlocks.map((block: BlockInstance) => {
						const attrs = block.attributes as { form_name: string };
						// 現在このブロックに紐付いているテーブルIDを探す
						const currentMapping = blockTableMapping.find(
							(m) => m.blockId === attrs.form_name,
						);

						//インプットフィギュアごとにデザインボタンブロックを取得（buttonKeyを持つもの）
						const buttonBlocks = flattenBlocks(block.innerBlocks || []).filter(
							(fb) =>
								fb.name === "itmar/design-button" && fb.attributes?.buttonKey,
						);

						return (
							<div key={block.clientId}>
								<ComboboxControl
									label={block.attributes.form_name || "No Name"}
									value={currentMapping?.tableId}
									options={tableOption}
									onChange={(newTableId) =>
										updateMapping(block.attributes.form_name, newTableId || "")
									}
									help={__(
										"Select which table this figure outputs to.",
										"form-send-blocks",
									)}
								/>

								{buttonBlocks.map((btnBlock: BlockInstance) => {
									const buttonKey = btnBlock.attributes.buttonKey;
									const currentObj = displayMapping?.[buttonKey];

									const inputMessageBlocks = buttonKey
										? inputBlocksByButtonKey[buttonKey] || []
										: [];
									return (
										<PanelBody
											title={`${btnBlock.attributes.buttonKey || ""} ${__(
												"Button Mapping",
												"form-send-blocks",
											)}`}
											initialOpen={false}
										>
											<TextControl
												key={btnBlock.clientId}
												label={__("Confirm Button Label", "form-send-blocks")}
												value={currentObj?.button_label || ""}
												onChange={(newVal) => {
													if (buttonKey) {
														setAttributes({
															displayMapping: {
																...displayMapping,
																[buttonKey]: {
																	...(displayMapping?.[buttonKey] || {}),
																	button_label: newVal,
																},
															},
														});
													}
												}}
											/>
											<TextControl
												key={btnBlock.clientId}
												label={__(
													"Confirm Attention Message",
													"form-send-blocks",
												)}
												value={currentObj?.attention_mess || ""}
												onChange={(newVal) => {
													if (buttonKey) {
														setAttributes({
															displayMapping: {
																...displayMapping,
																[buttonKey]: {
																	...(displayMapping?.[buttonKey] || {}),
																	attention_mess: newVal,
																},
															},
														});
													}
												}}
											/>
											<ComboboxControl
												label={__("Attention Display ID", "form-send-blocks")}
												value={currentObj?.attention_Id || ""}
												options={attentionBlocksOption}
												onChange={(newVal) => {
													if (buttonKey) {
														setAttributes({
															displayMapping: {
																...displayMapping,
																[buttonKey]: {
																	...(displayMapping?.[buttonKey] || {}),
																	attention_Id: newVal,
																},
															},
														});
													}
												}}
											/>
											<PanelBody
												title={__(
													"Inquiry information notification email Content",
													"form-send-blocks",
												)}
												initialOpen={true}
												className="mailinfo_ctrl"
											>
												<PanelRow>
													<TextControl
														label={__(
															"Notification email subject",
															"form-send-blocks",
														)}
														value={currentObj?.notice_subject || ""}
														onChange={(newVal) => {
															if (buttonKey) {
																setAttributes({
																	displayMapping: {
																		...displayMapping,
																		[buttonKey]: {
																			...(displayMapping?.[buttonKey] || {}),
																			notice_subject: newVal,
																		},
																	},
																});
															}
														}} // 一時的な編集値として保存する
													/>
												</PanelRow>
												<PanelRow>
													<TextareaControl
														label={__(
															"Notification email body",
															"form-send-blocks",
														)}
														value={currentObj?.notice_content || ""}
														onChange={(newVal) => {
															if (buttonKey) {
																setAttributes({
																	displayMapping: {
																		...displayMapping,
																		[buttonKey]: {
																			...(displayMapping?.[buttonKey] || {}),
																			notice_content: newVal,
																		},
																	},
																});
															}
														}} // 一時的な編集値として保存する
														rows={5}
													/>
												</PanelRow>
												{inputMessageBlocks.map(
													(input_elm: BlockInstance, index: number) =>
														createMailNotice(
															input_elm,
															index,
															currentObj?.notice_content || "",
															buttonKey,
															"notice_content",
														),
												)}
											</PanelBody>
											<PanelBody
												title={__(
													"Automatic response email Content",
													"form-send-blocks",
												)}
												initialOpen={true}
												className="mailinfo_ctrl"
											>
												<PanelRow>
													<TextControl
														label={__(
															"Automatic response email title",
															"form-send-blocks",
														)}
														value={currentObj?.response_subject || ""}
														onChange={(newVal) => {
															if (buttonKey) {
																setAttributes({
																	displayMapping: {
																		...displayMapping,
																		[buttonKey]: {
																			...(displayMapping?.[buttonKey] || {}),
																			response_subject: newVal,
																		},
																	},
																});
															}
														}} // 一時的な編集値として保存する
													/>
												</PanelRow>
												<PanelRow>
													<TextareaControl
														label={__(
															"Automatic response email body",
															"form-send-blocks",
														)}
														value={currentObj?.response_content || ""}
														onChange={(newVal) => {
															if (buttonKey) {
																setAttributes({
																	displayMapping: {
																		...displayMapping,
																		[buttonKey]: {
																			...(displayMapping?.[buttonKey] || {}),
																			response_content: newVal,
																		},
																	},
																});
															}
														}} // 一時的な編集値として保存する
														rows={5}
														help={__(
															"Click on the input field below to quote it in the text.",
															"form-send-blocks",
														)}
													/>
												</PanelRow>
												{inputMessageBlocks.map(
													(input_elm: BlockInstance, index: number) =>
														createMailNotice(
															input_elm,
															index,
															currentObj?.response_content || "",
															buttonKey,
															"response_content",
														),
												)}
											</PanelBody>
										</PanelBody>
									);
								})}
							</div>
						);
					})}
				</PanelBody>
				<PanelBody
					title={__(
						"Confirmation form information setting",
						"form-send-blocks",
					)}
					initialOpen={true}
					className="form_setteing_ctrl"
				>
					<TextControl
						label={__("Stage information", "form-send-blocks")}
						value={stage_info}
						help={__(
							"Please enter the stage information to be displayed in the process area.",
							"form-send-blocks",
						)}
						onChange={(newVal) => setAttributes({ stage_info: newVal })}
					/>
				</PanelBody>
				<PanelBody
					title={__("Pause Mail Send", "form-send-blocks")}
					initialOpen={true}
					className="form_setteing_ctrl"
				>
					<ToggleControl
						label={__("Is Pause Send", "form-send-blocks")}
						checked={isSendPause}
						onChange={(newVal) => {
							setAttributes({ isSendPause: newVal });
						}}
					/>
				</PanelBody>
			</InspectorControls>
			<InspectorControls group="styles">
				<PanelBody
					title={__("Global settings", "form-send-blocks")}
					initialOpen={true}
					className="form_design_ctrl"
				>
					<PanelColorGradientSettings
						title={__("Background Color Setting", "form-send-blocks")}
						settings={[
							{
								colorValue: bgColor,
								label: __("Choose Block Background color", "form-send-blocks"),
								onColorChange: (newValue?: string) =>
									setAttributes({ bgColor: newValue }),
							},
							{
								colorValue: bgColor_form,
								gradientValue: bgGradient_form,

								label: __("Choose Form Background color", "form-send-blocks"),
								onColorChange: (newValue?: string) =>
									setAttributes({
										bgColor_form: newValue === undefined ? "" : newValue,
									}),
								onGradientChange: (newValue?: string) =>
									setAttributes({ bgGradient_form: newValue }),
							},
						]}
					/>
					<PanelBody
						title={__("Border Settings", "form-send-blocks")}
						initialOpen={false}
						className="border_design_ctrl"
					>
						<BorderBoxControl
							onChange={(newValue) => setAttributes({ border_form: newValue })}
							value={border_form}
							allowReset={true} // リセットの可否
							resetValues={border_resetValues} // リセット時の値
						/>
						<BorderRadiusControl
							values={radius_form}
							onChange={(newBrVal: any) =>
								setAttributes({
									radius_form:
										typeof newBrVal === "string"
											? { value: newBrVal }
											: newBrVal,
								})
							}
						/>
					</PanelBody>
					<BoxControl
						label={
							!isMobile
								? __("Margin settings(desk top)", "form-send-blocks")
								: __("Margin settings(mobile)", "form-send-blocks")
						}
						values={
							!isMobile ? default_pos.margin_form : mobile_pos.margin_form
						}
						onChange={(value) => {
							if (!isMobile) {
								setAttributes({
									default_pos: { ...default_pos, margin_form: value },
								});
							} else {
								setAttributes({
									mobile_pos: { ...mobile_pos, margin_form: value },
								});
							}
						}}
						units={units} // 許可する単位
						allowReset={true} // リセットの可否
						resetValues={padding_resetValues} // リセット時の値
					/>
					<BoxControl
						label={
							!isMobile
								? __("Padding settings(desk top)", "form-send-blocks")
								: __("Padding settings(mobile)", "form-send-blocks")
						}
						values={
							!isMobile ? default_pos.padding_form : mobile_pos.padding_form
						}
						onChange={(value) => {
							if (!isMobile) {
								setAttributes({
									default_pos: { ...default_pos, padding_form: value },
								});
							} else {
								setAttributes({
									mobile_pos: { ...mobile_pos, padding_form: value },
								});
							}
						}}
						units={units} // 許可する単位
						allowReset={true} // リセットの可否
						resetValues={padding_resetValues} // リセット時の値
					/>
					<ToggleControl
						label={__("Is Shadow", "form-send-blocks")}
						checked={is_shadow}
						onChange={(newVal) => {
							setAttributes({ is_shadow: newVal });
						}}
					/>
					{is_shadow && (
						<ShadowStyle
							shadowStyle={{ ...shadow_element }}
							onChange={(newStyle, newState) => {
								setAttributes({ shadow_result: newStyle.style });
								setAttributes({ shadow_element: newState });
							}}
						/>
					)}
				</PanelBody>
			</InspectorControls>

			<div {...blockProps}>
				<style>{editorStyleCss}</style>
				<div className={`itmar-wrap ${editorStyleClass}`}>
					<form ref={formRef}>
						<div {...innerBlocksProps}></div>
					</form>
				</div>
			</div>
		</>
	);
}
