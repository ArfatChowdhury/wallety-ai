const { withDangerousMod, withAndroidManifest } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

module.exports = function withNotificationIcon(config) {
  // Step 1: Copy the Vector XML file into the android drawable directory
  config = withDangerousMod(config, [
    'android',
    async (config) => {
      const srcFile = path.join(config.modRequest.projectRoot, 'assets', 'wallety_notif_silhouette.xml');
      const resDir = path.join(config.modRequest.platformProjectRoot, 'app', 'src', 'main', 'res', 'drawable');
      
      // Ensure the drawable directory exists
      if (!fs.existsSync(resDir)) {
        fs.mkdirSync(resDir, { recursive: true });
      }
      
      const destFile = path.join(resDir, 'wallety_notif_silhouette.xml');
      
      if (fs.existsSync(srcFile)) {
        fs.copyFileSync(srcFile, destFile);
        console.log("Successfully copied wallety_notif_silhouette.xml to Android res/drawable");
      } else {
        console.warn(`Could not find source notification icon at ${srcFile}`);
      }
      return config;
    },
  ]);

  // Step 2: Update AndroidManifest.xml to force Firebase/Expo to use this specific XML
  config = withAndroidManifest(config, async (config) => {
    const mainApplication = config.modResults.manifest.application[0];
    const metaData = mainApplication['meta-data'] || [];
    
    const defaultIconName = 'com.google.firebase.messaging.default_notification_icon';
    const expoIconName = 'expo.modules.notifications.default_notification_icon';
    const resourcePath = '@drawable/wallety_notif_silhouette';
    
    const addOrUpdateMetaData = (name, resource) => {
      const existing = metaData.find(item => item.$['android:name'] === name);
      if (existing) {
        existing.$['android:resource'] = resource;
      } else {
        metaData.push({ $: { 'android:name': name, 'android:resource': resource } });
      }
    };
    
    addOrUpdateMetaData(defaultIconName, resourcePath);
    addOrUpdateMetaData(expoIconName, resourcePath);
    
    mainApplication['meta-data'] = metaData;
    return config;
  });

  return config;
};
