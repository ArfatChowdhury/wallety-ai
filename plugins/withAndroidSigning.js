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
      const gradlePropertiesPath = path.join(platformRoot, 'gradle.properties');
      let gradleProperties = fs.readFileSync(gradlePropertiesPath, 'utf8');

      const signingProps = [
        `MYAPP_RELEASE_STORE_FILE=wallety-release.keystore`,
        `MYAPP_RELEASE_KEY_ALIAS=${process.env.RELEASE_KEY_ALIAS || 'wallety-key'}`,
        `MYAPP_RELEASE_STORE_PASSWORD=${process.env.RELEASE_STORE_PASSWORD || 'YOUR_STORE_PASSWORD'}`,
        `MYAPP_RELEASE_KEY_PASSWORD=${process.env.RELEASE_KEY_PASSWORD || 'YOUR_KEY_PASSWORD'}`,
      ];

      signingProps.forEach(prop => {
        const key = prop.split('=')[0];
        if (!gradleProperties.includes(key)) {
          gradleProperties += `\n${prop}`;
        } else {
          gradleProperties = gradleProperties.replace(new RegExp(`${key}=.*`), prop);
        }
      });

      fs.writeFileSync(gradlePropertiesPath, gradleProperties);
      console.log('✅ Updated android/gradle.properties');

      // 3. Patch app/build.gradle
      const buildGradlePath = path.join(platformRoot, 'app', 'build.gradle');
      let buildGradle = fs.readFileSync(buildGradlePath, 'utf8');

      // A. Create the release signing configurations block if needed
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
          
          // Inject it into the signingConfigs block
          // We look for signingConfigs { and some content, then inject our release block
          if (buildGradle.includes('signingConfigs {')) {
              // Be careful with where we inject to avoid nested block errors
              // This is a safer injection point: after the debug block
              buildGradle = buildGradle.replace(/(signingConfigs\s*\{[\s\S]*?debug\s*\{[\s\S]*?\n\s*\})/, `$1${releaseSigningBlock}`);
          }
      }

      // B. Ensure release build type uses the release signing config
      // Expo's default build.gradle often has release { signingConfig signingConfigs.debug }
      // We want to replace it specifically for the "release" build type block
      const releaseBuildTypeRegex = /(buildTypes\s*\{[\s\S]*?release\s*\{[\s\S]*?)signingConfig\s+signingConfigs\.debug/;
      if (releaseBuildTypeRegex.test(buildGradle)) {
          buildGradle = buildGradle.replace(releaseBuildTypeRegex, '$1signingConfig signingConfigs.release');
      }

      fs.writeFileSync(buildGradlePath, buildGradle);
      console.log('✅ Patched android/app/build.gradle safely');

      return config;
    },
  ]);
};
