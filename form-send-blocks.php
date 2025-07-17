<?php

/**
 * Plugin Name:       Form Send Blocks
 * Plugin URI:        https://itmaroon.net
 * Description:       This is a block that summarizes the display screen when submitting a form.
 * Requires at least: 6.4
 * Requires PHP:      8.2.10
 * Version:           1.3.1
 * Author:            Web Creator ITmaroon
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       form-send-blocks
 * Domain Path:       /languages
 * @package           itmar
 */

if (!defined('ABSPATH')) exit;

//composerによるリモートリポジトリからの読み込みを要求
require_once __DIR__ . '/vendor/itmar/loader-package/src/register_autoloader.php';

// プラグイン情報取得に必要なファイルを読み込む
if (!function_exists('get_plugin_data')) {
	require_once(ABSPATH . 'wp-admin/includes/plugin.php');
}

$block_entry = new \Itmar\BlockClassPackage\ItmarEntryClass();

use Itmar\WpsettingClassPackage\ItmarDbCache;

//ブロックの初期登録
add_action('init', function () use ($block_entry) {
	$plugin_data = get_plugin_data(__FILE__);
	$block_entry->block_init($plugin_data['TextDomain'], __FILE__);
});

// 依存するプラグインが有効化されているかのアクティベーションフック
register_activation_hook(__FILE__, function () use ($block_entry) {
	$plugin_data = get_plugin_data(__FILE__);
	$block_entry->activation_check($plugin_data, ['block-collections']); // ここでメソッドを呼び出し
});

// 管理画面での通知フック
add_action('admin_notices', function () use ($block_entry) {
	$plugin_data = get_plugin_data(__FILE__);
	$block_entry->show_admin_dependency_notices($plugin_data, ['block-collections']);
});

function itmar_contact_block_add_js()
{
	//jquery-easingを読み込む
	if (!wp_script_is('itmar_jquery_easing', 'enqueued')) {
		wp_enqueue_script('itmar_jquery_easing', plugins_url('assets/jquery.easing.min.js', __FILE__), array('jquery'), '1.0', true);
	}

	//管理画面以外（フロントエンド側でのみ読み込む）
	if (!is_admin()) {
		$script_path = plugin_dir_path(__FILE__) . 'assets/contact_block.js';
		wp_enqueue_script(
			'contact_js_handle',
			plugins_url('/assets/contact_block.js', __FILE__),
			array('jquery'),
			filemtime($script_path),
			true
		);

		//jsで使えるようにnonceとadmin_urlをローカライズ
		wp_localize_script('contact_js_handle', 'itmar_form_send_option', array(
			'nonce' => wp_create_nonce('contact_send_nonce'),
			'rest_nonce' => wp_create_nonce('wp_rest'),
			'ajaxURL' => esc_url(admin_url('admin-ajax.php', __FILE__)),
			'home_url' => home_url()
		));

		// スクリプトの翻訳をセット
		wp_set_script_translations('contact_js_handle', 'form-send-blocks', plugin_dir_path(__FILE__) . 'languages');
	}
}


add_action('enqueue_block_assets', 'itmar_contact_block_add_js');

