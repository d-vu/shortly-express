var db = require('../config');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');



var User = db.Model.extend({
  tableName: 'users',
  initialize: function() {
    this.on('creating', function(model, attrs, options) {
      return new Promise( function(resolve, reject) {
        bcrypt.hash(model.get('password'), null, null, function(err, hash) {
          if (err) { 
            reject(err);
          } else {
            model.set('password', hash);
            resolve(hash);
          }
        });
      });
    });
  }
});

module.exports = User;