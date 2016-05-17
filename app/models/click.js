var db = require('../config');
var Link = require('./link.js');

var Click = db.Model.extend({
  tableName: 'clicks',
  hasTimestamps: true,
  link: function() {
    console.log('clicks');
    return this.belongsTo(Link, 'linkId');
  }
});

module.exports = Click;
