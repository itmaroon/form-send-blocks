# Form Send Blocks

## 概要
このリポジトリはForm Send BlocksというWordpressのプラグインのソースコードを含んでいます。
機能の概要は以下のとおりです。
- 入力用のカスタムブロックを収納するフォーム、入力内容を確認するフォーム、フォームがサブミットされたときの結果を表示するフォームを表示する３つのブロックを提供します。
- 入力用ブロックから入力された内容を、設定された管理者あてに通知メールとして送信し、入力したユーザーに自動応答メールとして送信するブロックを提供します。
- 入力された内容をWordPressのデータベースに格納しておく機能を備えています。

zipファイルをダウンロードしてWordpress管理画面からプラグインのインストールを行うとプラグインとして機能します。
このブロックを使用するには、[BLOCK COLLECTIONSプラグイン](https://ja.wordpress.org/plugins/block-collections/)がインストールされていることが必要です。

このプラグインをインストールすると次の４つのブロックが登録され、ブロックエディタでもサイトエディタで使用することができます（WordPress6.4.2で動作確認済み）。

以下各ブロックの機能の概要を説明します。
1. Input Figure
このブロックはBLOCK COLLECTIONSのDesign Text Control、Design CheckBox、Design Select、Design Buttonをインナーブロックとして収納して送信フォームを生成するブロックです。
これら以外のブロックは収納できませんが、数については特に制限はありません。

2. Comfirm Figure
Input Figureで入力した内容を確認し、送信を実行するためのフォームを生成するブロックです。確認のためにテーブルに入力内容を表示します。その上で送信ボタンをクリックするとフォームのサブミットが行われます。

3. Thanks Figure
送信結果を表示するためのフォームを生成するブロックです。
送信結果の文言を設定することができ、その内容を表示します。配置されたボタンにはリダイレクト先の固定ページを設定することができます

4. Contact Mail Sender
Input Figure、Comfirm Figure、Thanks Figure及びBLOCK COLLECTIONSのDesign Processをインナーブロックとして収納して、メールによるお問合せページを生成するブロックです。
このブロックが配置されたWebページからお問合せがあったことを伝えるメールと、お問合せを行ったWebページ閲覧者に対する自動応答メールを発信します。
この内容はWordPressのデータベースに蓄えることができますが、現時点のバージョンでは、その内容を表示する機能がありません。将来のバージョンアップに備えた機能です。

## その他特筆事項
1. レスポンシブ対応が必要と思われるスタイル設定について、デスクトップモード（幅768px以上のデバイスでの表示）とモバイルモード（幅767px以下のデバイスでの表示）で、別々の設定が可能となっています。どちらの設定なのかは、ブロックエディタやサイトエディタで表示モードを切り替えたとき、サイドメニューの表示に「（デスクトップ）」、「（モバイル）」と表示されるようになっています。
なお、タブレット表示に関するレスポンシブには対応しておりません。
2. このプラグインは、[BLOCK COLLECTIONSプラグイン](https://ja.wordpress.org/plugins/block-collections/)に依存しています。このプラグインを使用するためには、インストールと有効化が必要です。
3. 文言等の表示に関しては、WordPressの国際化関数による設定を行っていますので、多国籍の言語表示が可能です。現時点においては英語と日本語表記が可能となっています。

## 留意事項
1. Contact Mail Senderブロックでは、画面遷移のアニメーションのために、jquery.easingを使用しています。そのため、このブロックを利用する場合は、次の利用規約にしたがってください。
	[jquery.easing/LICENSE-BSD-3-Clause.txt](https://github.com/gdsmith/jquery.easing/blob/master/LICENSE-BSD-3-Clause.txt)
2.メール送信についてはwp_mailを使用しています。そのため、ローカル環境からメール送信する場合は、[WP Mail SMTP by WPForms](https://ja.wordpress.org/plugins/wp-mail-smtp/)などのSMTP環境を提供するプラグインのインストールが必要です。

