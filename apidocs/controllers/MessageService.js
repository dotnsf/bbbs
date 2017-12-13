'use strict';

exports.apiMessageGET = function(args, res, next) {
  /**
   * ログ取得
   * 登録済みの投稿メッセージを取得する
   *
   * body MessageIdRequest  (optional)
   * no response value expected for this operation
   **/
  res.end();
}

exports.apiMessagePOST = function(args, res, next) {
  /**
   * 投稿メッセージ作成
   * 投稿メッセージを新規に作成する
   *
   * body MessageRequest  (optional)
   * no response value expected for this operation
   **/
  res.end();
}

exports.apiQueryByThreadIdPOST = function(args, res, next) {
  /**
   * スレッドID検索
   * スレッドIDに合致するメッセージ一覧を取り出す
   *
   * body QueryByThreadIdRequest  (optional)
   * no response value expected for this operation
   **/
  res.end();
}

exports.apiQueryThreadsPOST = function(args, res, next) {
  /**
   * スレッド一覧
   * スレッド一覧を取り出す
   *
   * body QueryRequest  (optional)
   * no response value expected for this operation
   **/
  res.end();
}

