import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, Animated,
    Dimensions, StatusBar, TextInput, KeyboardAvoidingView,
    Platform, Vibration, Modal, ScrollView, Image, ActivityIndicator, Alert, FlatList
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { useContext } from 'react';
import { AppContext } from '../Contex/ContextApi';
import { scanReceipt, getDailyScanCount, incrementScanCount, getDailyLimit } from '../services/OCRService';
import { suggestCategory } from '../Data/categoryKeywords';
import { COLORS } from '../theme';
import AdService, { BannerAdComponent } from '../services/AdService';

const { width: W, height: H } = Dimensions.get('window');
const FRAME_SIZE = W * 0.72;
const CORNER = 22;
const BORDER_W = 3;

// ─── Corner bracket component (Reused from previous version) ────────────────
const CornerBracket = ({ position }) => {
    const isTop = position.includes('top');
    const isLeft = position.includes('left');
    return (
        <View style={[
            cornerStyles.corner,
            isTop ? { top: 0 } : { bottom: 0 },
            isLeft ? { left: 0 } : { right: 0 },
        ]}>
            <View style={[
                cornerStyles.arm,
                cornerStyles.horizontal,
                isTop ? { top: 0 } : { bottom: 0 },
                isLeft ? { left: 0 } : { right: 0 },
            ]} />
            <View style={[
                cornerStyles.arm,
                cornerStyles.vertical,
                isTop ? { top: 0 } : { bottom: 0 },
                isLeft ? { left: 0 } : { right: 0 },
            ]} />
        </View>
    );
};

const cornerStyles = StyleSheet.create({
    corner: { position: 'absolute', width: CORNER + BORDER_W, height: CORNER + BORDER_W },
    arm: { position: 'absolute', backgroundColor: '#22C55E' },
    horizontal: { height: BORDER_W, width: CORNER + BORDER_W },
    vertical: { width: BORDER_W, height: CORNER + BORDER_W },
});

