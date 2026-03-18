import { 
  InterstitialAd, 
  AdEventType, 
  TestIds,
  BannerAd,
  BannerAdSize,
  NativeAd,
  NativeMediaView,
  useForeground
} from 'react-native-google-mobile-ads';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React from 'react';

// TEST AD UNIT IDs (use during development)
export const AD_UNIT_IDS = {
  BANNER: TestIds.BANNER,
  INTERSTITIAL: TestIds.INTERSTITIAL,
  NATIVE: TestIds.NATIVE_ADVANCED,
};

// Production IDs (replace test IDs)
export const PROD_AD_UNIT_IDS = {
  BANNER: 'ca-app-pub-3315420037530922/9815413554',
  INTERSTITIAL: 'ca-app-pub-3315420037530922/2612411656',
  NATIVE: 'ca-app-pub-3315420037530922/1936923533',
};

// Use test IDs during development
const USE_TEST_IDS = false; // Set to false to use production IDs
const AD_IDS = USE_TEST_IDS ? AD_UNIT_IDS : PROD_AD_UNIT_IDS;

export class AdService {
  // Interstitial ad instances
  static appOpenInterstitial = null;
  static receiptScanInterstitial = null;
  static pdfExportInterstitial = null;

  // Load interstitial ads
  static loadInterstitial(type) {
    try {
      const adUnitId = AD_IDS.INTERSTITIAL;
      const interstitial = InterstitialAd.createForAdRequest(adUnitId, {
        requestNonPersonalizedAdsOnly: true,
      });

      interstitial.addAdEventListener(AdEventType.LOADED, () => {
        console.log(`[AdService] ${type} interstitial loaded`);
      });

      interstitial.addAdEventListener(AdEventType.ERROR, (error) => {
        console.error(`[AdService] ${type} interstitial error:`, error);
      });

      interstitial.addAdEventListener(AdEventType.CLOSED, () => {
        console.log(`[AdService] ${type} interstitial closed`);
        // Reload the ad for next use
        this.loadInterstitial(type);
      });

      interstitial.load();
      return interstitial;
    } catch (error) {
      console.error(`[AdService] Failed to load ${type} interstitial:`, error);
      return null;
    }
  }

  // Initialize all interstitial ads
  static initializeAds() {
    this.appOpenInterstitial = this.loadInterstitial('app-open');
    this.receiptScanInterstitial = this.loadInterstitial('receipt-scan');
    this.pdfExportInterstitial = this.loadInterstitial('pdf-export');
  }

  // Show app open interstitial (once per 24 hours)
  static async showAppOpenAd() {
    try {
      const lastShown = await AsyncStorage.getItem('last_interstitial');
      const now = Date.now();
      
      if (!lastShown || now - parseInt(lastShown) > 86400000) { // 24 hours
        if (this.appOpenInterstitial?.loaded) {
          await this.appOpenInterstitial.show();
          await AsyncStorage.setItem('last_interstitial', now.toString());
          console.log('[AdService] App open interstitial shown');
          return true;
        } else {
          console.log('[AdService] App open ad not loaded yet');
          return false;
        }
      } else {
        console.log('[AdService] App open ad shown recently, skipping');
        return false;
      }
    } catch (error) {
      console.error('[AdService] Error showing app open ad:', error);
      return false;
    }
  }

  // Show receipt scan interstitial
  static async showReceiptScanAd() {
    try {
      if (this.receiptScanInterstitial?.loaded) {
        await this.receiptScanInterstitial.show();
        console.log('[AdService] Receipt scan interstitial shown');
        return true;
      } else {
        console.log('[AdService] Receipt scan ad not loaded yet');
        // Reload for next time
        this.receiptScanInterstitial = this.loadInterstitial('receipt-scan');
        return false;
      }
    } catch (error) {
      console.error('[AdService] Error showing receipt scan ad:', error);
      return false;
    }
  }

  // Show PDF export interstitial
  static async showPdfExportAd() {
    try {
      if (this.pdfExportInterstitial?.loaded) {
        await this.pdfExportInterstitial.show();
        console.log('[AdService] PDF export interstitial shown');
        return true;
      } else {
        console.log('[AdService] PDF export ad not loaded yet');
        // Reload for next time
        this.pdfExportInterstitial = this.loadInterstitial('pdf-export');
        return false;
      }
    } catch (error) {
      console.error('[AdService] Error showing PDF export ad:', error);
      return false;
    }
  }

