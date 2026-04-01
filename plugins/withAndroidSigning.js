const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Expo Config Plugin to persist Android Signing configuration across prebuilds.
 */
module.exports = function withAndroidSigning(config) {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const platformRoot = config.modRequest.platformProjectRoot;

      // 1. Copy Keystore File
      const keystoreSrc = path.join(projectRoot, 'wallety-release.keystore');
      const keystoreDest = path.join(platformRoot, 'app', 'wallety-release.keystore');
      
      if (fs.existsSync(keystoreSrc)) {
        fs.copyFileSync(keystoreSrc, keystoreDest);
        console.log('✅ Copied wallety-release.keystore to android/app');
      } else {
        console.warn('⚠️ wallety-release.keystore not found in project root!');
      }

      // 2. Update gradle.properties with signing variables
      // We use environment variables or fallback to placeholders
      const gradlePropertiesPath = path.join(platformRoot, 'gradle.properties');
      let gradleProperties = fs.readFileSync(gradlePropertiesPath, 'utf8');

      const signingProps = [
        `MYAPP_RELEASE_STORE_FILE=wallety-release.keystore`,
        `MYAPP_RELEASE_KEY_ALIAS=${process.env.RELEASE_KEY_ALIAS || 'YOUR_KEY_ALIAS'}`,
        `MYAPP_RELEASE_STORE_PASSWORD=${process.env.RELEASE_STORE_PASSWORD || 'YOUR_STORE_PASSWORD'}`,
        `MYAPP_RELEASE_KEY_PASSWORD=${process.env.RELEASE_KEY_PASSWORD || 'YOUR_KEY_PASSWORD'}`,
      ];

      signingProps.forEach(prop => {
        const key = prop.split('=')[0];
        if (!gradleProperties.includes(key)) {
          gradleProperties += `\n${prop}`;
        } else {
          // Update existing value if using env variables
          gradleProperties = gradleProperties.replace(new RegExp(`${key}=.*`), prop);
        }
      });

      fs.writeFileSync(gradlePropertiesPath, gradleProperties);
      console.log('✅ Updated android/gradle.properties with signing credentials');

      // 3. Patch app/build.gradle to use the release signing config
      const buildGradlePath = path.join(platformRoot, 'app', 'build.gradle');
      let buildGradle = fs.readFileSync(buildGradlePath, 'utf8');

      // Add release signing config if it doesn't exist
      if (!buildGradle.includes('signingConfigs {')) {
         // This should normally exist in a standard Expo/RN project
      }

      if (!buildGradle.includes('release {') || !buildGradle.includes('storeFile file(MYAPP_RELEASE_STORE_FILE)')) {
        const signingConfigPatch = `
    signingConfigs {
        debug {
            storeFile file('debug.keystore')
            storePassword 'android'
            keyAlias 'androiddebugkey'
            keyPassword 'android'
        }
        release {
            if (project.hasProperty('MYAPP_RELEASE_STORE_FILE')) {
                storeFile file(MYAPP_RELEASE_STORE_FILE)
                storePassword MYAPP_RELEASE_STORE_PASSWORD
                keyAlias MYAPP_RELEASE_KEY_ALIAS
                keyPassword MYAPP_RELEASE_KEY_PASSWORD
            }
        }
    }`;
        // Replace the entire signingConfigs block
        buildGradle = buildGradle.replace(/signingConfigs\s*\{[\s\S]*?\n\s*\}/, signingConfigPatch);
      }

      // Ensure release build type uses the release signing config
      buildGradle = buildGradle.replace(
        /release\s*\{[\s\S]*?signingConfig\s+signingConfigs\.debug/,
        (match) => match.replace('signingConfig signingConfigs.debug', 'signingConfig signingConfigs.release')
      );

      fs.writeFileSync(buildGradlePath, buildGradle);
      console.log('✅ Patched android/app/build.gradle for release signing');

      return config;
    },
  ]);
};