//コンタクト情報の処理
function itmar_contact_send_ajax()
{
	$nonce = isset($_REQUEST['nonce']) ? sanitize_key($_REQUEST['nonce']) : '';

	if (wp_verify_nonce($nonce, 'contact_send_nonce')) {

		// メールの設定(無害化処理)
		$to = sanitize_email(wp_unslash($_POST['email'] ?? ''));
		$subject = sanitize_text_field(wp_unslash($_POST['subject'] ?? ''));
		$user_name = sanitize_text_field(wp_unslash($_POST['userName'] ?? ''));
		$message = sanitize_textarea_field(wp_unslash($_POST['message'] ?? ''));
		$reply = sanitize_email(wp_unslash($_POST['reply_address'] ?? ''));
		$reply_name = sanitize_text_field(wp_unslash($_POST['reply_name'] ?? ''));
		$is_dataSave = filter_var(wp_unslash($_POST['is_dataSave'] ?? ''), FILTER_VALIDATE_BOOLEAN);
		$is_retMail = filter_var(wp_unslash($_POST['is_retMail'] ?? ''), FILTER_VALIDATE_BOOLEAN);

		$headers = 'From: ' . $reply_name . '<' . $reply . '>' . "\r\n";

		// バリデーション
		if (!is_email($to) || !is_email($reply) || empty($subject) || empty($message)) {
			$response['error'] = array('status' => 'error', 'message' =>  __('The server detected an error in the input item. Registration process was interrupted. ', 'form-send-blocks'));
			echo wp_json_encode($response);
			die();
		}

		//レスポンス用の配列を用意
		$response = array();

		//データの格納
		if ($is_dataSave) {
			//ユーザーの登録
			//既に登録されているかの確認
			$user_id = email_exists($to);
			if (!$user_id) {
				$user_data = array(
					'user_email' => $to,
					'user_login' => $to,
					'display_name' => $user_name,
					'role' => 'subscriber'
				);
				$user_id = wp_insert_user($user_data);
				if (is_wp_error($user_id)) {
					// ユーザーの作成に失敗した場合、エラーを処理します
					$response['save'] = array('status' => 'error', 'message' => $user_id->get_error_message());
				} else {
					//コンタクトデータを登録
					$response['save'] = itmar_contact_save($user_id, $message);
				}
			} else {
				//コンタクトデータを登録
				$response['save'] = itmar_contact_save($user_id, $message);
			}
		}

		// メールを送信
		if (wp_mail($to, $subject, $message, $headers)) {
			if ($is_retMail) {
				$response['ret_mail'] = array('status' => 'success', 'message' => __("Your autoresponder email has been successfully sent.", 'form-send-blocks'));
			} else {
				$response['info_mail'] = array('status' => 'success', 'message' =>  __("The site administrator has been successfully notified.", 'form-send-blocks'));
			}
		} else {
			if ($is_retMail) {
				$response['ret_mail'] = array('status' => 'error', 'message' =>  __('Failed to send auto-response email.', 'form-send-blocks'));
			} else {
				$response['info_mail'] = array('status' => 'error', 'message' =>  __('Failed to notify site administrator.', 'form-send-blocks'));
			}
		}
	} else {
		$response['error'] = array('status' => 'error', 'message' =>  __('Invalid request.', 'form-send-blocks'));
	}
	//結果を通知して終了
	echo wp_json_encode($response);
	die();
}
add_action('wp_ajax_itmar_contact_send', 'itmar_contact_send_ajax');
add_action('wp_ajax_nopriv_itmar_contact_send', 'itmar_contact_send_ajax');

function itmar_contact_save($user_id, $message)
{
	//コンタクトデータを登録
	$new_post = array(
		'post_type'   => 'gcb_contact', //登録するカスタム投稿タイプ
		'post_status' => 'private', //公開ステータス（ここは個人情報なので非公開に）
		'post_title'  =>  __('Inquiry Data', 'form-send-blocks'), //タイトルは分かりやすいものに
		'post_author' =>  $user_id
	);
	$post_id = wp_insert_post($new_post, true);

	if (is_wp_error($post_id)) {
		// 投稿の作成に失敗した場合、エラーを処理します
		return array('status' => 'error', 'message' => $post_id->get_error_message());
	} else {
		update_post_meta($post_id, 'send_date', current_time('mysql'));
		update_post_meta($post_id, 'message', $message);

		return array('status' => 'success', 'message' =>  __('Receipt processing completed successfully.', 'form-send-blocks'));
	}
}

