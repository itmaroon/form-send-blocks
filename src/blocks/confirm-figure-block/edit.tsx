import { __ } from "@wordpress/i18n";
import "./editor.scss";
import { useSelect, useDispatch } from "@wordpress/data";
import { store as blockEditorStore } from "@wordpress/block-editor";
import { useEffect, useRef, useState } from "@wordpress/element";
import { StyleComp } from "./StyleConfirmFigure";
//import { useStyleIframe } from "../iframeFooks";
import {
	useElementBackgroundColor,
	useIsIframeMobile,
	ShadowStyle,
	ShadowElm,
	ShadowState,
	flattenBlocks,
	useStyleIframe,
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
	ToggleControl,
	TextControl,
	ComboboxControl,
	BoxControl,
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
		is_shadow,
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
		const filteredBlocks = inputFigureInnerBlocks.filter(
			(block) =>
				block.name !== "itmar/design-checkbox" &&
				block.name !== "itmar/design-group" &&
				block.name !== "itmar/design-button",
		);
		return filteredBlocks.map((input_elm) => {
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

			return {
				cells: [
					{
						content: input_elm.attributes.labelContent,
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
			const tableSource = cellObjectsForm(block.innerBlocks || []);

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

	//Submitによるプロセス変更
	const handleSubmit = (e: any) => {
		e.preventDefault();
		const click_id = e.nativeEvent.submitter.dataset.key;
		// 親ブロックのstate_process属性を更新
		if (click_id === "foword_id") {
			updateBlockAttributes(parentClientId, {
				current_step: currentStep + 1,
			});
		} else if (click_id === "back_id") {
			updateBlockAttributes(parentClientId, {
				current_step: currentStep - 1,
			});
		}
	};

	//モバイルの判定
	const isMobile = useIsIframeMobile();

	//ブロックの参照
	const blockRef = useRef(null);
	//ルート要素にスタイルとクラスを付加
	const blockProps = useBlockProps({
		ref: blockRef, // ここで参照を blockProps に渡しています
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

	//サイトエディタの場合はiframeにスタイルをわたす。
	const styledEditorContent = useStyleIframe(StyleComp, attributes);
	return (
		<>
			<InspectorControls group="settings">
				<PanelBody title={__("Step-Table Mapping", "itmar")}>
					{inputFigureBlocks.map((block: BlockInstance, index: number) => {
						const attrs = block.attributes as { form_name: string };
						// 現在このブロックに紐付いているテーブルIDを探す
						const currentMapping = blockTableMapping.find(
							(m) => m.blockId === attrs.form_name,
						);

						return (
							<ComboboxControl
								key={block.clientId}
								label={`Step ${index + 1}: ${
									block.attributes.form_name || "No Name"
								}`}
								value={currentMapping?.tableId}
								options={tableOption}
								onChange={(newTableId) =>
									updateMapping(block.attributes.form_name, newTableId || "")
								}
								help={__("Select which table this step outputs to.", "itmar")}
							/>
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
				{styledEditorContent}
				<StyleComp attributes={attributes}>
					<form onSubmit={handleSubmit}>
						<div {...innerBlocksProps}></div>
					</form>
				</StyleComp>
			</div>
		</>
	);
}
