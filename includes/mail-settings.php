<?php

/**
 * 問い合わせメールの送信先・差出人をサイト設定として持つ。
 *
 * 以前は contactmail-sender ブロックの属性（master_mail / master_name）だけで
 * 送信先を決めていたため、次の問題があった。
 *
 * - 送信先がテンプレートやパターンの中身として保存され、テーマの配布や
 *   サイト間の移植で移植元のアドレスがそのまま持ち込まれる
 * - save() が data-attributes に全属性を書き出すため、送信先アドレスが
 *   ページのHTMLに公開される
 * - 送信処理が、ブラウザから送られてきた宛先・差出人をそのまま信用していた
 *
 * ここでは、送信先の既定値をサイト設定に置き、ブロック属性は「空でなければ
 * 上書き」として扱う。フロントでは送信先を暗号化したトークンに置き換えて
 * 出力し、送信処理はトークンかサイト設定からだけ宛先を決める。
 *
 * @package itmar
 */

if (!defined('ABSPATH')) exit;

const ITMAR_FSB_OPTION_NOTIFY_TO    = 'itmar_fsb_notify_to';
const ITMAR_FSB_OPTION_FROM_NAME    = 'itmar_fsb_from_name';
const ITMAR_FSB_OPTION_FROM_ADDRESS = 'itmar_fsb_from_address';

/*
 * block.json の既定値。save() が既定値も data-attributes に書き出すので、
 * 既定値を空に変えると既存ブロックがすべて検証エラーになる。
 * 既定値は据え置き、この値は「未設定」として扱う。
 */
const ITMAR_FSB_PLACEHOLDER_MAIL = 'master@sample.com';
const ITMAR_FSB_PLACEHOLDER_NAME = 'Contact Mail Sender';

/**
 * サイト設定の送信先・差出人（未設定の項目はサイトの管理者情報で補う）
 */
function itmar_fsb_site_mail_settings(): array
{
	$admin_email = (string) get_option('admin_email');
	$notify_to   = (string) get_option(ITMAR_FSB_OPTION_NOTIFY_TO, '');
	$from_addr   = (string) get_option(ITMAR_FSB_OPTION_FROM_ADDRESS, '');
	$from_name   = (string) get_option(ITMAR_FSB_OPTION_FROM_NAME, '');

	return array(
		'to'   => is_email($notify_to) ? $notify_to : $admin_email,
		'from' => is_email($from_addr) ? $from_addr : $admin_email,
		'name' => '' !== $from_name ? $from_name : wp_specialchars_decode((string) get_bloginfo('name'), ENT_QUOTES),
	);
}

/**
 * ブロック属性とサイト設定から、実際に使う送信先・差出人を決める
 *
 * @param array $attrs parse_blocks() の attrs（既定値のままの属性は含まれない）
 */
function itmar_fsb_resolve_contact_destination(array $attrs): array
{
	$site = itmar_fsb_site_mail_settings();

	$mail = isset($attrs['master_mail']) ? sanitize_email((string) $attrs['master_mail']) : '';
	$name = isset($attrs['master_name']) ? sanitize_text_field((string) $attrs['master_name']) : '';

	$has_mail = '' !== $mail && ITMAR_FSB_PLACEHOLDER_MAIL !== $mail && is_email($mail);
	$has_name = '' !== $name && ITMAR_FSB_PLACEHOLDER_NAME !== $name;

	return array(
		'to'   => $has_mail ? $mail : $site['to'],
		// ブロックでアドレスを上書きした場合は、従来どおり差出人にも使う
		'from' => $has_mail ? $mail : $site['from'],
		'name' => $has_name ? $name : $site['name'],
	);
}

/**
 * 送信先トークンの暗号鍵（サイトのソルトから導出）
 */
function itmar_fsb_token_key(): string
{
	return sodium_crypto_generichash(
		wp_salt('auth') . '|itmar_fsb_mail_destination',
		'',
		SODIUM_CRYPTO_SECRETBOX_KEYBYTES
	);
}

/**
 * 送信先を、ページに出しても読めない・改ざんできないトークンにする
 */
function itmar_fsb_seal_destination(array $destination): string
{
	$payload = wp_json_encode(
		array(
			't'  => $destination['to'],
			'f'  => $destination['from'],
			'n'  => $destination['name'],
			'ft' => (string) ($destination['footer'] ?? ''),
		)
	);
	$nonce  = random_bytes(SODIUM_CRYPTO_SECRETBOX_NONCEBYTES);
	$cipher = sodium_crypto_secretbox((string) $payload, $nonce, itmar_fsb_token_key());

	return rtrim(strtr(base64_encode($nonce . $cipher), '+/', '-_'), '=');
}

/**
 * トークンを復号する。不正・期限切れ（ソルト変更など）のときは null
 */