// ─── Result bottom sheet (Updated for OCR results) ──────────────────────────
// ─── Result bottom sheet (Updated for OCR results) ──────────────────────────
const ResultSheet = ({ result, onDismiss, currencySymbol, categoriesList, handleAddTransaction, getLocalDate, navigation }) => {
    const slideAnim = useRef(new Animated.Value(300)).current;
    const [manualAmount, setManualAmount] = useState(String(result?.total || ''));
    const [manualTitle, setManualTitle] = useState(result?.merchant || '');
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [showCategoryModal, setShowCategoryModal] = useState(false);

    useEffect(() => {
        Animated.spring(slideAnim, {
            toValue: 0, damping: 18, stiffness: 200, useNativeDriver: true,
        }).start();

        // Initial suggestion
        const match = suggestCategory(result?.merchant || '', categoriesList);
        setSelectedCategory(match);
    }, [result]);

    const handleSaveDirectly = () => {
        if (!manualAmount || isNaN(parseFloat(manualAmount))) {
            Alert.alert("Error", "Please enter a valid amount");
            return;
        }
        if (!selectedCategory) {
            Alert.alert("Error", "Please select a category");
            return;
        }

        const amt = parseFloat(manualAmount);
        
        // Directly add to transactions via Context
        handleAddTransaction(null, {
            type: 'expense',
            title: manualTitle,
            amount: amt,
            category: selectedCategory,
            date: getLocalDate()
        });

        Alert.alert(
            "Expense Added!",
            `${manualTitle} ${currencySymbol}${amt.toFixed(2)} saved to ${selectedCategory.name}`,
            [{ 
                text: "OK", 
                onPress: () => {
                    onDismiss();
                    navigation.navigate('BottomTabs', { screen: 'Home' });
                } 
            }]
        );
    };

    return (
        <View style={sheetStyles.backdrop}>
            <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onDismiss} activeOpacity={1} />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={sheetStyles.sheetWrapper}
            >
                <Animated.View style={[sheetStyles.sheet, { transform: [{ translateY: slideAnim }] }]}>
                    <View style={sheetStyles.handle} />

                    <View style={sheetStyles.scanBadge}>
                        <Ionicons name="checkmark-circle" size={20} color="#22C55E" />
                        <Text style={sheetStyles.scanBadgeText}>OCR Scan Complete!</Text>
                    </View>

                    <Text style={sheetStyles.sheetTitle}>Review & Save</Text>
                    <Text style={sheetStyles.sheetSub}>Verify the details before adding to your record</Text>

                    <View style={sheetStyles.fieldGroup}>
                        <Text style={sheetStyles.fieldLabel}>MERCHANT / TITLE</Text>
                        <TextInput
                            style={sheetStyles.fieldInput}
                            value={manualTitle}
                            onChangeText={setManualTitle}
                            placeholder="Merchant name..."
                            placeholderTextColor="#9CA3AF"
                        />
                    </View>

                    <View style={sheetStyles.fieldGroup}>
                        <Text style={sheetStyles.fieldLabel}>TOTAL AMOUNT ({currencySymbol})</Text>
                        <View style={sheetStyles.amountRow}>
                            <Text style={sheetStyles.currencyTag}>{currencySymbol}</Text>
                            <TextInput
                                style={[sheetStyles.fieldInput, { flex: 1 }]}
                                value={manualAmount}
                                onChangeText={setManualAmount}
                                placeholder="0.00"
                                placeholderTextColor="#9CA3AF"
                                keyboardType="decimal-pad"
                            />
                        </View>
                    </View>

                    <View style={sheetStyles.fieldGroup}>
                        <Text style={sheetStyles.fieldLabel}>CATEGORY</Text>
                        <View style={sheetStyles.categoryRow}>
                            <View style={sheetStyles.categoryLeft}>
                                <View style={[sheetStyles.catIconCircle, { backgroundColor: (selectedCategory?.color || COLORS.gray200) + '20' }]}>
                                    <Text style={{ fontSize: 18 }}>{selectedCategory?.icon || '📁'}</Text>
                                </View>
                                <Text style={sheetStyles.catNameText}>{selectedCategory?.name || 'Uncategorized'}</Text>
                            </View>
                            <TouchableOpacity onPress={() => setShowCategoryModal(true)}>
                                <Text style={sheetStyles.changeBtnText}>Change</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={sheetStyles.addBtn}
                        onPress={handleSaveDirectly}
                        activeOpacity={0.85}
                    >
                        <LinearGradient colors={['#16a34a', '#22C55E']} style={sheetStyles.addBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                            <Ionicons name="checkmark-done-circle-outline" size={22} color="white" />
                            <Text style={sheetStyles.addBtnText}>Save Expense Directly</Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity style={sheetStyles.dismissBtn} onPress={onDismiss}>
                        <Text style={sheetStyles.dismissText}>Cancel — Try Another Image</Text>
                    </TouchableOpacity>
                </Animated.View>

                {/* Category Selection Modal */}
                <Modal visible={showCategoryModal} animationType="slide" transparent={true}>
                    <View style={sheetStyles.modalOverlay}>
                        <View style={sheetStyles.modalContent}>
                            <View style={sheetStyles.modalHeader}>
                                <Text style={sheetStyles.modalTitle}>Select Category</Text>
                                <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                                    <Ionicons name="close" size={24} color={COLORS.textMain} />
                                </TouchableOpacity>
                            </View>
                            <FlatList
                                data={categoriesList}
                                keyExtractor={(item, index) => item.name + index}
                                showsVerticalScrollIndicator={false}
                                contentContainerStyle={{ paddingBottom: 40 }}
                                renderItem={({ item }) => (
                                    <TouchableOpacity 
                                        style={sheetStyles.catItem}
                                        onPress={() => {
                                            setSelectedCategory(item);
                                            setShowCategoryModal(false);
                                        }}
                                    >
                                        <View style={[sheetStyles.catIconCircle, { backgroundColor: (item.color || COLORS.gray200) + '20' }]}>
                                            <Text style={{ fontSize: 18 }}>{item.icon}</Text>
                                        </View>
                                        <Text style={sheetStyles.modalCatName}>{item.name}</Text>
                                    </TouchableOpacity>
                                )}
                            />
                        </View>
                    </View>
                </Modal>
            </KeyboardAvoidingView>
        </View>
    );
};

