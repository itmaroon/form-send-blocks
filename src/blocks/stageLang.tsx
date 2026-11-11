import * as React from "react";
import { useEffect, useRef } from "@wordpress/element";
import { useDispatch } from "@wordpress/data";
import apiFetch from "@wordpress/api-fetch";
import { __ } from "@wordpress/i18n";
import { BlockControls } from "@wordpress/block-editor";
import {
	TextControl,
	TextareaControl,
	ToolbarButton,
	ToolbarGroup,
	ToolbarDropdownMenu,
} from "@wordpress/components";

/**
 * 進行バー（design-process）に出す段階の名前 stage_info を、言語ごとに持つための部品。
 *
 * stage_info は、文字列か、言語コードをキーにした文字列のオブジェクト（{JP:"…", EN:"…"}）。
 * 文字列のままのブロックは、保存内容が変わらない。
 * 編集言語と翻訳の設定は、block-collections（design-title など）と同じ窓口を使う。
 *  - 編集言語: window.__itmarEditLang（どのブロックでも共通。block-collections と同じ形）
 *  - 翻訳の設定・自動翻訳: slug-translater の REST（無ければ、手入力の JP と EN だけ）
 */
export type StageInfo = string | Record<string, string>;
type LangOption = { value: string; label: string };

const DEFAULT_LANG = "JP";
const FALLBACK_LANGS: LangOption[] = [
	{ value: "JP", label: "日本語" },
	{ value: "EN", label: "English" },
];

const isMap = (v: unknown): v is Record<string, string> =>
	!!v && typeof v === "object" && !Array.isArray(v);
const defaultText = (v: unknown): string =>
	isMap(v) ? (v[DEFAULT_LANG] ?? Object.values(v)[0] ?? "") : typeof v === "string" ? v : "";
export const textForLang = (v: unknown, lang: string): string =>
	isMap(v) ? (v[lang] ?? defaultText(v)) : typeof v === "string" ? v : "";
export const withLangText = (v: unknown, lang: string, text: string): StageInfo => {
	if (isMap(v)) return { ...v, [lang]: text };
	if (lang === DEFAULT_LANG) return text;
	return { [DEFAULT_LANG]: typeof v === "string" ? v : "", [lang]: text };
};

/* 編集言語（block-collections と共有。ブロックごとにビルドが分かれるので window に置く） */
type EditLangStore = { value: string; listeners: Set<() => void> };
const editLangStore: EditLangStore = (() => {
	const w = window as unknown as { __itmarEditLang?: EditLangStore };
	if (!w.__itmarEditLang) {
		w.__itmarEditLang = { value: DEFAULT_LANG, listeners: new Set() };
	}
	return w.__itmarEditLang;
})();
const setEditLang = (lang: string) => {
	if (lang === editLangStore.value) return;
	editLangStore.value = lang;
	editLangStore.listeners.forEach((l) => l());
};
const useEditLang = (): string =>
	React.useSyncExternalStore(
		(l) => {
			editLangStore.listeners.add(l);
			return () => {
				editLangStore.listeners.delete(l);
			};
		},
		() => editLangStore.value,
	);

/* 翻訳の設定（エディターを開いたとき1回だけ読む） */
type Config = { plugin: boolean; engine: boolean; languages: LangOption[]; blocks: string[] };
let config: Config = { plugin: false, engine: false, languages: FALLBACK_LANGS, blocks: [] };
let requested = false;
const configListeners = new Set<() => void>();
const requestConfig = () => {
	if (requested) return;
	requested = true;
	apiFetch({ path: "/slug-translater/v1/config" })
		.then((res) => {
			const d = res as { engine?: boolean; languages?: LangOption[]; blocks?: string[] };
			config = {
				plugin: true,
				engine: !!d.engine,
				languages: Array.isArray(d.languages) && d.languages.length ? d.languages : FALLBACK_LANGS,
				blocks: Array.isArray(d.blocks) ? d.blocks : [],
			};
			configListeners.forEach((l) => l());
		})
		.catch(() => undefined);
};
const useConfig = (): Config => {
	useEffect(requestConfig, []);
	return React.useSyncExternalStore(
		(l) => {
			configListeners.add(l);
			return () => {
				configListeners.delete(l);
			};
		},
		() => config,
	);
};

const translateOne = async (
	text: string,
	target: string,
): Promise<{ ok: true; text: string } | { ok: false; message: string }> => {
	try {
		const res = (await apiFetch({
			path: "/slug-translater/v1/translate",
			method: "POST",
			data: { text, source: DEFAULT_LANG, target },
		})) as { code?: number | string; text?: string };
		if (Number(res.code) === 0 && typeof res.text === "string") {
			return { ok: true, text: res.text };
		}
		return { ok: false, message: String(res.text ?? "Translation failed.") };
	} catch (e) {
		return {
			ok: false,
			message: e && typeof e === "object" && "message" in e ? String((e as { message: unknown }).message) : "Translation failed.",
		};
	}
};

/**
 * 翻訳する。改行と、差し込み項目（[入力名]）はそのまま残し、それ以外の文だけを訳す
 * （そのまま送ると、改行が抜けたり、差し込み項目が崩れたりするため）。
 */
