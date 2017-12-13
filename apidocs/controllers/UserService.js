'use strict';

exports.apiAdminuserPOST = function(args, res, next) {
  /**
   * 管理者ユーザー作成
   * 管理者ロールを持ったユーザー admin を作成します。ブロックチェーン環境構築直後に一回だけ実行します。
   *
   * body AdminUserRequest  (optional)
   * no response value expected for this operation
   **/
  res.end();
}

exports.apiLoginPOST = function(args, res, next) {
  /**
   * ユーザー認証
   * ユーザーID、パスワードを用いて認証します。ここで取得されるtokenを他のAPIの認証に使用します
   *
   * body LoginRequest  (optional)
   * returns LoginResult
   **/
  var examples = {};
  examples['application/json'] = {
  "message" : "aeiou",
  "status" : true,
  "token" : "aeiou"
};
  if (Object.keys(examples).length > 0) {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(examples[Object.keys(examples)[0]] || {}, null, 2));
  } else {
    res.end();
  }
}

exports.apiUserDELETE = function(args, res, next) {
  /**
   * ユーザー削除
   * ユーザーを削除する
   *
   * body UserIdRequest  (optional)
   * no response value expected for this operation
   **/
  res.end();
}

exports.apiUserGET = function(args, res, next) {
  /**
   * ユーザー取得
   * 登録済みのユーザーを取得する
   *
   * body UserIdRequest  (optional)
   * returns UserResult
   **/
  var examples = {};
  examples['application/json'] = {
  "password" : "aeiou",
  "created" : "aeiou",
  "loggedin" : "aeiou",
  "name" : "aeiou",
  "id" : "aeiou"
};
  if (Object.keys(examples).length > 0) {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(examples[Object.keys(examples)[0]] || {}, null, 2));
  } else {
    res.end();
  }
}

exports.apiUserPOST = function(args, res, next) {
  /**
   * ユーザー作成／更新
   * ユーザーを新規に作成（または更新）する
   *
   * body UserRequest  (optional)
   * no response value expected for this operation
   **/
  res.end();
}

exports.apiUsersGET = function(args, res, next) {
  /**
   * ユーザー一覧取得
   * 登録済みのユーザーの一覧を取得する
   *
   * body UserRequest  (optional)
   * returns List
   **/
  var examples = {};
  examples['application/json'] = [ {
  "password" : "aeiou",
  "created" : "aeiou",
  "loggedin" : "aeiou",
  "name" : "aeiou",
  "id" : "aeiou"
} ];
  if (Object.keys(examples).length > 0) {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(examples[Object.keys(examples)[0]] || {}, null, 2));
  } else {
    res.end();
  }
}

