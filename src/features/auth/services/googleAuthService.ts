import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { ENV } from '../config/env';

export const googleAuthService = {
  configure: () => {
    GoogleSignin.configure({
      webClientId: ENV.FIREBASE_WEB_CLIENT_ID,
      offlineAccess: true,
    });
  },
  signIn: async () => {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const userInfo = await GoogleSignin.signIn();
    return userInfo;
  },
  signOut: async () => {
    await GoogleSignin.signOut();
  }
};