const translate = async (
	text: string,
	target: string,
): Promise<{ ok: true; text: string } | { ok: false; message: string }> => {
	const parts = text.split(/(\[[^\]]*\]|\r?\n)/);
	const out: string[] = [];
	for (const part of parts) {
		//改行・差し込み項目・空白だけ・記号や数字だけの部分は訳さない
		if (!part.trim() || /^\[[^\]]*\]$/.test(part) || !/[^\s\d\p{P}\p{S}]/u.test(part)) {
			out.push(part);
			continue;
		}
		const lead = part.match(/^\s*/)?.[0] ?? "";
		const trail = part.match(/\s*$/)?.[0] ?? "";
		const res = await translateOne(part.trim(), target);
		if (!res.ok) return res;
		out.push(lead + res.text + trail);
	}
	return { ok: true, text: out.join("") };
};

/**
 * 編集言語の文字を読み書きする部品。自動翻訳は、日本語を直して 1.5 秒後に、まだ文字が入っていない言語だけを訳す
 * （入っている言語は上書きしない）。
 */
function useLangText(
	blockName: string,
	value: StageInfo | undefined,
	onChange: (next: StageInfo) => void,
) {
	const cfg = useConfig();
	const hasMulti = cfg.languages.length > 1;
	const canAuto = cfg.plugin && cfg.engine && cfg.blocks.includes(blockName);
	const editLang = useEditLang();
	const activeLang = hasMulti ? editLang : DEFAULT_LANG;
	const latest = useRef(value);
	latest.current = value;
	const timer = useRef(0);
	useEffect(() => () => window.clearTimeout(timer.current), []);
	const { createNotice } = useDispatch("core/notices") as {
		createNotice: (s: string, c: string, o?: Record<string, unknown>) => void;
	};

	/**
	 * 既定の言語の文字を、指定した言語へ自動翻訳して入れる。
	 * langs を省略すると、翻訳先の全言語が対象。force が false のときは、すでに文字が入っている言語は訳さない。
	 * ただし、日本語と同じ文字が入っている言語は「まだ訳していない」ものとして訳す
	 * （編集言語を切り替えると、入力欄に日本語がそのまま見えるため、それを確定してしまうことがある）。
	 */
	const fillEmpty = async (langs?: string[], force = false) => {
		const raw = latest.current;
		const source = defaultText(raw).trim();
		if (!source) return;
		let next: StageInfo = raw ?? "";
		for (const lang of langs ?? cfg.languages.map((l) => l.value)) {
			if (lang === DEFAULT_LANG) continue;
			if (!force && isMap(next)) {
				const current = String(next[lang] ?? "").trim();
				if (current !== "" && current !== source) continue;
			}
			const res = await translate(source, lang);
			if (!res.ok) {
				createNotice("error", res.message, { type: "snackbar", isDismissible: true });
				return;
			}
			next = withLangText(next, lang, res.text);
		}
		latest.current = next;
		onChange(next);
	};

	const setText = (text: string) => {
		const next = withLangText(latest.current, activeLang, text);
		latest.current = next;
		onChange(next);
		if (activeLang === DEFAULT_LANG && canAuto) {
			window.clearTimeout(timer.current);
			timer.current = window.setTimeout(() => fillEmpty(), 1500);
		}
	};

	return { cfg, hasMulti, canAuto, activeLang, fillEmpty, setText };
}

/**
 * 言語ごとの文字を持つ入力欄（編集言語の文字を読み書きする）。
 * 値は、文字列か、言語コードをキーにしたオブジェクト。編集言語の切り替えは、ブロックのツールバー（useStageInfo の toolbar）。
 */
export function LangTextControl(props: {
	blockName: string;
	label: string;
	value: StageInfo | undefined;
	onChange: (next: StageInfo) => void;
	multiline?: boolean;
	rows?: number;
	help?: string;
}) {
	const { blockName, label, value, onChange, multiline, rows, help } = props;
	const t = useLangText(blockName, value, onChange);
	const common = {
		label: `${label}${t.hasMulti ? ` (${t.activeLang})` : ""}`,
		value: textForLang(value, t.activeLang),
		help,
		onChange: (v: string) => t.setText(v),
	};
	return multiline ? (
		<TextareaControl {...common} rows={rows ?? 5} />
	) : (
		<TextControl {...common} />
	);
}

/**
 * stage_info の入力欄と、ツールバー（編集言語の切り替え）を返す。
 */
export function useStageInfo(
	blockName: string,
	value: StageInfo | undefined,
	onChange: (next: StageInfo) => void,
) {
	const t = useLangText(blockName, value, onChange);
	const { cfg, hasMulti, canAuto, activeLang } = t;

	const control = (
		<TextControl
			label={`${__("Stage information", "form-send-blocks")}${hasMulti ? ` (${activeLang})` : ""}`}
			value={textForLang(value, activeLang)}
			help={__(
				"Please enter the stage information to be displayed in the process area.",
				"form-send-blocks",
			)}
			onChange={(v: string) => t.setText(v)}
		/>
	);

	const toolbar = hasMulti ? (
		<BlockControls>
			<ToolbarGroup>
				{canAuto && activeLang !== DEFAULT_LANG && (
					<ToolbarButton
						label={__("Translate again automatically", "block-collections")}
						showTooltip
						onClick={() => t.fillEmpty([activeLang], true)}
					>
						{__("Auto", "block-collections")}
					</ToolbarButton>
				)}
				<ToolbarDropdownMenu
					label={__("Editing language", "block-collections")}
					text={activeLang}
					icon={null}
					controls={cfg.languages.map((l) => ({
						title: l.label,
						isActive: activeLang === l.value,
						onClick: () => setEditLang(l.value),
					}))}
				/>
			</ToolbarGroup>
		</BlockControls>
	) : null;

	return { control, toolbar, activeLang };
}
