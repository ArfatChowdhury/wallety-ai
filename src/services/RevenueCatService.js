import Purchases from 'react-native-purchases';
import { Platform } from 'react-native';

const ENTITLEMENT_ID = 'wallety_pro';

class RevenueCatService {
  /**
   * Get available offerings from RevenueCat
   */
  static async getOfferings() {
    try {
      const offerings = await Purchases.getOfferings();
      if (offerings.current !== null && offerings.current.availablePackages.length !== 0) {
        return offerings.current.availablePackages;
      }
      return [];
    } catch (error) {
      console.error('Error fetching offerings:', error);
      throw error;
    }
  }

  /**
   * Purchase a specific package
   * @param {Object} packageToPurchase The RevenueCat package object
   */
  static async purchasePackage(packageToPurchase) {
    try {
      const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);
      if (typeof customerInfo.entitlements.active[ENTITLEMENT_ID] !== 'undefined') {
        return { success: true, customerInfo };
      }
      return { success: false, error: 'Purchase completed but entitlement not active' };
    } catch (error) {
      if (!error.userCancelled) {
        console.error('Error purchasing package:', error);
      }
      return { success: false, error: error.userCancelled ? 'Cancelled' : error.message, userCancelled: error.userCancelled };
    }
  }

  /**
   * Restore previous purchases
   */
  static async restorePurchases() {
    try {
      const customerInfo = await Purchases.restorePurchases();
      if (typeof customerInfo.entitlements.active[ENTITLEMENT_ID] !== 'undefined') {
        return { success: true, customerInfo };
      }
      return { success: false, error: 'No active premium subscriptions found' };
    } catch (error) {
      console.error('Error restoring purchases:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Sync Firebase UID with RevenueCat
   * @param {string} uid Firebase user ID
   */
  static async logIn(uid) {
    try {
      const { customerInfo, created } = await Purchases.logIn(uid);
      console.log(`[RevenueCat] logIn successful. Created: ${created}`);
      return customerInfo;
    } catch (error) {
      console.error('[RevenueCat] logIn error:', error);
      throw error;
    }
  }

  /**
   * Log out from RevenueCat (reverts to anonymous ID)
   */
  static async logOut() {
    try {
      await Purchases.logOut();
      console.log('[RevenueCat] logOut successful');
    } catch (error) {
      console.error('[RevenueCat] logOut error:', error);
    }
  }

  /**
   * Check if the user currently has an active subscription
   */
  static async checkSubscriptionStatus() {
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      if (typeof customerInfo.entitlements.active[ENTITLEMENT_ID] !== 'undefined') {
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error checking subscription status:', error);
      return false;
    }
  }
}

export default RevenueCatService;
