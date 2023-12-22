
jQuery(function ($) {
  //確認画面遷移のボタンの有効化
  $(document).ready(function () {
    // チェックボックスの状態を評価してsubmitボタンの状態を更新する関数
    function evaluateCheckboxes() {
      // 全てのチェックボックスが選択されているかチェック
      var allChecked = true;
      $('#to_confirm_form input[type="checkbox"][data-is_proceed="true"]').each(function () {
        if (!$(this).prop('checked')) {
          allChecked = false;
          return false; // eachループを抜ける
        }
      });

      if (!allChecked) {
        // 一つでもチェックされていなければ、submitボタンを無効化
        $('#to_confirm_form input[type="submit"]').prop('disabled', true);
      } else {
        // すべてチェックされていれば、submitボタンを有効化
        $('#to_confirm_form input[type="submit"]').prop('disabled', false);
      }
    };

    // ページ読み込み時に関数を実行
    evaluateCheckboxes();

    // チェックボックスの変更時に関数を実行
    $('#to_confirm_form input[type="checkbox"][data-is_proceed="true"]').on('change', evaluateCheckboxes)
  });

  //メール送信関数
  const sendMail_ajax = (send_email, subject_mail, message_mail, master_email, is_dataSave, is_retMail) => {
    //noceの取得
    const nonce = itmar_option.nonce;

    //ajaxの送り先
    const ajaxUrl = itmar_option.ajaxURL;
    return new Promise((resolve, reject) => {//Promiseを返す
      $.ajax({
        type: 'POST',
        url: ajaxUrl,
        data: {
          'action': 'itmar_contact_send',
          'nonce': nonce,
          'email': send_email,
          'userName': $('input[name="user_name"]').val(),
          'subject': subject_mail,
          'message': message_mail,
          'reply_address': master_email,
          'is_dataSave': is_dataSave,
          'is_retMail': is_retMail,
        }
      }).done(function (data) {
        let ret_obj = JSON.parse(data);
        resolve(ret_obj);
      }).fail(function (XMLHttpRequest, textStatus, errorThrown) {
        console.log(XMLHttpRequest.status);
        console.log(textStatus);
        console.log(errorThrown.message);
        reject(errorThrown);
      }).always(function () {

      });
    });
  }

  //メッセージ再構築関数
  const message_rebuild = (message) => {
    const matches = message.match(/\[(.*?)\]/g);
    if (matches) {
      matches.forEach(match => {
        let rep_elm = $(`[name="${match.slice(1, -1)}"]`);
        let elm_tag = rep_elm.prop('tagName').toLowerCase();

        let rep_word = '';
        if (elm_tag === 'input' || elm_tag === 'textarea') {//input要素かtextarea要素の場合
          rep_word = rep_elm.val()
        } else if (elm_tag === 'select') {//select要素の場合
          let selectedTexts = [];
          rep_elm.find('option:selected').each(function () {
            // 選択されたoptionのテキストを配列に追加
            selectedTexts.push($(this).text());
          });
          rep_word = selectedTexts.join(',');
        }

        message = message.replace(match, rep_word);
      });
    }
    return message
  }

  //プロセス更新関数
  const process_change = (figure_elm, set_flg) => {
    let classNames = figure_elm.attr('class').split(/\s+/);  // クラス名を空白文字で分割
    let wpBlockClasses = $.grep(classNames, function (className) {  // 'wp-block'で始まるクラス名を抽出
      return /^wp-block/.test(className);
    });
    let lis = $('.wp-block-itmar-design-process').find('li');
    let targetLis = lis.filter(function () {
      var liClasses = $(this).attr('class').split(/\s+/);  // li要素のクラス名を取得し配列にする
      return liClasses.some(function (liClass) {
        if (liClass === "") {
          return false;  // liClassが空文字であればfalseを返す
        }
        var result = wpBlockClasses.some(function (wpBlockClasse) {
          return wpBlockClasse.includes(liClass);
        });// wpBlockClassesにliのクラス名が含まれるかチェック
        return result;
      });
    });

    if (set_flg) {
      targetLis.addClass('ready');
    } else {
      targetLis.removeClass('ready');
    }

  }

  //アニメーション関連パラメータ

  let animating = false; //flag to prevent quick multi-click glitches
  //ページのセット
  let fieldset_objs = $('.figure_fieldset');
  //プロセスエリアのセット
  let process_area = $('.wp-block-itmar-design-process');

  //プログレスバーの高さ
  let progress_height = process_area ? process_area.outerHeight(true) : 0;
  let contactform_top_margin = $('.wp-block-itmar-contactmail-sender>div').css('margin-top');

  //スライドのアニメーション
  const processAnimation = (current_fs, change_fs, next) => {
    //show the next fieldset
    change_fs.show();
    if (next) {
      change_fs.css({ 'position': 'absolute' });

    } else {
      current_fs.css({ 'position': 'absolute' });
    }

    let left, opacity, scale; //fieldset properties which we will animate

    current_fs.animate({ opacity: 0 }, {
      step: function (now) {
        //as the opacity of current_fs reduces to 0 - stored in "now"
        //1. scale current_fs down to 80%
        scale = next ? 1 - (1 - now) * 0.2 : 0.8 + (1 - now) * 0.2;
        //2. bring change_fs from the right(50%)
        left = next ? (now * 50) + "%" : ((1 - now) * 50) + "%";
        //3. increase opacity of change_fs to 1 as it moves in
        opacity = 1 - now;
        if (next) {
          current_fs.css({ 'transform': 'scale(' + scale + ')' });
          change_fs.css({ 'top': progress_height, 'left': left, 'opacity': opacity });
        } else {
          current_fs.css({ 'top': `calc(${progress_height}px + ${contactform_top_margin} )`, 'left': left, });
          change_fs.css({ 'transform': 'scale(' + scale + ')', 'opacity': opacity });
        }

      },
      duration: 800,
      complete: function () {
        current_fs.hide();
        animating = false;
        change_fs.css({ 'position': 'static' });
      },
      //this comes from the custom easing plugin
      easing: 'easeInBack',
    });
  }

  //formの確認画面へボタンが押されたときの処理
  $('#to_confirm_form').on('submit', function (e) {
    e.preventDefault();

    //アニメーション中ならリターン
    if (animating) return false;

    let err_flg = false;//エラーフラグをセット
    //バリデーションチェック
    $(this).find('.wp-block-itmar-design-text-ctrl, .wp-block-itmar-design-select').each(function () {
      let required = $(this).data('required');
      if (required) {
        let input_elm = $(this).find('input, textarea').length !== 0 ? $(this).find('input, textarea') : undefined;
        let select_elm = $(this).find('select').length !== 0 ? $(this).find('select') : undefined;
        //セレクトが選択肢を持っているかどうかの判定（単数選択・複数選択）
        let select_flg = select_elm?.attr('multiple') ? select_elm?.val().length == 0 : select_elm?.val();
        let required_err = false;
        if (input_elm) {
          required_err = (input_elm.val().length == 0);
        }
        if (select_elm) {
          required_err = (select_flg == true || select_flg == null || select_flg === '');
        }

        if (required_err) {
          const { __ } = wp.i18n;
          const msg = __('This is a required field.', 'itmar_form_send_blocks');
          console.log(msg)
          let err_msg_elm = $(`<div class="err_msg">${__('This is a required field.', 'itmar_form_send_blocks')}</div>`)
          $(this).find('> div').append(err_msg_elm);
          err_flg = true;
        } else {
          $(this).find('.err_msg').remove()
        }

      }
    })
    if (err_flg) {
      return;//エラーフラグがtrueなら処理終了
    }
    animating = true;//アニメーションフラグを立てる

    //次の画面に遷移
    //アニメーションの実行
    processAnimation(fieldset_objs.eq(0), fieldset_objs.eq(1), true);
    //プログレスエリアの処理
    process_change($(this).parent().parent().nextAll('.figure_fieldset').first(), true);

    //確認データの表示
    let disp_table = $('.wp-block-itmar-design-table');
    let source_name = disp_table.data('source');
    let source_elm = $(`*[name="${source_name}"]`);
    let input_elm = source_elm.find('input:not([type="submit"]):not([type="checkbox"]), textarea, select');
    input_elm.each(function (index) {
      let tagName = $(this).prop('tagName').toLowerCase();
      let input_val = '';
      if (tagName === 'input' || tagName === 'textarea') {
        input_val = $(this).val();
      }
      if (tagName === 'select') {
        let selectedTexts = [];
        $(this).find('option:selected').each(function () {
          // 選択されたoptionのテキストを配列に追加
          selectedTexts.push($(this).text());
        });
        input_val = selectedTexts.join(',');
      }
      $('#itmar_send_exec').find('tbody tr').eq(index).find('td').text(input_val);
    });
  });



  //実行またはキャンセルボタンが押されたときの処理
  $('#itmar_send_exec').on('submit', function (e) {
    e.preventDefault();

    //アニメーション中ならリターン
    if (animating) return false;
    animating = true;

    //押されたボタンの取得
    const click_id = e.originalEvent.submitter.id;

    //キャンセルボタンなら元に戻して終了
    if (click_id === $(this).data('cancel_id')) {
      //アニメーションの実行
      processAnimation(fieldset_objs.eq(1), fieldset_objs.eq(0), false);
      //プログレスエリアの処理
      process_change($(this).parent().parent(), false);
      return;
    }

    // Promiseを格納する配列を作成
    const promises = [];

    //親ブロックの情報取得
    let parent_block = $(this).parents('.wp-block-itmar-contactmail-sender');

    let master_email = parent_block.data('master_mail');
    let subject_info = parent_block.data('subject_info');
    let message_info = parent_block.data('message_info');
    let is_dataSave = parent_block.data('is_datasave');
    //message_infoの再構築
    message_info = message_rebuild(message_info);
    //ローディングマークを出す
    const { __ } = wp.i18n;
    dispLoading(__("sending...", 'itmar_form_send_blocks'), $('#itmar_send_exec'));
    //通知メールの送信
    promises.push(sendMail_ajax(master_email, subject_info, message_info, master_email, false, false));
    //自動応答メール
    let is_retmail = parent_block.data('is_retmail');
    if (is_retmail) {
      let ret_inputName = parent_block.data('ret_mail');
      let ret_email = $(`[name="${ret_inputName}"]`).val()
      let master_email = parent_block.data('master_mail');
      let subject_ret = parent_block.data('subject_ret');
      let message_ret = parent_block.data('message_ret');
      //message_retの再構築
      message_ret = message_rebuild(message_ret);
      //自動応答メールの送信
      promises.push(sendMail_ajax(ret_email, subject_ret, message_ret, master_email, is_dataSave, true));
    }

    let figure_elm = $(this).parent();

    // Promise.allSettledですべての非同期処理が完了するのを待つ
    Promise.allSettled(promises)
      .then((result) => {
        //送信結果の取得
        let all_result = result.reduce((acc, curr) => {
          if ('value' in curr) {
            Object.assign(acc, curr.value);
          }
          return acc;
        }, {});
        //表示エリアに表示
        let result_disp = $('#to_home p');
        result_disp.empty();
        $.each(all_result, function (key, value) {
          if (!(key === 'save' || key === 'error')) {
            let message = $('#to_home').data(`${key}_${value.status}`);
            let p = $('<p></p>').addClass(value.status).text(message);
            result_disp.append(p);
          } else if (key === 'error') {
            let p = $('<p></p>').addClass(value.status).text(value.message);
            result_disp.append(p);
          }
        });
      })
      .catch((error) => {
        // エラーハンドリング
        console.error("エラーが発生しました: ", error);
        let p = $('<p></p>').addClass('error').text("エラーが発生しました。");
        result_disp.append(p);
      })
      .finally(() => {
        //ローディングマーク消去
        removeLoading('', $('#itmar_send_exec'));
        //アニメーションの実行
        processAnimation(fieldset_objs.eq(1), fieldset_objs.eq(2), true);
        //プログレスエリアの処理
        process_change($(this).parent().parent().nextAll('.figure_fieldset').first(), true);
      });

  });

  //ホームに戻るボタンの処理
  $('#to_home').on('submit', function (e) {
    e.preventDefault();
    let redirectUrl = $(this).data('selected_page');
    //画面遷移
    // $(this).parent().removeClass('appear');
    // $(this).parent().siblings('.first_appear').addClass('appear');
    //プログレスエリアの処理
    // $('.wp-block-itmar-design-process').find('li').each(function (index) {
    //   if (index > 0) {
    //     $(this).removeClass('ready');
    //   }
    // });
    //リダイレクト
    window.location.href = redirectUrl;
  });
});