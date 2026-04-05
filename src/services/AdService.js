import { 
  InterstitialAd, 
  AdEventType, 
  TestIds,
  BannerAd,
  BannerAdSize,
  NativeAdView,
  NativeMediaView,
  HeadlineView,
  TaglineView,
  CallToActionButton,
  IconView,
  AppOpenAd,
  useForeground
} from 'react-native-google-mobile-ads';
import { View, Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React from 'react';
import { AppContext } from '../Contex/ContextApi';

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
const USE_TEST_IDS = false; // SET TO FALSE FOR PRODUCTION
const AD_IDS = USE_TEST_IDS ? AD_UNIT_IDS : PROD_AD_UNIT_IDS;

export class AdService {
  static isPremiumUser = false; // Set globally from ContextApi
  
  // Interstitial ad instances
  static appOpenInterstitial = null;
  static receiptScanInterstitial = null;
  static pdfExportInterstitial = null;
  static budgetInterstitial = null;
  static aiInsightsInterstitial = null;
  static appOpenAd = null;

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

  // Initialize all ads
  static initializeAds() {
    this.appOpenInterstitial = this.loadInterstitial('app-open');
    this.receiptScanInterstitial = this.loadInterstitial('receipt-scan');
    this.pdfExportInterstitial = this.loadInterstitial('pdf-export');
    this.budgetInterstitial = this.loadInterstitial('budget');
    this.aiInsightsInterstitial = this.loadInterstitial('ai-insights');

    // Initialize App Open Ad
    this.appOpenAd = AppOpenAd.createForAdRequest(AD_IDS.INTERSTITIAL, {
      requestNonPersonalizedAdsOnly: true,
    });
    this.appOpenAd.load();
  }

  // Helper to show interstitial and wait for it to close
  static showInterstitialAndWait(ad, type) {
    if (!ad || !ad.loaded) {
      console.log(`[AdService] ${type} ad not loaded, skipping flow wait`);
      ad?.load(); // Start loading for next time
      return Promise.resolve(false);
    }

    return new Promise((resolve) => {
      let isResolved = false;

      const finish = (result) => {
        if (isResolved) return;
        isResolved = true;
        closedSub();
        errorSub();
        resolve(result);
      };

      const closedSub = ad.addAdEventListener(AdEventType.CLOSED, () => {
        console.log(`[AdService] ${type} ad closed, continuing...`);
        finish(true);
      });

      const errorSub = ad.addAdEventListener(AdEventType.ERROR, (error) => {
        console.error(`[AdService] ${type} ad error:`, error);
        finish(false);
      });

      ad.show();
    });
  }

  // Show app open ad (once per 24 hours)
  static async showAppOpenAd() {
    if (this.isPremiumUser) return false;
    try {
      // Show ad every time (throttle removed)
      if (this.appOpenAd?.loaded) {
          const success = await this.showInterstitialAndWait(this.appOpenAd, 'app-open');
          return success;
      } else {
          console.log('[AdService] App open ad not loaded yet');
          this.appOpenAd?.load(); // Try loading for next time
          return false;
      }
      return false;
    } catch (error) {
      console.error('[AdService] Error showing app open ad:', error);
      return false;
    }
  }

  // Show receipt scan interstitial
  static async showReceiptScanAd() {
    if (this.isPremiumUser) return true;
    return this.showInterstitialAndWait(this.receiptScanInterstitial, 'receipt-scan');
  }

  // Show PDF export interstitial
  static async showPdfExportAd() {
    if (this.isPremiumUser) return true;
    return this.showInterstitialAndWait(this.pdfExportInterstitial, 'pdf-export');
  }

  // Show Budget interstitial
  static async showBudgetAd() {
    if (this.isPremiumUser) return true;
    return this.showInterstitialAndWait(this.budgetInterstitial, 'budget');
  }

  // Show AI Insights interstitial
  static async showAiInsightsAd() {
    if (this.isPremiumUser) return true;
    return this.showInterstitialAndWait(this.aiInsightsInterstitial, 'ai-insights');
  }

  // Check if any ad is ready
  static isAdReady(type) {
    switch (type) {
      case 'app-open':
        return this.appOpenAd?.loaded || false;
      case 'receipt-scan':
        return this.receiptScanInterstitial?.loaded || false;
      case 'pdf-export':
        return this.pdfExportInterstitial?.loaded || false;
      case 'ai-insights':
        return this.aiInsightsInterstitial?.loaded || false;
      default:
        return false;
    }
  }
}

// Banner Ad Component with fallback
export const BannerAdComponent = ({ style = {} }) => {
  const { isPremium } = React.useContext(AppContext);
  const [showAd, setShowAd] = React.useState(true);

  if (isPremium) return null;
  
  try {
    return showAd ? (
      <View style={[{ width: '100%', alignItems: 'center', minHeight: 60, justifyContent: 'center' }, style]}>
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
        />
      </View>
    ) : null;
  } catch (error) {
    console.error('[AdService] Banner ad error:', error);
    return null;
  }
};

// Native Ad Component for Lists with safe implementation
export const NativeAdComponent = ({ style = {} }) => null;

// Helper to insert ads into transaction list with fallback
export const insertAdsIntoTransactionList = (transactions) => {
  try {
    if (!transactions || transactions.length === 0) return [];
    return transactions.flatMap((item, index) => {
      // Insert an ad after every 3rd transaction, but only if NOT premium
      if (!AdService.isPremiumUser && (index + 1) % 3 === 0) {
        return [item, { type: 'AD', id: `trans_ad_${index}` }];
      }
      return [item];
    });
  } catch (error) {
    console.error('[AdService] Error inserting ads into transaction list:', error);
    return transactions;
  }
};

// Helper to insert ads into budget list with fallback
export const insertAdsIntoBudgetList = (budgetItems) => {
  try {
    if (!budgetItems || budgetItems.length === 0) return [];
    return budgetItems.flatMap((item, index) => {
      // Insert every 3rd item, but only if NOT premium
      if (!AdService.isPremiumUser && (index + 1) % 3 === 0) {
        return [item, { type: 'AD', id: `ad_${index}` }];
      }
      return [item];
    });
  } catch (error) {
    console.error('[AdService] Error inserting ads into budget list:', error);
    return budgetItems;
  }
};

export default AdService;
