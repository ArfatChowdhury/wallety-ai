import { useState } from 'react';
import { googleAuthService } from '../services/googleAuthService';
import { auth as jsAuth } from '../../../services/firebase';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';

export const useGoogleSignIn = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signIn = async () => {
    setLoading(true);
    setError(null);
    try {
      googleAuthService.configure();
      // Force account picker by signing out first
      try {
        await googleAuthService.signOut();
      } catch (e) {
        // Ignore errors if already signed out
      }
      const response = await googleAuthService.signIn();

      // Fix: Handle SignInResponse structure (v11+)
      let idToken = null;
      if (response.type === 'success') {
        idToken = response.data.idToken;
      }

      if (idToken) {
        const credential = GoogleAuthProvider.credential(idToken);
        await signInWithCredential(jsAuth, credential);
      } else if (response.type === 'cancelled') {
        console.log('Google Sign-In cancelled');
      } else {
        throw new Error('Google Sign-In failed: No ID Token received');
      }
    } catch (err: any) {
      if (err.code === 'ASYNC_OP_IN_PROGRESS') {
        console.log('Google Sign-In already in progress');
        return;
      }
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
      await jsAuth.signOut();
    } catch (err: any) {
      console.error('Sign-Out Error:', err);
      setError(err.message || 'An error occurred during Sign-Out');
    } finally {
      setLoading(false);
    }
  };

  return { signIn, signOut, loading, error };
};
