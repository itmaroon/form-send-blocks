<?php
/**
 * Plugin Name:       Form Send Blocks
 * Plugin URI:        https://itmaroon.net
 * Description:       This is a block that summarizes the display screen when submitting a form.
 * Requires at least: 6.3
 * Requires PHP:      8.0.22
 * Version:           0.1.0
 * Author:            Web Creator ITmaroon
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       itmar_form_send_blocks
 *
 * @package           itmar
 */

 if ( ! defined( 'ABSPATH' ) ) exit;

// 依存関係のチェック関数
function itmar_check_form_send_dependencies() {
	include_once(ABSPATH . 'wp-admin/includes/plugin.php');//is_plugin_active() 関数の使用

	$required_plugins = ['block-collections']; // 依存するプラグインのスラッグ
	$ret_obj = null;//インストールされているかの通知オブジェクト

	foreach ($required_plugins as $plugin) {
		$plugin_path = WP_PLUGIN_DIR . '/' . $plugin;
		if (!is_plugin_active($plugin . '/' . $plugin . '.php')) {
			if (file_exists($plugin_path)) {
				// プラグインはインストールされているが有効化されていない
				$plugin_file = $plugin . '/' . $plugin . '.php';
				$activate_url = wp_nonce_url(admin_url('plugins.php?action=activate&plugin=' . $plugin_file), 'activate-plugin_' . $plugin_file);
				$link = '<a href="' . $activate_url . '">' . __("Activate Plugin","itmar_form_send_blocks") . '</a>';
				$message = 'Form Send Blocks:' . __("Required plugin is not active.","itmar_form_send_blocks");
				$ret_obj = array("message" => $message, "link" => $link);
				
			} else {
				// プラグインがインストールされていない
				$install_url = admin_url('plugin-install.php?s=' . $plugin . '&tab=search&type=term');
				$link = '<a href="' . $install_url . '">' . __("Install Plugin","itmar_form_send_blocks") . '</a>';
				$message = 'Form Send Blocks:' . __("Required plugin is not installed.","itmar_form_send_blocks");
				$ret_obj = array("message" => $message, "link" => $link);
			}
			return $ret_obj;
		}
	}
	return $ret_obj;
}

// アクティベーションフック
register_activation_hook(__FILE__, 'itmar_block_collections_activation_check');
function itmar_block_collections_activation_check() {
	//PHP用のテキストドメインの読込（国際化）
	load_plugin_textdomain( 'itmar_form_send_blocks', false, basename( dirname( __FILE__ ) ) . '/languages' );

	$notice = itmar_check_form_send_dependencies();

	if (!is_null($notice)) {
		// エラーメッセージ
		$message = $notice["message"] . $notice["link"];
		// プラグインへの戻るリンク
		$return_link = '<br><br><a href="' . esc_url(admin_url('plugins.php')) . '">' . __("Return to Plugins Setting","itmar_form_send_blocks") . '</a>';

		// wp_die関数でカスタムメッセージとリンクを表示
		wp_die($message . $return_link);
	}
}

// 管理画面での通知
add_action('admin_notices', 'itmar_show_admin_dependency_notices');
function itmar_show_admin_dependency_notices() {
	$notice = itmar_check_form_send_dependencies();
	if (!is_null($notice)) {
		$message = '<div class="error"><p>' . $notice["message"] . $notice["link"] .'</p></div>';
		echo $message;
	}
}

//ブロックの登録 
function itmar_form_send_blocks_block_init() {
	foreach (glob(plugin_dir_path(__FILE__) . 'build/blocks/*') as $block) {
		$block_name = basename($block);
		$script_handle = 'form-handle-' . $block_name;
		
		// スクリプトの登録
		wp_register_script(
			$script_handle,
			plugins_url( 'build/blocks/'.$block_name.'/index.js', __FILE__ ),
			array( 'wp-blocks', 'wp-element', 'wp-i18n', 'wp-block-editor' )
		);
		// Static block
		register_block_type(
			$block,
			array(
				'editor_script' => $script_handle
			)
		);
		// その後、このハンドルを使用してスクリプトの翻訳をセット
		wp_set_script_translations( $script_handle, 'itmar_form_send_blocks', plugin_dir_path( __FILE__ ) . 'languages' );
	}
	//PHP用のテキストドメインの読込（国際化）
	load_plugin_textdomain( 'itmar_form_send_blocks', false, basename( dirname( __FILE__ ) ) . '/languages' );
}
add_action( 'init', 'itmar_form_send_blocks_block_init' );