const sheetStyles = StyleSheet.create({
    backdrop: { ...StyleSheet.absoluteFillObject, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
    sheetWrapper: { flex: 1, justifyContent: 'flex-end' },
    sheet: {
        backgroundColor: '#FFFFFF', borderTopLeftRadius: 32, borderTopRightRadius: 32,
        padding: 28, paddingBottom: 40,
        shadowColor: '#000', shadowOffset: { width: 0, height: -8 }, shadowOpacity: 0.2, shadowRadius: 20, elevation: 30,
    },
    handle: { width: 40, height: 4, backgroundColor: '#E5E7EB', borderRadius: 2, alignSelf: 'center', marginBottom: 24 },
    scanBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#F0FDF4', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, alignSelf: 'flex-start', marginBottom: 16, borderWidth: 1, borderColor: '#BBF7D0' },
    scanBadgeText: { color: '#16a34a', fontWeight: '700', fontSize: 13 },
    sheetTitle: { fontSize: 24, fontWeight: '900', color: '#111827', marginBottom: 4 },
    sheetSub: { fontSize: 14, color: '#6B7280', fontWeight: '500', marginBottom: 20 },
    fieldGroup: { marginBottom: 16 },
    fieldLabel: { fontSize: 11, fontWeight: '800', color: '#9CA3AF', letterSpacing: 1, marginBottom: 8 },
    fieldInput: { backgroundColor: '#F9FAFB', borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 16, padding: 16, fontSize: 16, fontWeight: '600', color: '#111827' },
    amountRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    currencyTag: { fontSize: 22, fontWeight: '900', color: '#111827' },
    categoryRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#F9FAFB',
        borderWidth: 1.5,
        borderColor: '#E5E7EB',
        borderRadius: 16,
        padding: 12,
        paddingHorizontal: 16,
    },
    categoryLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    catIconCircle: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
    catNameText: { fontSize: 16, fontWeight: '700', color: '#111827' },
    changeBtnText: { color: '#22C55E', fontWeight: '700', fontSize: 14 },
    addBtn: { borderRadius: 20, overflow: 'hidden', marginTop: 8, marginBottom: 12 },
    addBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 18 },
    addBtnText: { color: 'white', fontSize: 17, fontWeight: '900' },
    dismissBtn: { alignItems: 'center', paddingVertical: 8 },
    dismissText: { color: '#9CA3AF', fontSize: 15, fontWeight: '600' },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: 'white', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, maxHeight: '80%', paddingBottom: 40 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 20, fontWeight: '800', color: '#111827' },
    catItem: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
    modalCatName: { fontSize: 16, fontWeight: '600', color: '#111827' },
});

