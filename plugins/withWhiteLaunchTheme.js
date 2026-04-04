const { withAndroidColors, withAndroidStyles } = require('@expo/config-plugins');

module.exports = (config) => {
  config = withAndroidColors(config, (c) => {
    c.modResults.resources.color = c.modResults.resources.color || [];
    // Ensure splashBackground is defined in colors.xml
    const existing = c.modResults.resources.color.find(color => color.$.name === 'splashBackground');
    if (!existing) {
      c.modResults.resources.color.push({ 
        $: { name: 'splashBackground' }, 
        _: '#FFFFFF' 
      });
    } else {
      existing._ = '#FFFFFF';
    }
    return c;
  });

  config = withAndroidStyles(config, (c) => {
    const styles = c.modResults.resources.style || [];
    const splashTheme = styles.find(s => s.$.name?.includes('SplashScreen'));
    if (splashTheme) {
      splashTheme.item = splashTheme.item || [];
      const bgIndex = splashTheme.item.findIndex(i => i.$.name === 'android:windowBackground');
      if (bgIndex > -1) {
        splashTheme.item[bgIndex]._ = '@color/splashBackground';
      } else {
        splashTheme.item.push({ 
          $: { name: 'android:windowBackground' }, 
          _: '@color/splashBackground' 
        });
      }
      
      // Fix for Android 12+ (forces the native Android 12 splash background to be white)
      splashTheme.item.push({
        $: { name: 'android:windowSplashScreenBackground' },
        _: '@color/splashBackground'
      });
      splashTheme.item.push({
        $: { name: 'windowSplashScreenBackground' },
        _: '@color/splashBackground'
      });
    }
    return c;
  });

  return config;
};
