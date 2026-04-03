import React from 'react'
import {
  Modal, View, Text, TouchableWithoutFeedback,
  Dimensions, TouchableOpacity, Animated, StatusBar
} from 'react-native'
import Svg, { Rect, Circle, Defs, Mask } from 'react-native-svg'
import { Ionicons } from '@expo/vector-icons'
import { COLORS, SHADOW } from '../theme'

const { width: W, height: H } = Dimensions.get('window')

const SpotlightTour = ({ steps, currentStep, onNext, onSkip }) => {
  const pulseAnim = React.useRef(new Animated.Value(0)).current
  const contentOpacity = React.useRef(new Animated.Value(0)).current
  const contentTranslateY = React.useRef(new Animated.Value(10)).current

  React.useEffect(() => {
    if (currentStep !== undefined && currentStep >= 0) {
      // Pulse Animation
      pulseAnim.setValue(0)
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start()

      // Content Transition
      contentOpacity.setValue(0)
      contentTranslateY.setValue(10)
      Animated.parallel([
        Animated.timing(contentOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(contentTranslateY, {
          toValue: 0,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        })
      ]).start()
    }
  }, [currentStep])

  if (currentStep === undefined || currentStep < 0 || !steps || currentStep >= steps.length) return null

  const { x, y, r = 80, width: sw, height: sh, shape = 'circle', title, body } = steps[currentStep]
  const textOnTop = y > H * 0.55

  return (
    <Modal transparent animationType="fade" visible statusBarTranslucent>
      <StatusBar translucent backgroundColor="transparent" />
      <TouchableWithoutFeedback onPress={() => {
        if (currentStep < steps.length - 1) {
          if (steps[currentStep].onFinish) steps[currentStep].onFinish();
          onNext();
        }
      }}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.1)' }}>

          <Svg
            width={W}
            height={H}
            style={{ position: 'absolute', top: 0, left: 0 }}
          >
            <Defs>
              <Mask id="mask">
                <Rect x="0" y="0" width={W} height={H} fill="white" />
                {shape === 'circle' ? (
                  <Circle cx={x} cy={y} r={r} fill="black" />
                ) : (
                  <Rect
                    x={x - sw / 2 - 8}
                    y={y - sh / 2 - 4}
                    width={sw + 16}
                    height={sh + 8}
                    rx={12}
                    fill="black"
                  />
                )}
              </Mask>
            </Defs>
            <Rect
              x={0} y={0} width={W} height={H}
              fill="rgba(0,0,0,0.85)"
              mask="url(#mask)"
            />
            {/* Outline highlight */}
            {shape === 'circle' ? (
              <Circle cx={x} cy={y} r={r} fill="none" stroke="white" strokeWidth="2" opacity="0.5" />
            ) : (
              <Rect
                x={x - sw / 2 - 8}
                y={y - sh / 2 - 4}
                width={sw + 16}
                height={sh + 8}
                rx={12}
                fill="none"
                stroke="white"
                strokeWidth="2"
                opacity="0.5"
              />
            )}
          </Svg>

          {/* Pulsing highlight border */}
          <Animated.View style={{
            position: 'absolute',
            left: shape === 'circle' ? x - r - 4 : x - sw / 2 - 12,
            top: shape === 'circle' ? y - r - 4 : y - sh / 2 - 8,
            width: shape === 'circle' ? (r + 4) * 2 : sw + 24,
            height: shape === 'circle' ? (r + 4) * 2 : sh + 16,
            borderRadius: shape === 'circle' ? r + 4 : 14,
            borderWidth: 2,
            borderColor: 'rgba(255,255,255,0.4)',
            transform: [{
              scale: pulseAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 1.15],
              })
            }],
            opacity: pulseAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0.8, 0],
            })
          }} />

          <Animated.View style={{
            position: 'absolute',
            left: 28,
            right: 28,
            top: textOnTop ? Math.max(y - r - 200, 60) : y + r + 30,
            opacity: contentOpacity,
            transform: [{ translateY: contentTranslateY }],
            backgroundColor: '#1F2937',
            borderRadius: 24,
            padding: 24,
            ...SHADOW.md,
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <View style={{
                backgroundColor: 'rgba(255,255,255,0.1)',
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 10,
              }}>
                <Text style={{ color: 'white', fontSize: 11, fontWeight: '800' }}>
                  STEP {currentStep + 1} OF {steps.length}
                </Text>
              </View>
              <TouchableOpacity onPress={onSkip}>
                <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: '600' }}>Skip</Text>
              </TouchableOpacity>
            </View>

            <Text style={{
              color: 'white',
              fontSize: 22,
              fontWeight: '900',
              marginBottom: 8,
              lineHeight: 28,
            }}>
              {title}
            </Text>
            
            <Text style={{
              color: 'rgba(255,255,255,0.8)',
              fontSize: 15,
              lineHeight: 22,
              fontWeight: '500',
              marginBottom: 20,
            }}>
              {body}
            </Text>

            <TouchableOpacity
              onPress={() => {
                if (steps[currentStep].onFinish) steps[currentStep].onFinish();
                onNext();
              }}
              activeOpacity={0.8}
              style={{
                backgroundColor: '#ffffff',
                paddingVertical: 14,
                borderRadius: 16,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <Text style={{ color: '#000', fontWeight: '800', fontSize: 15 }}>
                {currentStep === steps.length - 1 ? "Get Started" : "Next Step"}
              </Text>
              <Ionicons name="arrow-forward" size={18} color="#000" />
            </TouchableOpacity>
          </Animated.View>

          <View style={{
            position: 'absolute',
            bottom: 40,
            left: 0,
            right: 0,
            flexDirection: 'row',
            justifyContent: 'center',
            gap: 6,
          }}>
            {steps.map((_, i) => (
              <View key={i} style={{
                width: i === currentStep ? 20 : 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: i === currentStep ? '#ffffff' : 'rgba(255,255,255,0.2)',
              }} />
            ))}
          </View>

        </View>
      </TouchableWithoutFeedback>
    </Modal>
  )
}

export default SpotlightTour
