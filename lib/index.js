module.exports = function (config) {
  require('./common')(config)
  if (config.backend) require('./backend')(config)
}