// ─── Main ScannerScreen ────────────────────────────────────────────────────
const ScannerScreen = ({ navigation }) => {
    const { currencySymbol, categoriesList, handleAddTransaction, getLocalDate, isPremium } = useContext(AppContext);

    const [image, setImage] = useState(null);
    const [scanning, setScanning] = useState(false);
    const [progress, setProgress] = useState(0);
    const [scannedResult, setScannedResult] = useState(null);
    const [isSheetVisible, setIsSheetVisible] = useState(false);
    const [scanCount, setScanCount] = useState(0);

    const scanLineAnim = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const frameAnim = useRef(new Animated.Value(0)).current;

    // Fetch initial scan count
    useEffect(() => {
        getDailyScanCount().then(setScanCount);
    }, []);

    const checkScanLimit = async () => {
        const count = await getDailyScanCount();
        const limit = getDailyLimit(isPremium);
        
        if (count >= limit) {
            Alert.alert(
                isPremium ? '📊 Daily Limit Reached' : '🔒 Daily Limit Reached',
                isPremium 
                    ? `You've used all ${limit} AI scans for today. Limits reset at midnight.`
                    : `Free users get ${limit} AI scans per day. Upgrade to Premium for ${getDailyLimit(true)} scans daily!`,
                [
                    { text: 'OK' },
                    ...(!isPremium ? [{ 
                        text: 'Upgrade', 
                        onPress: () => navigation.navigate('BottomTabs', { screen: 'SettingsTab' }) 
                    }] : [])
                ]
            );
            return false;
        }
        return true;
    };

    // Animations
    useEffect(() => {
        if (scanning) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(scanLineAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
                    Animated.timing(scanLineAnim, { toValue: 0, duration: 1500, useNativeDriver: true }),
                ])
            ).start();
        } else {
            scanLineAnim.setValue(0);
        }
    }, [scanning]);

    useEffect(() => {
        Animated.spring(frameAnim, { toValue: 1, damping: 14, stiffness: 150, useNativeDriver: true }).start();
    }, []);

    const pickImage = async () => {
        const allowed = await checkScanLimit();
        if (!allowed) return;

        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            alert('Gallery permission needed!');
            return;
        }
        
        // Show interstitial ad and WAIT before picking image
        if (!isPremium) {
            await AdService.showReceiptScanAd();
        }
        
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: false,
            quality: 1,
            base64: true, 
        });
        if (!result.canceled) {
            processImage(result.assets[0].uri, result.assets[0].base64);
        }
    };

    const takePhoto = async () => {
        const allowed = await checkScanLimit();
        if (!allowed) return;

        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            alert('Camera permission needed!');
            return;
        }
        
        // Show interstitial ad and WAIT before taking photo
        if (!isPremium) {
            await AdService.showReceiptScanAd();
        }
        
        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: false,
            quality: 1,
            base64: true, 
        });
        if (!result.canceled) {
            processImage(result.assets[0].uri, result.assets[0].base64);
        }
    };

    const processImage = async (uri, base64Image) => {
        setImage(uri);
        setScanning(true);
        setProgress(0);

        try {
            const result = await scanReceipt(base64Image);
            await incrementScanCount();
            const newCount = await getDailyScanCount();
            setScanCount(newCount);
            
            Vibration.vibrate(80);

            // Pulse on completion
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.05, duration: 100, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
            ]).start();

            setScannedResult(result);
            setIsSheetVisible(true);
        } catch (error) {
            console.error('[Scanner] Groq API Error:', error.message);
            const msg = error.message || 'Unknown error';

            Alert.alert(
                'Scan Failed',
                msg.includes('Rate limit') || msg.includes('429')
                    ? '⚠️ Groq free tier limit reached. Please wait a minute and try again.\n\n' + msg
                    : msg.includes('API Key')
                        ? 'Invalid or missing Groq API Key.'
                        : `Could not parse receipt:\n${msg}`,
                [
                    { text: 'Try Another Image', onPress: () => { setImage(null); } },
                    { text: 'OK' }
                ]
            );
        } finally {
            setScanning(false);
        }
    };

    const handleDismiss = () => {
        setIsSheetVisible(false);
        setScannedResult(null);
        setImage(null);
    };

    const scanLineY = scanLineAnim.interpolate({ inputRange: [0, 1], outputRange: [0, FRAME_SIZE - 4] });

    return (
        <View style={{ flex: 1, backgroundColor: COLORS.background }}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

            {/* Header */}
            <SafeAreaView style={headerStyle.safe}>
                <View style={headerStyle.row}>
                    <TouchableOpacity style={headerStyle.iconBtn} onPress={() => navigation.goBack()}>
                        <Ionicons name="close" size={22} color={COLORS.textMain} />
                    </TouchableOpacity>
                    <Text style={headerStyle.title}>Receipt Scanner</Text>
                    <View style={{ width: 44 }} />
                </View>
            </SafeAreaView>

            {/* Main Content Area */}
            <View style={contentStyle.container}>
                {/* Frame with preview or placeholder */}
                <Animated.View style={[
                    scanFrame.frame,
                    { transform: [{ scale: pulseAnim }, { scale: frameAnim }] }
                ]}>
                    {image ? (
                        <Image source={{ uri: image }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                    ) : (
                        <View style={scanFrame.placeholder}>
                            <Ionicons name="receipt-outline" size={60} color={COLORS.gray200} />
                        </View>
                    )}

                    <CornerBracket position="top-left" />
                    <CornerBracket position="top-right" />
                    <CornerBracket position="bottom-left" />
                    <CornerBracket position="bottom-right" />

                    {scanning && (
                        <Animated.View style={[scanFrame.scanLine, { transform: [{ translateY: scanLineY }] }]} />
                    )}
                </Animated.View>

                {scanning && (
                    <View style={contentStyle.loadingBox}>
                        <ActivityIndicator color="#22C55E" size="small" />
                        <Text style={contentStyle.loadingText}>Reading Receipt...</Text>
                    </View>
                )}

                {!scanning && !image && (
                    <View style={instrStyle.container}>
                        <Text style={instrStyle.main}>Identify Merchant & Total</Text>
                        <Text style={instrStyle.sub}>Take a photo of your receipt for auto-filling</Text>
                        <View style={{ marginTop: 12, backgroundColor: COLORS.gray100, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 }}>
                           <Text style={{ color: COLORS.textSub, fontSize: 11, fontWeight: '700' }}>
                               {getDailyLimit(isPremium) - scanCount} scans remaining today
                           </Text>
                        </View>
                    </View>
                )}
            </View>

            {/* Action Buttons */}
            <View style={actionStyle.container}>
                {/* Banner Ad above CTA */}
                <View style={{ marginBottom: 10, alignItems: 'center' }}>
                    <BannerAdComponent />
                </View>

                <TouchableOpacity style={actionStyle.primaryBtn} onPress={takePhoto} disabled={scanning}>
                    <LinearGradient colors={['#22C55E', '#16a34a']} style={actionStyle.btnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                        <Ionicons name="camera" size={24} color="white" />
                        <Text style={actionStyle.btnText}>Take Receipt Photo</Text>
                    </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity style={actionStyle.secondaryBtn} onPress={pickImage} disabled={scanning}>
                    <Ionicons name="images-outline" size={20} color={COLORS.textMain} />
                    <Text style={[actionStyle.btnText, { color: COLORS.textMain }]}>Pick from Gallery</Text>
                </TouchableOpacity>
            </View>

            {/* Result Bottom Sheet */}
            {isSheetVisible && scannedResult && (
                <ResultSheet
                    result={scannedResult}
                    onDismiss={handleDismiss}
                    currencySymbol={currencySymbol}
                    categoriesList={categoriesList}
                    handleAddTransaction={handleAddTransaction}
                    getLocalDate={getLocalDate}
                    navigation={navigation}
                />
            )}
        </View>
    );
};

const contentStyle = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingBox: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 30, backgroundColor: COLORS.gray100, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
    loadingText: { color: COLORS.textMain, fontWeight: '700', fontSize: 14 },
});

