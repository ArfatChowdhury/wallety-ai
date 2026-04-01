const { withDangerousMod, withAndroidManifest } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Expo Config Plugin to persist Android Widget files and configuration.
 */
module.exports = function withWidget(config) {
  // 1. Copy Native Files (Java/Kotlin and Resources)
  config = withDangerousMod(config, [
    'android',
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const platformRoot = config.modRequest.platformProjectRoot;
      
      const widgetSourceDir = path.join(projectRoot, 'plugins', 'widgets');
      const resDir = path.join(platformRoot, 'app', 'src', 'main', 'res');
      const javaDir = path.join(platformRoot, 'app', 'src', 'main', 'java', 'com', 'wallety', 'budgettracker', 'widget');

      // Helper to ensure directory exists
      const ensureDir = (dir) => {
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      };

      // A. Copy XML Info
      const xmlSrc = path.join(widgetSourceDir, 'xml', 'expense_widget_info.xml');
      const xmlDestDir = path.join(resDir, 'xml');
      if (fs.existsSync(xmlSrc)) {
        ensureDir(xmlDestDir);
        fs.copyFileSync(xmlSrc, path.join(xmlDestDir, 'expense_widget_info.xml'));
        console.log('✅ Copied expense_widget_info.xml');
      }

      // B. Copy Layout
      const layoutSrc = path.join(widgetSourceDir, 'layout', 'widget_loading.xml');
      const layoutDestDir = path.join(resDir, 'layout');
      if (fs.existsSync(layoutSrc)) {
        ensureDir(layoutDestDir);
        fs.copyFileSync(layoutSrc, path.join(layoutDestDir, 'widget_loading.xml'));
        console.log('✅ Copied widget_loading.xml');
      }

      // C. Copy Java/Kotlin Source
      const kotlinSrc = path.join(widgetSourceDir, 'java', 'ExpenseWidgetProvider.kt');
      if (fs.existsSync(kotlinSrc)) {
        ensureDir(javaDir);
        fs.copyFileSync(kotlinSrc, path.join(javaDir, 'ExpenseWidgetProvider.kt'));
        console.log('✅ Copied ExpenseWidgetProvider.kt');
      }

      return config;
    },
  ]);

  // 2. Update AndroidManifest.xml
  config = withAndroidManifest(config, async (config) => {
    const mainApplication = config.modResults.manifest.application[0];
    
    // Ensure receivers array exists
    if (!mainApplication.receiver) {
      mainApplication.receiver = [];
    }

    const widgetReceiverName = 'com.wallety.budgettracker.widget.ExpenseWidgetProvider';
    
    // Check if receiver already exists
    const existing = mainApplication.receiver.find(
      (r) => r.$['android:name'] === widgetReceiverName
    );

    if (!existing) {
      mainApplication.receiver.push({
        $: {
          'android:name': widgetReceiverName,
          'android:exported': 'true',
        },
        'intent-filter': [
          {
            action: [
              {
                $: { 'android:name': 'android.appwidget.action.APPWIDGET_UPDATE' },
              },
            ],
          },
        ],
        'meta-data': [
          {
            $: {
              'android:name': 'android.appwidget.provider',
              'android:resource': '@xml/expense_widget_info',
            },
          },
        ],
      });
      console.log('✅ Added Widget Receiver to AndroidManifest.xml');
    }

    return config;
  });

  return config;
};
