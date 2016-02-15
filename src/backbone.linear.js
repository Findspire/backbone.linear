/* eslint-env amd, browser, node */
/* eslint no-mixed-requires: 0 */

"use strict";

var flat = require("flat"), globalVar = typeof global !== "undefined" ? global : window,
  factory = function (_, Backbone) {
    /* *****************************
         BACKBONE-LINEAR-PRIVATE
    ***************************** */
    var transformToArray = function (object, forceArray) {
      var objInPath;
      _.each(forceArray, function (path) {
        if (_.isArray(object[path])) {
          return;
        } else if (object[path] != null) {
          object[path] = [object[path]];
        } else {
          objInPath = {};
          object = _.chain(object).pairs().map(function (pair) {
            var key = pair[0], val = pair[1];
            if (key.match(RegExp("^" + path))) {
              objInPath[key.match(/\.(\w+)$/)[1]] = val;
              return null;
            } else {
              return [key, val];
            }
          }).compact().object().value();
          object[path] = _.size(objInPath) ? [objInPath] : [];
        }
      });
      return object;
    },

      LinearModel = Backbone.Model.extend({

        /* ********************
             BACKBONE 1.2.1
        ******************** */
        parse: function (resp, options) {
          var parentCall = Backbone.Model.prototype.parse.call(this, resp, options),
            flatOptions;
          switch (true) {
          case parentCall == null:
          case parentCall === "":
          case parentCall instanceof this.constructor:
            return parentCall;
          }
          flatOptions = _.clone(_.result(this, "flatOptions"));
          if (_.isArray(flatOptions.forceArray)) {
            flatOptions.safe = true;
            return transformToArray(
              LinearModel.flatten(parentCall, flatOptions),
              flatOptions.forceArray
            );
          } else {
            return LinearModel.flatten(parentCall, flatOptions);
          }
        },

        sync: function (method, model, options) {
          var opts;
          if (options == null) {
            options = {};
          }
          if (method === "create" || method === "update" || method === "patch") {
            opts = _.extend({}, options,
              method === "patch" ? {attrs: LinearModel.unflatten(
                options.attrs,
                _.result(this, "flatOptions")
              )} : {unflat: true}
            );
          }
          return Backbone.Model.prototype.sync.call(this, method, model, opts || options);
        },

        toJSON: function (options) {
          if (options == null) {
            options = {};
          }
          if (options.unflat) {
            return LinearModel.unflatten(
              Backbone.Model.prototype.toJSON.call(this, options),
              _.result(this, "flatOptions")
            );
          } else {
            return Backbone.Model.prototype.toJSON.call(this, options);
          }
        },


        /* ****************************
             BACKBONE-LINEAR-PUBLIC
        **************************** */
        flatOptions: function () {
          return {safe: true};
        }

      }, {

        /* ****************
             FLAT 1.6.0
        **************** */
        flatten: function (target, opts) {
          if (opts != null && opts.safe == null) {
            opts.safe = true;
          }
          if (opts && opts.whitelist) {
            return _.extend(_.omit(target, opts.whitelist), flat.flatten(_.pick(target, opts.whitelist), opts));
          } else {
            return flat.flatten(target, opts);
          }
        },

        unflatten: function (target, opts) {
          if (opts && opts.whitelist) {
            var keys = [];
            _.forEach(target, function(val, key) {
                var root = key.split(opts.delimiter || '.')[0];
                if (_.includes(opts.whitelist, root)) {
                    keys.push(key);
                }
            });
            return _.extend(_.omit(target, keys), flat.unflatten(_.pick(target, keys), opts));
          } else {
            return flat.unflatten(target, opts);
          }
        },

      });

    Backbone.LinearModel = LinearModel;
    return LinearModel;
  };

module.exports = factory(
  globalVar._ || require("underscore"),
  globalVar.Backbone || require("backbone")
);
