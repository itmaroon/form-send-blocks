<?php
/**
 * Plugin Name:       Form Send Blocks
 * Plugin URI:        https://itmaroon.net
 * Description:       This is a block that summarizes the display screen when submitting a form.
 * Requires at least: 6.1
 * Requires PHP:      7.0
 * Version:           0.1.0
 * Author:            Web Creator ITmaroon
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       itmar_form_send_blocks
 *
 * @package           itmar
 */

 if ( ! defined( 'ABSPATH' ) ) exit;
 
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
	
}
add_action( 'init', 'itmar_form_send_blocks_block_init' );
