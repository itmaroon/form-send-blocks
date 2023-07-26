<?php
/**
 * Plugin Name:       Form Send
 * Plugin URI:        https://itmaroon.net
 * Description:       フォーム送信するときの表示画面をまとめたブロックです
 * Requires at least: 6.1
 * Requires PHP:      7.0
 * Version:           0.1.0
 * Author:            WebクリエイターITmaroon
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       form-send-blocks
 *
 * @package           itmar
 */


function itmar_form_send_blocks_block_init() {
	foreach (glob(plugin_dir_path(__FILE__) . 'build/blocks/*') as $block) {
		// Static block
		register_block_type($block);
	}
}
add_action( 'init', 'itmar_form_send_blocks_block_init' );
