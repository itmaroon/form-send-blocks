/**
 * 言語ごとの文字（{JP:"…", EN:"…"}）を持てる属性から、編集画面の表示に使う文字を取り出す。
 * 文字列ならそのまま。オブジェクトなら既定の言語（JP）、なければ最初の言語の文字。
 */
export const plainText = (value: unknown): string => {
	if (value && typeof value === "object" && !Array.isArray(value)) {
		const map = value as Record<string, string>;
		return map.JP ?? Object.values(map)[0] ?? "";
	}
	return typeof value === "string" ? value : "";
};