function itmar_contact_block_add_js() {
	//jquery-easingを読み込む
	if (!wp_script_is('itmar_jquery_easing', 'enqueued')) {
		wp_enqueue_script( 'itmar_jquery_easing', plugins_url('assets/jquery.easing.min.js', __FILE__ ), array('jquery' ), true );
	}
	//管理画面以外（フロントエンド側でのみ読み込む）
	if (!is_admin()) {
		$script_path = plugin_dir_path(__FILE__) . 'assets/contact_block.js';
		wp_enqueue_script( 
			'contact_js_handle', 
			plugins_url( '/assets/contact_block.js', __FILE__ ), 
			array('jquery'), 
			filemtime($script_path),
			true
		);

		//nonceの生成
		wp_localize_script( 'contact_js_handle', 'itmar_option', array(
			'nonce' => wp_create_nonce('contact_send_nonce'),
			'ajaxURL' => esc_url( admin_url( 'admin-ajax.php', __FILE__ ) ),
		));
		// スクリプトの翻訳をセット
		wp_set_script_translations( 'contact_js_handle', 'itmar_form_send_blocks', plugin_dir_path( __FILE__ ) . 'languages' );
	}
	
}

add_action('enqueue_block_assets', 'itmar_contact_block_add_js');

//コンタクト情報の処理
function itmar_contact_send_ajax(){
  $nonce = $_REQUEST['nonce'];
  
  
	if ( wp_verify_nonce( $nonce, 'contact_send_nonce' ) ) {
    
    // メールの設定(無害化処理)
		$to = sanitize_email( $_POST['email'] );
		$subject = sanitize_text_field( $_POST['subject'] );
		$user_name = sanitize_text_field( $_POST['userName'] );
		$message = sanitize_textarea_field( $_POST['message'] );
		$reply = sanitize_email( $_POST['reply_address'] );
		$reply_name = sanitize_text_field( $_POST['reply_name'] );
		$is_dataSave = filter_var($_POST['is_dataSave'], FILTER_VALIDATE_BOOLEAN);
		$is_retMail = filter_var($_POST['is_retMail'], FILTER_VALIDATE_BOOLEAN);
		$headers = 'From: '. $reply_name . '<'.$reply.'>' . "\r\n";

		// バリデーション
		if ( ! is_email( $to ) || ! is_email( $reply ) || empty( $subject ) || empty( $message ) ) {
			$response['error'] = array('status' => 'error', 'message' =>  __('The server detected an error in the input item. Registration process was interrupted. ', 'itmar_form_send_blocks'));
			echo json_encode($response);
			die();
		}

		//レスポンス用の配列を用意
		$response = array();

		//データの格納
		if($is_dataSave){
			//ユーザーの登録
			//既に登録されているかの確認
			$user_id = email_exists( $to );
			if(!$user_id){
				$user_data = array(
					'user_email' => $to,
					'user_login' => $to,  
					'display_name' => $user_name, 
					'role' => 'subscriber' 
				);
				$user_id = wp_insert_user( $user_data );
				if ( is_wp_error( $user_id ) ) {
					// ユーザーの作成に失敗した場合、エラーを処理します
					$response['save'] = array('status' => 'error', 'message' => $user_id->get_error_message());
				}else{
					//コンタクトデータを登録
					$response['save']=itmar_contact_save($user_id, $message);
				}
			}else{
				//コンタクトデータを登録
				$response['save']=itmar_contact_save($user_id, $message);
			}
			
		}

		// メールを送信
		if (wp_mail($to, $subject, $message, $headers)) {
			if($is_retMail){
				$response['ret_mail'] = array('status' => 'success', 'message' => __("Your autoresponder email has been successfully sent.", 'itmar_form_send_blocks'));
			}else{
				$response['info_mail'] = array('status' => 'success', 'message' =>  __("The site administrator has been successfully notified.", 'itmar_form_send_blocks'));
			}
		} else {
			if($is_retMail){
				$response['ret_mail'] = array('status' => 'error', 'message' =>  __('Failed to send auto-response email.', 'itmar_form_send_blocks'));
			}else{
				$response['info_mail'] = array('status' => 'error', 'message' =>  __('Failed to notify site administrator.', 'itmar_form_send_blocks'));
			}
    		
		}
  }else {
		$response['error'] = array('status' => 'error', 'message' =>  __('Invalid request.', 'itmar_form_send_blocks'));
	}
	//結果を通知して終了
	echo json_encode($response);
  die();
}
add_action( 'wp_ajax_itmar_contact_send', 'itmar_contact_send_ajax' );
add_action( 'wp_ajax_nopriv_itmar_contact_send', 'itmar_contact_send_ajax' );

function itmar_contact_save($user_id, $message){
	//コンタクトデータを登録
	$new_post = array(
		'post_type'   => 'gcb_contact',//登録するカスタム投稿タイプ
		'post_status' => 'private',//公開ステータス（ここは個人情報なので非公開に）
		'post_title'  =>  __('Inquiry Data', 'itmar_form_send_blocks'),//タイトルは分かりやすいものに
		'post_author' =>  $user_id
	);
	$post_id = wp_insert_post( $new_post, true );

	if ( is_wp_error( $post_id ) ) {
		// 投稿の作成に失敗した場合、エラーを処理します
		return array('status' => 'error', 'message' => $post_id->get_error_message());
		
	}else{
		update_post_meta( $post_id, 'send_date', current_time('mysql') );
		update_post_meta( $post_id, 'message', $message );

		return array('status' => 'success', 'message' =>  __('Receipt processing completed successfully.', 'itmar_form_send_blocks'));
	}
}
