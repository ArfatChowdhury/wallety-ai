import { NativeModules, Platform } from 'react-native';

const { WalletyNotification } = NativeModules;

/**
 * NativeNotificationService
 * Acts as a bridge between JS and the Kotlin native notification module.
 * Falls back to expo-notifications on non-Android platforms or if native module is missing.
 */
const NativeNotificationService = {
  /**
   * showNotification
   * @param {string} title 
   * @param {string} body 
   * @param {string} channelId - 'wallety-transaction-native', 'wallety-reminder-native', etc.
   */
  showNotification: (title, body, channelId = 'wallety-transaction-native') => {
    if (Platform.OS === 'android' && WalletyNotification) {
      WalletyNotification.showNotification(title, body, channelId);
      return true;
    }
    return false;
  },

  /**
   * showTransactionNotification
   */
  showTransactionNotification: (title, body) => {
    if (Platform.OS === 'android' && WalletyNotification) {
      WalletyNotification.showTransactionNotification(title, body);
      return true;
    }
    return false;
  },

  /**
   * showBudgetNotification
   */
  showBudgetNotification: (title, body) => {
    if (Platform.OS === 'android' && WalletyNotification) {
      WalletyNotification.showBudgetNotification(title, body);
      return true;
    }
    return false;
  },

  /**
   * showReminderNotification
   */
  showReminderNotification: (title, body) => {
    if (Platform.OS === 'android' && WalletyNotification) {
      WalletyNotification.showReminderNotification(title, body);
      return true;
    }
    return false;
  },

  /**
   * createChannels (idempotent)
   */
  createChannels: () => {
    if (Platform.OS === 'android' && WalletyNotification) {
      WalletyNotification.createChannels();
    }
  }
};

export default NativeNotificationService;
