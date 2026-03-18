import React from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const AppBackground = ({ children, variant = 'solid' }) => {
    const bgColor = '#FFFFFF';         // Pure White Canvas

    return (
        <View style={styles.root}>
            {/* Pure White Base */}
            <View style={[StyleSheet.absoluteFill, { backgroundColor: bgColor }]} />

            {children}
        </View>
    );
};

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
});

export default AppBackground;
