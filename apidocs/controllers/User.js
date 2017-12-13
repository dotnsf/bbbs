'use strict';

var url = require('url');

var User = require('./UserService');

module.exports.apiAdminuserPOST = function apiAdminuserPOST (req, res, next) {
  User.apiAdminuserPOST(req.swagger.params, res, next);
};

module.exports.apiLoginPOST = function apiLoginPOST (req, res, next) {
  User.apiLoginPOST(req.swagger.params, res, next);
};

module.exports.apiUserDELETE = function apiUserDELETE (req, res, next) {
  User.apiUserDELETE(req.swagger.params, res, next);
};

module.exports.apiUserGET = function apiUserGET (req, res, next) {
  User.apiUserGET(req.swagger.params, res, next);
};

module.exports.apiUserPOST = function apiUserPOST (req, res, next) {
  User.apiUserPOST(req.swagger.params, res, next);
};

module.exports.apiUsersGET = function apiUsersGET (req, res, next) {
  User.apiUsersGET(req.swagger.params, res, next);
};