//仮登録の処理とトークンのメール送信
function itmar_register_send_token()
{
	check_ajax_referer('contact_send_nonce', 'nonce');

	// 必要に応じて仮登録のテーブル作成
	itmar_create_pending_users_table_if_not_exists();


	if (!isset($_POST['form_data'])) {
		wp_send_json_error(['err_code' => 'no_data']);
	}
	// フォームデータをパース
	// phpcs:ignore WordPress.Security.NonceVerification.Missing -- form_dataは後で個別にサニタイズ済み
	$form_data = wp_unslash($_POST['form_data'] ?? '');
	parse_str($form_data, $form);
	//その他のデータ
	$master_email = sanitize_email(wp_unslash($_POST['email'] ?? ''));
	$master_name = sanitize_text_field(wp_unslash($_POST['master_name'] ?? ''));
	$subject_prov = sanitize_text_field(wp_unslash($_POST['subject_prov'] ?? ''));
	$message_prov = sanitize_textarea_field(wp_unslash($_POST['message_prov'] ?? ''));
	$is_logon = filter_var(wp_unslash($_POST['is_logon'] ?? ''), FILTER_VALIDATE_BOOLEAN);
	//リダイレクト先
	$redirect_to = isset($_POST['redirect_to']) ? esc_url_raw(wp_unslash($_POST['redirect_to'])) : home_url();

	$email = sanitize_email($form['email'] ?? '');
	$name = sanitize_text_field($form['memberName'] ?? '');
	$password = $form['password'] ?? '';

	if (empty($email) || !is_email($email)) {
		wp_send_json_error(['err_code' => 'invalid_mail']);
	}
	if (empty($name) || empty($password)) {
		wp_send_json_error(['err_code' => 'no_require']);
	}

	// 既存ユーザーのメールやユーザー名の重複チェック
	if (email_exists($email)) {
		wp_send_json_error(['err_code' => 'email_exists']);
	}
	if (username_exists($name)) {
		wp_send_json_error(['err_code' => 'username_exists']);
	}

	// トークン生成（64文字程度の一意な文字列）
	$token = wp_generate_password(48, false, false);

	// DB保存
	global $wpdb;
	$table = $wpdb->prefix . 'pending_users';

	$result = $wpdb->insert(
		$table,
		[
			'email' => $email,
			'name' => $name,
			'password' => password_hash($password, PASSWORD_DEFAULT), // パスワードはハッシュ化
			'token' => $token,
			'created_at' => current_time('mysql'),
			'is_used' => 0,
		],
		['%s', '%s', '%s', '%s', '%s', '%d']
	);

	if (!$result) {
		wp_send_json_error([['err_code' => 'save_error']]);
	}

	// メール送信
	$confirm_url = add_query_arg([
		'token'       => $token,
		'redirect_to' => rawurlencode($redirect_to), // リダイレクト先
		'is_logon' => $is_logon,
	], site_url('/register-confirm'));

	$subject = $subject_prov;
	$lines = [
		"{$message_prov}",
		"",
		"-------------------------------",
		"{$confirm_url}",
	];

	$body = implode("\r\n", $lines);

	$headers = (empty($master_name) || empty($master_email)) ? 'Content-Type: text/plain; charset=UTF-8' : [
		'From: ' . $master_name . ' <' . $master_email . '>',
		'Content-Type: text/plain; charset=UTF-8'
	];

	$mail_result = wp_mail($email, $subject, $body, $headers);

	if (!$mail_result) {
		wp_send_json_error(['err_code' => 'mail_error']);
	}

	wp_send_json_success();
}

add_action('wp_ajax_itmar_register_send_token', 'itmar_register_send_token');
add_action('wp_ajax_nopriv_itmar_register_send_token', 'itmar_register_send_token');

//仮登録ユーザー情報格納用テーブルの生成
function itmar_create_pending_users_table_if_not_exists()
{
	global $wpdb;
	$table_name = $wpdb->prefix . 'pending_users';

	// テーブル存在チェック

	$sql = $wpdb->prepare("SHOW TABLES LIKE %s", $table_name);
	$result = ItmarDbCache::get_var_cached($sql, 'table_exists_' . md5($table_name));

	if (!$result) {
		require_once ABSPATH . 'wp-admin/includes/upgrade.php';

		$charset_collate = $wpdb->get_charset_collate();

		$sql = "CREATE TABLE $table_name (
			id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
			email VARCHAR(255) NOT NULL,
			name VARCHAR(255),
			password VARCHAR(255),
			token VARCHAR(64) NULL,
			created_at DATETIME NOT NULL,
			is_used TINYINT(1) DEFAULT 0,
			PRIMARY KEY (id),
			UNIQUE KEY (token),
			KEY (email)
		) $charset_collate;";

		dbDelta($sql);
	}
}
//本登録クエリ用クエリーの生成とフロントエンドへのリダイレクト情報送信
//1.クエリ変数を登録
function itmar_register_query_vars($vars)
{
	$vars[] = 'token';
	$vars[] = 'redirect_to';
	$vars[] = 'is_logon';
	return $vars;
}
add_filter('query_vars', 'itmar_register_query_vars');
//2. リライトルールを追加
add_action('init', function () {
	add_rewrite_rule(
		'^register-confirm/token/([^/]+)/redirect/(.+)/?$',
		'index.php?register_token=$matches[1]&redirect_to=$matches[2]',
		'top'
	);
});
//3. リライトルールをフラッシュ
function itmar_flush_rewrite_rules()
{
	flush_rewrite_rules();
}
register_activation_hook(__FILE__, 'itmar_flush_rewrite_rules');