function itmar_fsb_unseal_destination(string $token): ?array
{
	if ('' === $token || !preg_match('/^[A-Za-z0-9_-]+$/', $token)) {
		return null;
	}
	$raw = base64_decode(strtr($token, '-_', '+/'), true);
	if (false === $raw || strlen($raw) <= SODIUM_CRYPTO_SECRETBOX_NONCEBYTES) {
		return null;
	}
	$nonce  = substr($raw, 0, SODIUM_CRYPTO_SECRETBOX_NONCEBYTES);
	$cipher = substr($raw, SODIUM_CRYPTO_SECRETBOX_NONCEBYTES);

	try {
		$plain = sodium_crypto_secretbox_open($cipher, $nonce, itmar_fsb_token_key());
	} catch (\SodiumException $e) {
		return null;
	}
	if (false === $plain) {
		return null;
	}

	$data = json_decode($plain, true);
	if (!is_array($data) || !is_email($data['t'] ?? '') || !is_email($data['f'] ?? '')) {
		return null;
	}

	return array(
		'to'     => $data['t'],
		'from'   => $data['f'],
		'name'   => sanitize_text_field((string) ($data['n'] ?? '')),
		'footer' => sanitize_textarea_field((string) ($data['ft'] ?? '')),
	);
}

/**
 * 自動応答メールのフッターを組み立てる
 *
 * [master_name] / [master_mail] は差出人名・差出人アドレス（返信先）に置き換える。
 * フッターに実アドレスを書かずに済むので、テンプレートやパターンに
 * アドレスが残らない。
 */
function itmar_fsb_build_footer(array $destination): string
{
	$footer = (string) ($destination['footer'] ?? '');
	if ('' === trim($footer)) {
		return '';
	}
	return strtr(
		$footer,
		array(
			'[master_name]' => $destination['name'],
			'[master_mail]' => $destination['from'],
		)
	);
}

/**
 * フロント出力で、data-attributes の送信先をトークンに置き換える
 *
 * ブロックの保存内容（post_content）は変えないので、ブロック検証には影響しない。
 */
function itmar_fsb_seal_contact_block(string $content, array $block): string
{
	$processor = new WP_HTML_Tag_Processor($content);
	if (!$processor->next_tag()) {
		return $content;
	}

	$raw = $processor->get_attribute('data-attributes');
	if (!is_string($raw)) {
		return $content;
	}
	$data = json_decode($raw, true);
	if (!is_array($data)) {
		return $content;
	}

	/*
	 * 自動応答のフッターも送信先と一緒に封入する。
	 * 問い合わせ先としてアドレスが書かれていることが多く、そのまま出すと
	 * ページから読めてしまう。サーバーが本文の末尾に付ける。
	 * （data-attributes は保存時の全属性なので、既定値の is_footer も入っている）
	 */
	$destination           = itmar_fsb_resolve_contact_destination($block['attrs'] ?? array());
	$destination['footer'] = !empty($data['is_footer']) ? (string) ($data['footer_content'] ?? '') : '';

	unset($data['master_mail'], $data['master_name'], $data['footer_content']);
	$data['mail_token'] = itmar_fsb_seal_destination($destination);

	$processor->set_attribute('data-attributes', (string) wp_json_encode($data));
	return $processor->get_updated_html();
}
add_filter('render_block_itmar/contactmail-sender', 'itmar_fsb_seal_contact_block', 10, 2);

/**
 * 問い合わせデータの保存先として許す投稿タイプか
 *
 * 保存先はブラウザから送られてくるため、公開されている投稿タイプ
 * （post / page / 作品のCPTなど）やコアの内部タイプへの書き込みを拒否する。
 * 未登録の識別子（既定の gcb_contact など）と、非公開の独自タイプだけを許す。
 */
function itmar_fsb_is_allowed_save_post_type(string $post_type): bool
{
	if ('' === $post_type || sanitize_key($post_type) !== $post_type || strlen($post_type) > 20) {
		return false;
	}
	$object = get_post_type_object($post_type);
	if (!$object) {
		return true;
	}
	return !$object->public && !$object->_builtin;
}

/*
 * サイト設定の登録
 *
 * 編集画面は設けず、ブロックのインスペクターから編集する。
 * show_in_rest で /wp/v2/settings に出し、エディタは core-data の
 * site エンティティ（コアの「サイトのタイトル」ブロックと同じ仕組み）で読み書きする。
 * 読み書きできるのは manage_options を持つユーザーだけ（コアの settings API の制約）。
 *
 * REST リクエストでは admin_init が走らないので init で登録する。
 */
function itmar_fsb_register_mail_settings(): void
{
	$email_schema = array(
		'type'              => 'string',
		'sanitize_callback' => 'itmar_fsb_sanitize_optional_email',
		'default'           => '',
		'show_in_rest'      => true,
	);

	register_setting('itmar_fsb_mail', ITMAR_FSB_OPTION_NOTIFY_TO, $email_schema);
	register_setting('itmar_fsb_mail', ITMAR_FSB_OPTION_FROM_ADDRESS, $email_schema);
	register_setting(
		'itmar_fsb_mail',
		ITMAR_FSB_OPTION_FROM_NAME,
		array(
			'type'              => 'string',
			'sanitize_callback' => 'sanitize_text_field',
			'default'           => '',
			'show_in_rest'      => true,
		)
	);
}
add_action('init', 'itmar_fsb_register_mail_settings');

/**
 * 空か正しい形式のメールアドレスだけを保存する（不正な値は空＝未設定に戻す）
 *
 * REST から呼ばれるので、管理画面専用の add_settings_error() は使わない。
 * 形式のチェックはエディタ側でも行い、不正な値は送らない。
 */
function itmar_fsb_sanitize_optional_email($value): string
{
	$value = sanitize_email((string) $value);
	return ('' === $value || is_email($value)) ? $value : '';
}
