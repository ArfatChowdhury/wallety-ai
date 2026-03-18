import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View, Image } from 'react-native'
import React, { useState } from 'react'
import tailwind from 'twrnc'
import { Ionicons } from '@expo/vector-icons'
import * as WebBrowser from 'expo-web-browser'
import * as Google from 'expo-auth-session/providers/google'
import { GoogleAuthProvider, signInWithCredential, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { auth } from '../services/firebase'
import { COLORS, SHADOW } from '../theme' // <-- Fixed named import

WebBrowser.maybeCompleteAuthSession()

const LoginScreen = ({ onSkip }) => {
    const [isLogin, setIsLogin] = useState(true)
    const [loading, setLoading] = useState(false)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [name, setName] = useState('')
    const [error, setError] = useState('')

    const webClientId = process.env.EXPO_PUBLIC_FIREBASE_WEB_CLIENT_ID || 'missing-client-id';
    const androidClientId = process.env.EXPO_PUBLIC_FIREBASE_ANDROID_CLIENT_ID || webClientId;

    const [request, response, promptAsync] = Google.useAuthRequest({
        webClientId: webClientId,
        androidClientId: androidClientId,
        iosClientId: process.env.EXPO_PUBLIC_FIREBASE_IOS_CLIENT_ID || webClientId,
        expoClientId: webClientId,
    });

    React.useEffect(() => {
        if (response?.type === 'success') {
            const { id_token } = response.params;
            const credential = GoogleAuthProvider.credential(id_token);
            setLoading(true);
            signInWithCredential(auth, credential)
                .catch((e) => {
                    console.log('Firebase credential auth error:', e)
                    alert('Sign in failed. Check console for details.')
                    setLoading(false)
                })
        }
    }, [response]);

    const handleGoogleSignIn = () => {
        if (!process.env.EXPO_PUBLIC_FIREBASE_WEB_CLIENT_ID) {
            alert('Missing Google Client ID. Check environment variables.')
            return;
        }
        promptAsync();
    }

    const handleEmailAuth = async () => {
        // Basic Validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || !emailRegex.test(email)) {
            alert('Please enter a valid email address.');
            return;
        }
        if (!password || password.length < 6) {
            alert('Password must be at least 6 characters.');
            return;
        }
        if (!isLogin && !name) {
            alert('Please enter your full name.');
            return;
        }

        setError('');
        setLoading(true);
        try {
            if (isLogin) {
                await signInWithEmailAndPassword(auth, email, password);
            } else {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                await updateProfile(userCredential.user, { displayName: name });
            }
        } catch (error) {
            let errorMsg = error.message;
            if (error.code === 'auth/invalid-email') errorMsg = 'Invalid email address.';
            if (error.code === 'auth/user-not-found') errorMsg = 'User not found.';
            if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') errorMsg = 'Incorrect email or password.';
            if (error.code === 'auth/email-already-in-use') errorMsg = 'Email is already in use.';
            if (error.code === 'auth/weak-password') errorMsg = 'Password should be at least 6 characters.';
            setError(errorMsg);
        } finally {
            setLoading(false);
        }
    }

    const validateForm = () => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || !emailRegex.test(email)) return 'Invalid email format';
        if (!password || password.length < 6) return 'Password must be at least 6 characters';
        if (!isLogin && !name) return 'Name is required';
        return '';
    };

    const isFormValid = validateForm() === '';

    return (
        <KeyboardAvoidingView
            style={{ flex: 1, backgroundColor: COLORS.background }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView contentContainerStyle={tailwind`flex-grow justify-center px-8 py-10`} showsVerticalScrollIndicator={false}>

                {/* Logo & Branding */}
                <View style={tailwind`items-center mt-10 mb-10`}>
                    <View style={[tailwind`w-20 h-20 rounded-[28px] justify-center items-center mb-4 p-1 bg-white`, { ...SHADOW.lg }]}>
                        <View style={tailwind`w-full h-full rounded-[24px] overflow-hidden bg-gray-50`}>
                            <Image source={require('../../assets/icon.png')} style={tailwind`w-full h-full`} resizeMode="contain" />
                        </View>
                    </View>
                    <Text style={[tailwind`text-4xl font-[900] tracking-tighter`, { color: COLORS.textMain }]}>Wallety</Text>
                    <View style={[tailwind`h-1 w-12 rounded-full mt-2`, { backgroundColor: COLORS.primary }]} />
                    <Text style={[tailwind`text-sm mt-3 text-center font-bold px-4 tracking-tight`, { color: COLORS.textSub }]}>
                        Your personal financial companion.{"\n"}Secure, smart, and simple.
                    </Text>
                </View>

                {/* Auth Form Card */}
                <View style={[tailwind`p-1 rounded-[40px] mb-8`, { backgroundColor: COLORS.gray100, ...SHADOW.md }]}>
                    <View style={[tailwind`p-7 rounded-[38px] bg-white`, { borderWidth: 1, borderColor: 'rgba(0,0,0,0.03)' }]}>
                        <Text style={[tailwind`text-2xl font-black mb-6`, { color: COLORS.textMain }]}>
                            {isLogin ? 'Welcome Back' : 'Join Wallety'}
                        </Text>

                        {/* Premium Segmented Toggle */}
                        <View style={[tailwind`flex-row p-1 rounded-xl mb-6`, { backgroundColor: COLORS.gray100 }]}>
                            <TouchableOpacity
                                onPress={() => setIsLogin(true)}
                                activeOpacity={0.8}
                                style={[tailwind`flex-1 py-2.5 rounded-lg items-center flex-row justify-center gap-2`, isLogin ? { backgroundColor: COLORS.white, ...SHADOW.sm } : {}]}
                            >
                                <Ionicons name="log-in" size={16} color={isLogin ? COLORS.black : COLORS.gray400} />
                                <Text style={[tailwind`font-extrabold text-xs tracking-tight`, { color: isLogin ? COLORS.black : COLORS.gray400 }]}>LOGIN</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => setIsLogin(false)}
                                activeOpacity={0.8}
                                style={[tailwind`flex-1 py-2.5 rounded-lg items-center flex-row justify-center gap-2`, !isLogin ? { backgroundColor: COLORS.white, ...SHADOW.sm } : {}]}
                            >
                                <Ionicons name="person-add" size={16} color={!isLogin ? COLORS.black : COLORS.gray400} />
                                <Text style={[tailwind`font-extrabold text-xs tracking-tight`, { color: !isLogin ? COLORS.black : COLORS.gray400 }]}>SIGN UP</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={tailwind`gap-5`}>
                            {!isLogin && (
                                <View>
                                    <Text style={[tailwind`text-[10px] font-black ml-2 mb-2 tracking-widest uppercase opacity-40`, { color: COLORS.textMain }]}>Full Name</Text>
                                    <TextInput
                                        style={[tailwind`px-5 py-4.5 rounded-2xl font-bold border-2`, { backgroundColor: COLORS.gray50, color: COLORS.textMain, borderColor: 'transparent' }]}
                                        placeholder="John Doe"
                                        placeholderTextColor={COLORS.gray400}
                                        value={name}
                                        onChangeText={setName}
                                    />
                                </View>
                            )}

                            <View>
                                <Text style={[tailwind`text-[10px] font-black ml-2 mb-2 tracking-widest uppercase opacity-40`, { color: COLORS.textMain }]}>Email Address</Text>
                                <TextInput
                                    style={[tailwind`px-5 py-4.5 rounded-2xl font-bold border-2`, { backgroundColor: COLORS.gray50, color: COLORS.textMain, borderColor: 'transparent' }]}
                                    placeholder="name@email.com"
                                    placeholderTextColor={COLORS.gray400}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    value={email}
                                    onChangeText={setEmail}
                                />
                            </View>

                            <View>
                                <Text style={[tailwind`text-[10px] font-black ml-2 mb-2 tracking-widest uppercase opacity-40`, { color: COLORS.textMain }]}>Password</Text>
                                <TextInput
                                    style={[tailwind`px-5 py-4.5 rounded-2xl font-bold border-2`, { backgroundColor: COLORS.gray50, color: COLORS.textMain, borderColor: 'transparent' }]}
                                    placeholder="••••••••"
                                    placeholderTextColor={COLORS.gray400}
                                    secureTextEntry
                                    value={password}
                                    onChangeText={setPassword}
                                />
                                {error ? <Text style={tailwind`text-xs text-red-500 font-bold ml-2 mt-2`}>{error}</Text> : null}
                            </View>

                            <TouchableOpacity
                                onPress={handleEmailAuth}
                                disabled={loading || !isFormValid}
                                activeOpacity={0.9}
                                style={[tailwind`rounded-2xl py-4 items-center mt-2`, { backgroundColor: isFormValid ? COLORS.black : COLORS.gray400, ...SHADOW.md }]}
                            >
                                {loading ? (
                                    <ActivityIndicator color={COLORS.white} />
                                ) : (
                                    <Text style={[tailwind`font-black text-sm tracking-widest`, { color: COLORS.white }]}>
                                        {isLogin ? 'CONTINUE' : 'CREATE ACCOUNT'}
                                    </Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* Social Login */}
                <View style={tailwind`items-center mb-8 px-4`}>
                    <View style={tailwind`flex-row items-center mb-6 opacity-30`}>
                        <View style={[tailwind`flex-1 h-[1px]`, { backgroundColor: COLORS.textMain }]} />
                        <Text style={[tailwind`mx-4 text-[10px] font-black tracking-widest uppercase`, { color: COLORS.textMain }]}>Or continue with</Text>
                        <View style={[tailwind`flex-1 h-[1px]`, { backgroundColor: COLORS.textMain }]} />
                    </View>

                    <TouchableOpacity
                        onPress={() => alert('Google sync is currently under verification. This feature will be live shortly!')}
                        activeOpacity={0.6}
                        style={[tailwind`flex-row items-center w-full justify-center py-4.5 rounded-2xl border-2 opacity-50`, { borderColor: COLORS.gray100, backgroundColor: COLORS.white }]}
                    >
                        <Ionicons name="logo-google" size={22} color={COLORS.gray400} style={tailwind`mr-3`} />
                        <Text style={[tailwind`font-black text-base tracking-tight`, { color: COLORS.gray400 }]}>Verification in progress...</Text>
                    </TouchableOpacity>
                </View>

                {/* Offline Mode */}
                <TouchableOpacity
                    onPress={onSkip}
                    activeOpacity={0.7}
                    style={tailwind`items-center py-4 mb-10`}
                >
                    <Text style={[tailwind`text-sm font-black tracking-tight opacity-40`, { color: COLORS.textMain, textDecorationLine: 'underline' }]}>
                        USE AS GUEST (OFFLINE) 🚶
                    </Text>
                </TouchableOpacity>

            </ScrollView>
        </KeyboardAvoidingView >
    )
}

export default LoginScreen
