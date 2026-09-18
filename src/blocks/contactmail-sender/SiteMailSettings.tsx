/**
 * 問い合わせメールの送信先・差出人（サイト共通の設定）をインスペクターで編集する。
 *
 * 値はブロック属性ではなくサイトのオプション（includes/mail-settings.php で
 * show_in_rest 登録）に保存する。コアの「サイトのタイトル」ブロックと同じく
 * core-data の site エンティティで読み書きし、エディタの「保存」でまとめて保存される。
 * テンプレートやパターンに送信先が残らないので、テーマの配布や移植で持ち運ばれない。
 */
import { __ } from "@wordpress/i18n";
import { useEntityProp, store as coreStore } from "@wordpress/core-data";
import { useSelect, dispatch } from "@wordpress/data";
import { useState, useEffect } from "@wordpress/element";
import { PanelRow, TextControl, Notice, Spinner } from "@wordpress/components";

//Emailのバリデーション正規表現
const MAIL_PATTERN = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

type SiteFieldProps = {
	option: string;
	label: string;
	help: string;
	placeholder?: string;
	isEmail?: boolean;
};

// サイト設定の1項目（入力中はローカルに持ち、確定時にエンティティへ書く）
const SiteField = ({
	option,
	label,
	help,
	placeholder,
	isEmail = false,
}: SiteFieldProps) => {
	const [value, setValue] = useEntityProp("root", "site", option);
	const saved = typeof value === "string" ? value : "";
	const [editing, setEditing] = useState(saved);

	// 設定の読み込みが後から完了したときに表示を合わせる
	useEffect(() => {
		setEditing(saved);
	}, [saved]);

	return (
		<PanelRow>
			<TextControl
				label={label}
				help={help}
				value={editing}
				placeholder={placeholder}
				type={isEmail ? "email" : "text"}
				onChange={(newVal) => setEditing(newVal)}
				onBlur={() => {
					const trimmed = editing.trim();
					// 空は「未設定」（サーバー側で管理者情報を使う）
					if (isEmail && trimmed !== "" && !MAIL_PATTERN.test(trimmed)) {
						(dispatch("core/notices") as any).createNotice(
							"error",
							__("The email address format is invalid. ", "form-send-blocks"),
							{ type: "snackbar", isDismissible: true },
						);
						setEditing(saved);
						return;
					}
					setEditing(trimmed);
					if (trimmed !== saved) {
						setValue(trimmed);
					}
				}}
			/>
		</PanelRow>
	);
};

type Props = {
	// ブロックに保存されている個別の送信先・差出人名（既定値は空として渡す）
	ownMail: string;
	ownName: string;
	onClearOverride: () => void;
};

export default function SiteMailSettings({
	ownMail,
	ownName,
	onClearOverride,
}: Props) {
	// サイト設定を書き換えられるか（manage_options）。判定中は undefined
	const canEdit = useSelect(
		(select) =>
			(select(coreStore) as any).canUser("update", {
				kind: "root",
				name: "site",
			}),
		[],
	);
	// 未設定時に使われる値（プレースホルダー表示用）
	const [adminEmail] = useEntityProp("root", "site", "email");
	const [siteTitle] = useEntityProp("root", "site", "title");

	const hasOverride = ownMail !== "" || ownName !== "";

	return (
		<>
			{hasOverride && (
				<Notice
					status="warning"
					isDismissible={false}
					className="itmar_override_notice"
					actions={[
						{
							label: __("Clear block-specific settings", "form-send-blocks"),
							onClick: onClearOverride,
							variant: "secondary",
						},
					]}
				>
					<p>
						{__(
							"This block has its own destination saved, which takes priority over the site setting.",
							"form-send-blocks",
						)}
					</p>
					{ownMail !== "" && (
						<p>
							{__("Notification email address", "form-send-blocks")}:{" "}
							<code>{ownMail}</code>
						</p>
					)}
					{ownName !== "" && (
						<p>
							{__("Sender name", "form-send-blocks")}: <code>{ownName}</code>
						</p>
					)}
				</Notice>
			)}

			<p className="itmar_site_setting_note">
				{__(
					"These settings are shared by every inquiry form on this site and are saved with the site, not with this block.",
					"form-send-blocks",
				)}
			</p>

			{canEdit === undefined && <Spinner />}

			{canEdit === false && (
				<Notice status="info" isDismissible={false}>
					{__(
						"Only administrators can change the site's inquiry mail settings.",
						"form-send-blocks",
					)}
				</Notice>
			)}

			{canEdit && (
				<>
					<SiteField
						option="itmar_fsb_notify_to"
						label={__("Notification email address", "form-send-blocks")}
						help={__(
							"Inquiries are sent to this address. If blank, the site administrator email address is used.",
							"form-send-blocks",
						)}
						placeholder={typeof adminEmail === "string" ? adminEmail : ""}
						isEmail
					/>
					<SiteField
						option="itmar_fsb_from_name"
						label={__("Sender name", "form-send-blocks")}
						help={__(
							"Shown as the sender of automatic response emails. If blank, the site title is used.",
							"form-send-blocks",
						)}
						placeholder={typeof siteTitle === "string" ? siteTitle : ""}
					/>
					<SiteField
						option="itmar_fsb_from_address"
						label={__("Sender email address", "form-send-blocks")}
						help={__(
							"Used as the From address. Use an address on this site's domain so that mail is not rejected as spoofed. If blank, the site administrator email address is used.",
							"form-send-blocks",
						)}
						placeholder={typeof adminEmail === "string" ? adminEmail : ""}
						isEmail
					/>
				</>
			)}
		</>
	);
}
