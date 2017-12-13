'use strict';

var url = require('url');

var Message = require('./MessageService');

module.exports.apiMessageGET = function apiMessageGET (req, res, next) {
  Message.apiMessageGET(req.swagger.params, res, next);
};

module.exports.apiMessagePOST = function apiMessagePOST (req, res, next) {
  Message.apiMessagePOST(req.swagger.params, res, next);
};

module.exports.apiQueryByThreadIdPOST = function apiQueryByThreadIdPOST (req, res, next) {
  Message.apiQueryByThreadIdPOST(req.swagger.params, res, next);
};

module.exports.apiQueryThreadsPOST = function apiQueryThreadsPOST (req, res, next) {
  Message.apiQueryThreadsPOST(req.swagger.params, res, next);
};
