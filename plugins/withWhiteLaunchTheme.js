const { withAndroidColors, withAndroidColorsNight, withAndroidStyles } = require('@expo/config-plugins');

module.exports = (config) => {
  // 1. Force day colors to white
  config = withAndroidColors(config, (c) => {
    c.modResults.resources.color = c.modResults.resources.color || [];
    const setOrUpdateColor = (name, value) => {
      const existing = c.modResults.resources.color.find(color => color.$.name === name);
      if (existing) {
        existing._ = value;
      } else {
        c.modResults.resources.color.push({ $: { name }, _: value });
      }
    };
    
    setOrUpdateColor('splashBackground', '#FFFFFF');
    setOrUpdateColor('splashscreen_background', '#FFFFFF');
    return c;
  });

  // 2. Force night colors to white as well
  config = withAndroidColorsNight(config, (c) => {
    c.modResults = c.modResults || { resources: { color: [] } };
    c.modResults.resources = c.modResults.resources || { color: [] };
    c.modResults.resources.color = c.modResults.resources.color || [];
    
    const setOrUpdateColor = (name, value) => {
      const existing = c.modResults.resources.color.find(color => color.$.name === name);
      if (existing) {
        existing._ = value;
      } else {
        c.modResults.resources.color.push({ $: { name }, _: value });
      }
    };
    
    setOrUpdateColor('splashBackground', '#FFFFFF');
    setOrUpdateColor('splashscreen_background', '#FFFFFF');
    return c;
  });

  // 3. Update styles sequentially without duplicates
  config = withAndroidStyles(config, (c) => {
    const styles = c.modResults.resources.style || [];
    const splashTheme = styles.find(s => s.$.name?.includes('SplashScreen'));
    if (splashTheme) {
      splashTheme.item = splashTheme.item || [];
      
      const setOrUpdateItem = (name, value) => {
        const bgIndex = splashTheme.item.findIndex(i => i.$.name === name);
        if (bgIndex > -1) {
          splashTheme.item[bgIndex]._ = value;
        } else {
          splashTheme.item.push({ $: { name }, _: value });
        }
      };

      setOrUpdateItem('android:windowBackground', '@color/splashBackground');
      setOrUpdateItem('android:windowSplashScreenBackground', '@color/splashBackground');
      setOrUpdateItem('windowSplashScreenBackground', '@color/splashBackground');
      
      // CRITICAL FIX: Removes the automatic white circular/square background 
      // Android 12+ forces behind the logo image!
      setOrUpdateItem('android:windowSplashScreenIconBackgroundColor', '@android:color/transparent');
    }
    return c;
  });

  return config;
};
