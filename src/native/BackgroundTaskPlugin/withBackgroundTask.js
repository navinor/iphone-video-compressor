const { withInfoPlist } = require('expo/config-plugins');

const withBackgroundTask = (config) => {
  return withInfoPlist(config, (config) => {
    config.modResults.BGTaskSchedulerPermittedIdentifiers = [
      'com.warhax.videocompressor.compression',
    ];
    return config;
  });
};

module.exports = withBackgroundTask;
