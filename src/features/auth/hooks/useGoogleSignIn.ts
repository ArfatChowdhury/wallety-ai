import { useState } from 'react';
import { googleAuthService } from '../services/googleAuthService';
import { firebaseAuth, auth } from '../../../config/firebase';

export const useGoogleSignIn = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signIn = async () => {
    setLoading(true);
    setError(null);
    try {
      googleAuthService.configure();
      const response = await googleAuthService.signIn();
      if (response.type === 'success' && response.data.idToken) {
        const googleCredential = auth.GoogleAuthProvider.credential(response.data.idToken);
        await firebaseAuth.signInWithCredential(googleCredential);
      } else if (response.type === 'cancelled') {
        console.log('Google Sign-In cancelled');
      } else {
        throw new Error('Google Sign-In failed or idToken is missing');
      }
    } catch (err: any) {
      console.error('Google Sign-In Error:', err);
      setError(err.message || 'An error occurred during Google Sign-In');
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      await googleAuthService.signOut();
      await firebaseAuth.signOut();
    } catch (err: any) {
      console.error('Sign-Out Error:', err);
      setError(err.message || 'An error occurred during Sign-Out');
    } finally {
      setLoading(false);
    }
  };

  return { signIn, signOut, loading, error };
};
