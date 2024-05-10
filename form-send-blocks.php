<?php

/**
 * Plugin Name:       Form Send Blocks
 * Plugin URI:        https://itmaroon.net
 * Description:       This is a block that summarizes the display screen when submitting a form.
 * Requires at least: 6.3
 * Requires PHP:      8.1.22
 * Version:           1.1.1
 * Author:            Web Creator ITmaroon
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       form-send-blocks
 *
 * @package           itmar
 */

if (!defined('ABSPATH')) exit;

//composerによるリモートリポジトリからの読み込みを要求
require_once __DIR__ . '/vendor/autoload.php';

// プラグイン情報取得に必要なファイルを読み込む
if (!function_exists('get_plugin_data')) {
	require_once(ABSPATH . 'wp-admin/includes/plugin.php');
}

$block_entry = new \Itmar\BlockClassPakage\ItmarEntryClass();

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
		wp_enqueue_script('itmar_jquery_easing', plugins_url('assets/jquery.easing.min.js', __FILE__), array('jquery'), true);
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
	$nonce = sanitize_key($_REQUEST['nonce']);

	if (wp_verify_nonce($nonce, 'contact_send_nonce')) {

		// メールの設定(無害化処理)
		$to = sanitize_email($_POST['email']);
		$subject = sanitize_text_field($_POST['subject']);
		$user_name = sanitize_text_field($_POST['userName']);
		$message = sanitize_textarea_field($_POST['message']);
		$reply = sanitize_email($_POST['reply_address']);
		$reply_name = sanitize_text_field($_POST['reply_name']);
		$is_dataSave = filter_var($_POST['is_dataSave'], FILTER_VALIDATE_BOOLEAN);
		$is_retMail = filter_var($_POST['is_retMail'], FILTER_VALIDATE_BOOLEAN);
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
