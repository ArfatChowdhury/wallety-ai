const { withDangerousMod, withAppBuildGradle, withGradleProperties } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Expo Config Plugin to persist Android Signing configuration across prebuilds.
 */
module.exports = function withAndroidSigning(config) {
  // 1. Update gradle.properties using proper Expo API
  config = withGradleProperties(config, (config) => {
    const updateProperty = (key, value) => {
      const item = config.modResults.find(i => i.type === 'property' && i.key === key);
      if (item) {
        item.value = value;
      } else {
        config.modResults.push({ type: 'property', key, value, valueType: 'string' });
      }
    };

    updateProperty('MYAPP_RELEASE_STORE_FILE', 'wallety-release.keystore');
    updateProperty('MYAPP_RELEASE_KEY_ALIAS', process.env.RELEASE_KEY_ALIAS || 'wallety-alias');
    updateProperty('MYAPP_RELEASE_STORE_PASSWORD', process.env.RELEASE_STORE_PASSWORD || 'YOUR_STORE_PASSWORD');
    updateProperty('MYAPP_RELEASE_KEY_PASSWORD', process.env.RELEASE_KEY_PASSWORD || 'YOUR_KEY_PASSWORD');
    updateProperty('reactNativeArchitectures', 'arm64-v8a'); // Force 64-bit to save memory

    return config;
  });

  // 2. Patch app/build.gradle safely using withAppBuildGradle
  config = withAppBuildGradle(config, (config) => {
    let buildGradle = config.modResults.contents;

    if (!buildGradle.includes('release {') || !buildGradle.includes('MYAPP_RELEASE_STORE_FILE')) {
      const releaseSigningBlock = `
        release {
            if (project.hasProperty('MYAPP_RELEASE_STORE_FILE')) {
                storeFile file(MYAPP_RELEASE_STORE_FILE)
                storePassword MYAPP_RELEASE_STORE_PASSWORD
                keyAlias MYAPP_RELEASE_KEY_ALIAS
                keyPassword MYAPP_RELEASE_KEY_PASSWORD
            }
        }`;
      if (buildGradle.includes('signingConfigs {')) {
        buildGradle = buildGradle.replace(/(signingConfigs\s*\{[\s\S]*?debug\s*\{[\s\S]*?\n\s*\})/, `$1${releaseSigningBlock}`);
      }
    }

    const releaseBuildTypeRegex = /(buildTypes\s*\{[\s\S]*?release\s*\{[\s\S]*?)signingConfig\s+signingConfigs\.debug/;
    if (releaseBuildTypeRegex.test(buildGradle)) {
      buildGradle = buildGradle.replace(releaseBuildTypeRegex, '$1signingConfig signingConfigs.release');
    }

    config.modResults.contents = buildGradle;
    return config;
  });

  // 3. Copy Keystore File using withDangerousMod
  config = withDangerousMod(config, [
    'android',
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const platformRoot = config.modRequest.platformProjectRoot;

      const keystoreSrc = path.join(projectRoot, 'wallety-release.keystore');
      const keystoreDest = path.join(platformRoot, 'app', 'wallety-release.keystore');
      
      if (fs.existsSync(keystoreSrc)) {
        fs.copyFileSync(keystoreSrc, keystoreDest);
        console.log('✅ Copied wallety-release.keystore to android/app');
      } else {
        console.warn('⚠️ wallety-release.keystore not found in project root!');
      }

      return config;
    },
  ]);

  return config;
};