  // Check if any ad is ready
  static isAdReady(type) {
    switch (type) {
      case 'app-open':
        return this.appOpenInterstitial?.loaded || false;
      case 'receipt-scan':
        return this.receiptScanInterstitial?.loaded || false;
      case 'pdf-export':
        return this.pdfExportInterstitial?.loaded || false;
      default:
        return false;
    }
  }
}

// Banner Ad Component with fallback
export const BannerAdComponent = ({ style = {} }) => {
  const [showAd, setShowAd] = React.useState(true);
  
  try {
    return showAd ? (
      <BannerAd
        unitId={AD_IDS.BANNER}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{
          requestNonPersonalizedAdsOnly: true,
        }}
        onAdFailedToLoad={(error) => {
          console.log('[AdService] Banner ad failed to load:', error);
          setShowAd(false); // Hide ad slot if it fails
        }}
        onAdLoaded={() => {
          setShowAd(true); // Show ad when loaded
        }}
        style={[{ width: '100%', alignItems: 'center' }, style]}
      />
    ) : null;
  } catch (error) {
    console.error('[AdService] Banner ad error:', error);
    return null;
  }
};

// Native Ad Component for Budget Screen with fallback
export const NativeAdComponent = ({ style = {} }) => {
  const [showAd, setShowAd] = React.useState(true);
  
  try {
    return showAd ? (
      <NativeAd
        unitId={AD_IDS.NATIVE}
        requestOptions={{
          requestNonPersonalizedAdsOnly: true,
        }}
        onAdFailedToLoad={(error) => {
          console.log('[AdService] Native ad failed to load:', error);
          setShowAd(false); // Hide ad slot if it fails
        }}
        onAdLoaded={() => {
          setShowAd(true); // Show ad when loaded
        }}
        style={[{ width: '100%', borderRadius: 12, overflow: 'hidden' }, style]}
      >
        <NativeAd.View style={{ 
          backgroundColor: '#fff', 
          borderRadius: 12, 
          padding: 16, 
          marginVertical: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
        }}>
          <NativeAd.IconView style={{ width: 50, height: 50, borderRadius: 8 }} />
          <NativeAd.HeadlineView style={{ 
            fontSize: 16, 
            fontWeight: 'bold', 
            color: '#1e293b',
            marginTop: 8,
          }} />
          <NativeAd.TaglineView style={{ 
            fontSize: 14, 
            color: '#64748b',
            marginTop: 4,
          }} />
          <NativeAd.AdvertiserView style={{ 
            fontSize: 12, 
            color: '#94a3b8',
            marginTop: 4,
          }} />
          <NativeMediaView style={{ 
            width: '100%', 
            height: 120, 
            borderRadius: 8, 
            marginTop: 8 
          }} />
          <NativeAd.CallToActionView style={{
            backgroundColor: '#16a34a',
            color: '#fff',
            padding: 12,
            borderRadius: 8,
            alignItems: 'center',
            marginTop: 12,
            fontSize: 16,
            fontWeight: 'bold',
          }} />
          {/* Small "Ad" label for compliance */}
          <NativeAd.AdBadgeView style={{
            position: 'absolute',
            top: 8,
            right: 8,
            backgroundColor: '#e2e8f0',
            color: '#64748b',
            fontSize: 10,
            paddingHorizontal: 6,
            paddingVertical: 2,
            borderRadius: 4,
          }} />
        </NativeAd.View>
      </NativeAd>
    ) : null;
  } catch (error) {
    console.error('[AdService] Native ad error:', error);
    return null;
  }
};

// Helper to insert ads into budget list with fallback
export const insertAdsIntoBudgetList = (budgetItems) => {
  try {
    return budgetItems.flatMap((item, index) => {
      if ((index + 1) % 3 === 0) {
        return [item, { type: 'AD', id: `ad_${index}` }];
      }
      return [item];
    });
  } catch (error) {
    console.error('[AdService] Error inserting ads into budget list:', error);
    return budgetItems; // Return original list if error occurs
  }
};

export default AdService;
