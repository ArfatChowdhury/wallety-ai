import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { walkthroughable, useCopilot } from 'react-native-copilot';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

// Walkthroughable primitives
export const WalkthroughableView = walkthroughable(View);
export const WalkthroughableText = walkthroughable(Text);
export const WalkthroughableTouchableOpacity = walkthroughable(TouchableOpacity);

/**
 * Custom Tooltip shown during the tour.
 */
export const TourTooltip = ({ isFirstStep, isLastStep, handleNext, handlePrev, handleStop, currentStep }) => (
  <View style={styles.tooltipContainer}>
    <View style={styles.tooltipHeader}>
      <Text style={styles.tooltipTitle}>{currentStep.name}</Text>
      <Text style={styles.stepCounter}>Step {currentStep.order} of 15</Text>
    </View>
    <Text style={styles.tooltipBody}>{currentStep.text}</Text>
    <View style={styles.tooltipFooter}>
      <TouchableOpacity onPress={handleStop}>
        <Text style={styles.skipButton}>Skip Tour</Text>
      </TouchableOpacity>
      <View style={styles.buttonGroup}>
        {!isFirstStep && (
          <TouchableOpacity onPress={handlePrev} style={[styles.navButton, styles.prevButton]}>
            <Text style={styles.buttonText}>Back</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={isLastStep ? handleStop : handleNext} style={[styles.navButton, styles.nextButton]}>
          <Text style={styles.buttonText}>{isLastStep ? 'Finish' : 'Next'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  </View>
);

/**
 * Hook used inside Home screen to start the tour when flagged.
 */
export const useWalletyTour = (navigation) => {
  const { start, copilotEvents } = useCopilot();

  useEffect(() => {
    const onStepChange = (step) => {
      if (step.order === 6) navigation.navigate('Insight');
      else if (step.order === 9) navigation.navigate('Budget');
      else if (step.order === 12) navigation.navigate('SettingsTab');
    };

    const onStop = async () => {
      await AsyncStorage.setItem('hasCompletedTour', 'true');
    };

    copilotEvents.on('stepChange', onStepChange);
    copilotEvents.on('stop', onStop);
    return () => {
      copilotEvents.off('stepChange', onStepChange);
      copilotEvents.off('stop', onStop);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Call this after the Home screen is fully visible and CopilotSteps are mounted.
   * Reads the AsyncStorage flag set by the Finish Setup button.
   */
  const maybeStartTour = async () => {
    const shouldStart = await AsyncStorage.getItem('shouldStartTour');
    if (shouldStart === 'true') {
      await AsyncStorage.removeItem('shouldStartTour');
      start();
    }
  };

  return { maybeStartTour };
};

const styles = StyleSheet.create({
  tooltipContainer: {
    width: width - 60,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  tooltipHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  tooltipTitle: { color: '#ffffff', fontSize: 15, fontWeight: 'bold' },
  stepCounter: { color: '#9ca3af', fontSize: 11 },
  tooltipBody: { color: '#d1d5db', fontSize: 13, lineHeight: 18, marginBottom: 20 },
  tooltipFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  skipButton: { color: '#9ca3af', fontSize: 13 },
  buttonGroup: { flexDirection: 'row', gap: 10 },
  navButton: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 8, minWidth: 70, alignItems: 'center' },
  nextButton: { backgroundColor: '#10B981' },
  prevButton: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#555' },
  buttonText: { color: '#ffffff', fontSize: 13, fontWeight: 'bold' },
});