const scanFrame = StyleSheet.create({
    frame: {
        width: FRAME_SIZE, height: FRAME_SIZE,
        backgroundColor: COLORS.gray100,
        borderRadius: 24, overflow: 'hidden',
        borderWidth: 1, borderColor: COLORS.border,
    },
    placeholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    scanLine: {
        position: 'absolute', left: 8, right: 8, height: 3, borderRadius: 2,
        backgroundColor: '#22C55E', shadowColor: '#22C55E', shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1, shadowRadius: 10, elevation: 10,
    },
});

const headerStyle = StyleSheet.create({
    safe: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 },
    row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 16 },
    iconBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.gray100, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
    title: { color: COLORS.textMain, fontSize: 18, fontWeight: '800' },
});

const instrStyle = StyleSheet.create({
    container: { alignItems: 'center', marginTop: 30, paddingHorizontal: 40 },
    main: { color: COLORS.textMain, fontSize: 17, fontWeight: '800', textAlign: 'center', marginBottom: 8 },
    sub: { color: COLORS.textSub, fontSize: 14, textAlign: 'center', lineHeight: 20 },
});

const actionStyle = StyleSheet.create({
    container: { paddingHorizontal: 30, paddingBottom: 50, gap: 16 },
    primaryBtn: { borderRadius: 24, overflow: 'hidden', height: 60 },
    btnGrad: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
    btnText: { color: 'white', fontSize: 16, fontWeight: '800' },
    secondaryBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12,
        height: 60, borderRadius: 24, backgroundColor: COLORS.gray100,
        borderWidth: 1, borderColor: COLORS.border,
    },
});

export default ScannerScreen;