//4.処理を実行
function itmar_handle_register_confirm()
{
	$token       = get_query_var('token');
	$redirect_to = get_query_var('redirect_to');
	$is_logon = get_query_var('is_logon');

	if (!$token) return;

	$token = sanitize_text_field($token);
	$redirect_url = $redirect_to ? rawurldecode($redirect_to) : home_url();

	// 本登録処理
	$result = itmar_process_token_registration($token, $is_logon);

	if ($result['success']) {
		$user_name = isset($result['user_name']) ? $result['user_name'] : 'unknown';
		$mail_to = isset($result['mail_to']) ? $result['mail_to'] : 'unknown';
		$redirect_url = add_query_arg([
			'registered' => 'success',
			'user_name'  => $user_name,
			'mail_to'    => $mail_to,
		], $redirect_url); // ← 第2引数がベースURL

		wp_safe_redirect($redirect_url);
	} else {
		// エラーメッセージをコード化
		$error_code = isset($result['error_code']) ? $result['error_code'] : 'unknown';
		$redirect_url = add_query_arg([
			'registered' => 'error',
			'error_code' => $error_code,
		], $redirect_url); // ← 第2引数がベースURL

		wp_safe_redirect($redirect_url);
	}
	exit;
}
add_action('template_redirect', function () {
	$request_uri = isset($_SERVER['REQUEST_URI']) ? esc_url_raw(wp_unslash($_SERVER['REQUEST_URI'])) : '';
	$path = wp_parse_url($request_uri, PHP_URL_PATH);
	if (strpos($path, '/register-confirm') === 0) { //register-confirm以外のURLでは発火させない
		itmar_handle_register_confirm();
	}
});


//トークン検証とユーザー作成処理
function itmar_process_token_registration($token, $is_logon)
{
	global $wpdb;
	$table = $wpdb->prefix . 'pending_users';
	$token = sanitize_text_field($token);

	// トークンに該当する仮登録ユーザーを取得
	$sql = $wpdb->prepare("SELECT * FROM {$table} WHERE token = %s", $token);
	$row = ItmarDbCache::get_row_cached($sql, 'token_row_' . md5($token));

	if (!$row) {
		return ['success' => false, 'error_code' => 'invalid_token'];
	}

	// 有効期限チェック（24時間）
	$created = strtotime($row['created_at']);
	if ((time() - $created) > 86400) {
		return ['success' => false, 'error_code' => 'expired'];
	}

	$email = sanitize_email($row['email']);
	$display_name = sanitize_text_field($row['name']);
	$hashed_password = $row['password'];

	// user_login を自動生成
	$base = 'user_' . substr(md5($email), 0, 8);
	$username = $base;
	$i = 1;
	while (username_exists($username)) {
		$username = $base . $i++;
	}

	// ユーザー作成
	$user_id = wp_insert_user([
		'user_login'   => $username,
		'user_pass'    => wp_generate_password(),
		'user_email'   => $email,
		'display_name' => $display_name,
		'nickname'     => $display_name,
		'role'         => 'subscriber',
	]);

	if (is_wp_error($user_id)) {
		return ['success' => false, 'error_code' => 'user_fail'];
	}

	// パスワードを仮登録のハッシュで上書き
	ItmarDbCache::update_and_clear_cache(
		$wpdb->users,
		['user_pass' => $hashed_password],
		['ID' => $user_id],
		['%s'],
		['%d'],
		['user_cache_' . $user_id]
	);

	// 仮登録情報を削除
	ItmarDbCache::delete_and_clear_cache(
		$table,
		['id' => $row['id']],
		['%d'],
		['row_token_' . md5($row['token'])]
	);

	if ($is_logon) {
		// ✅ 自動ログイン
		wp_clear_auth_cookie();
		wp_set_current_user($user_id);
		wp_set_auth_cookie($user_id, true);
	}

	//成功を返す
	return ['success' => true, 'user_name' => $username, 'mail_to' => $email];
}

//カスタムログインの処理
function itmar_custom_login()
{
	check_ajax_referer('contact_send_nonce', 'nonce');

	if (!isset($_POST['form_data'])) {
		wp_send_json_error(['message' => 'フォームデータが不正です']);
	}

	// シリアライズされたデータをパース
	$form_data = wp_unslash($_POST['form_data'] ?? ''); // phpcs:ignore WordPress.Security.NonceVerification.Missing -- form_dataは後で個別にサニタイズ済み
	parse_str($form_data, $form);

	//ログイン状態を保持するか
	$remember = isset($_POST['remember']) && $_POST['remember'] == 1;

	$username = sanitize_user($form['userID'] ?? '');
	$password = $form['password'] ?? '';

	if (empty($username) || empty($password)) {
		wp_send_json_error(['message' => 'ユーザー名またはパスワードが未入力です']);
	}

	$creds = [
		'user_login'    => $username,
		'user_password' => $password,
		'remember'      => $remember,
	];

	$user = wp_signon($creds, false);

	if (is_wp_error($user)) {
		wp_send_json_error(['message' => $user->get_error_message()]);
	}

	// ✅ 正常ログイン時 → JSONで成功 + リダイレクト先を渡す
	wp_send_json_success([
		'message' => 'ログインに成功しました',
	]);
}


add_action('wp_ajax_itmar_custom_login', 'itmar_custom_login');
add_action('wp_ajax_nopriv_itmar_custom_login', 'itmar_custom_login');
