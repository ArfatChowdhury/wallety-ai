import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import tailwind from 'twrnc';
import { COLORS, SHADOW } from '../theme';

const { width } = Dimensions.get('window');

const PremiumAlert = ({ 
    visible, 
    title, 
    message, 
    icon = "checkmark-circle", 
    iconColor = COLORS.income,
    primaryButtonText = "Got it",
    onPrimaryPress,
    secondaryButtonText,
    onSecondaryPress
}) => {
    if (!visible) return null;

    return (
        <Modal transparent animationType="fade" visible={visible} statusBarTranslucent>
            <View style={styles.overlay}>
                <View style={styles.card}>
                    {/* Floating Icon Badge */}
                    <View style={styles.iconContainer}>
                        <View style={[styles.iconInner, { backgroundColor: iconColor }]}>
                            <Ionicons name={icon} size={32} color={COLORS.white} />
                        </View>
                    </View>

                    {/* Content */}
                    <View style={styles.content}>
                        <Text style={styles.title}>{title}</Text>
                        <Text style={styles.message}>{message}</Text>
                    </View>

                    {/* Actions */}
                    <View style={styles.actions}>
                        {secondaryButtonText && onSecondaryPress && (
                            <TouchableOpacity 
                                style={[styles.button, styles.secondaryButton]} 
                                onPress={onSecondaryPress}
                                activeOpacity={0.8}
                            >
                                <Text style={[styles.buttonText, styles.secondaryButtonText]}>
                                    {secondaryButtonText}
                                </Text>
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity 
                            style={[styles.button, styles.primaryButton, { flex: secondaryButtonText ? 1 : undefined, width: secondaryButtonText ? undefined : '100%' }]} 
                            onPress={onPrimaryPress}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.buttonText}>{primaryButtonText}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.45)', // Premium dark blur-like overlay
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    card: {
        width: width - 48,
        backgroundColor: COLORS.white,
        borderRadius: 32,
        padding: 24,
        paddingTop: 36, // Give room for the float icon
        alignItems: 'center',
        ...SHADOW.lg,
    },
    iconContainer: {
        position: 'absolute',
        top: -30,
        backgroundColor: COLORS.white,
        borderRadius: 40,
        padding: 6,
        ...SHADOW.md,
    },
    iconInner: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 32,
    },
    title: {
        fontSize: 22,
        fontWeight: '900',
        color: COLORS.textMain,
        marginBottom: 12,
        textAlign: 'center',
        letterSpacing: -0.5,
    },
    message: {
        fontSize: 15,
        color: COLORS.textSub,
        textAlign: 'center',
        lineHeight: 22,
        fontWeight: '500',
    },
    actions: {
        flexDirection: 'row',
        width: '100%',
        gap: 12,
    },
    button: {
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    primaryButton: {
        backgroundColor: COLORS.black,
        ...SHADOW.md,
    },
    secondaryButton: {
        flex: 1,
        backgroundColor: COLORS.gray100,
    },
    buttonText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    secondaryButtonText: {
        color: COLORS.textMain,
    }
});

export default PremiumAlert;
