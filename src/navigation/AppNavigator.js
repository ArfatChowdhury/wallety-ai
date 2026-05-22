import React, { useState, useEffect, useRef } from "react"
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { createStackNavigator } from "@react-navigation/stack"
import { Platform, TouchableOpacity, View, Text, ActivityIndicator, StyleSheet, Dimensions, Keyboard, Linking } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import Svg, { Path } from "react-native-svg"
import * as Notifications from "expo-notifications"
import { useNavigationContainerRef } from "@react-navigation/native"
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import PremiumAlert from "../components/PremiumAlert"
import { BannerAdComponent } from "../services/AdService"

import Home from "../screens/Home"
import Create from "../screens/Create"
import Insight from "../screens/Insight"
import Budget from "../screens/Budget"
import Settings from "../screens/Settings"
import Category from "../screens/Category"
import AddIncome from "../screens/AddIncome"
import RecurringManager from "../screens/RecurringManager"
import LoginScreen from "../screens/LoginScreen"
import ScannerScreen from "../screens/ScannerScreen"
import { onAuthStateChanged } from "../services/firestoreService"
import AsyncStorage from "@react-native-async-storage/async-storage"


const { width } = Dimensions.get("window")
const BAR_HEIGHT = 65            // Visible bar height (excluding safe area + overhang)
const NOTCH_OVERHANG = 26        // How far above the bar the center circle protrudes
const NOTCH_WIDTH = 88           // Width of the curved cutout
const NOTCH_DEPTH = 32           // How deep the cutout dips into the bar (must clear the circle)

const Tab = createBottomTabNavigator()
const Stack = createStackNavigator()

/* ---------------- NOTCH BACKGROUND ---------------- */

const NotchedBackground = ({ width, totalHeight }) => {
  const cx = width / 2;
  const top = NOTCH_OVERHANG;
  const bottom = totalHeight;
  const halfNotch = NOTCH_WIDTH / 1.5;
  const dipBottom = top + NOTCH_DEPTH;

  const barShapePath = [
    `M 0 ${top}`,
    `L ${cx - halfNotch} ${top}`,
    `C ${cx - halfNotch * 0.45} ${top}, ${cx - halfNotch * 0.55} ${dipBottom}, ${cx} ${dipBottom}`,
    `C ${cx + halfNotch * 0.55} ${dipBottom}, ${cx + halfNotch * 0.45} ${top}, ${cx + halfNotch} ${top}`,
    `L ${width} ${top}`,
    `L ${width} ${bottom}`,
    `L 0 ${bottom}`,
    "Z",
  ].join(" ");

  const topEdgePath = [
    `M 0 ${top}`,
    `L ${cx - halfNotch} ${top}`,
    `C ${cx - halfNotch * 0.45} ${top}, ${cx - halfNotch * 0.55} ${dipBottom}, ${cx} ${dipBottom}`,
    `C ${cx + halfNotch * 0.55} ${dipBottom}, ${cx + halfNotch * 0.45} ${top}, ${cx + halfNotch} ${top}`,
    `L ${width} ${top}`,
  ].join(" ");

  return (
    <View style={StyleSheet.absoluteFillObject}>
      <Svg width={width} height={totalHeight} style={StyleSheet.absoluteFill}>
        <Path d={barShapePath} fill="#F8F9FA" />
        <Path d={topEdgePath} fill="none" stroke="#E5E7EB" strokeWidth={1.5} />
      </Svg>
    </View>
  )
}

/* ---------------- TABS ---------------- */

function MyTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{ headerShown: false }}
      initialRouteName="Home"
    >
      <Tab.Screen name="Home" component={Home} />
      <Tab.Screen name="Insight" component={Insight} />
      <Tab.Screen name="Create" component={Create} />
      <Tab.Screen name="Budget" component={Budget} />
      <Tab.Screen name="SettingsTab" component={Settings} />
    </Tab.Navigator>
  )
}

/* ---------------- FLOATING TAB ---------------- */

const FloatingTabBar = ({ state, descriptors, navigation }) => {
  const { updateTabLayout, isPremium } = useContext(AppContext)
  const insets = useSafeAreaInsets()
  const [keyboardVisible, setKeyboardVisible] = useState(false)
  const tabRefs = useRef({}).current

  useEffect(() => {
    const showSub = Keyboard.addListener("keyboardDidShow", () => setKeyboardVisible(true))
    const hideSub = Keyboard.addListener("keyboardDidHide", () => setKeyboardVisible(false))

    // Initial measurement trigger
    setTimeout(() => {
      Object.keys(tabRefs).forEach(name => handleLayout(name))
    }, 500)

    return () => { showSub.remove(); hideSub.remove() }
  }, [])

  const handleLayout = (name) => {
    // Increased delay to 400ms to ensure ads and layout have fully settled
    setTimeout(() => {
      tabRefs[name]?.measureInWindow((x, y, w, h) => {
        if (x !== undefined && y !== undefined) {
          // Removed manual +8 offset; y + height/2 marks the exact center
          updateTabLayout(name, { x: x + w / 2, y: y + h / 2, width: w, height: h })
        }
      })
    }, 400)
  }

  if (keyboardVisible) return null

  const safeBottom = Math.max(insets.bottom, 8)
  const totalHeight = NOTCH_OVERHANG + BAR_HEIGHT + safeBottom

  return (
    <View style={{
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      alignItems: 'center',
      zIndex: 99,
    }}
    pointerEvents="box-none"
    >
      {/* Centralized Banner Ad — ONLY on Tab screens, auto-sizes when ad loads */}
      {!isPremium && <BannerAdComponent />}

      {/* Tab Bar Container */}
      <View style={{
        width: width,
        height: totalHeight,
        backgroundColor: 'transparent',
      }}
      pointerEvents="box-none"
      >
        <NotchedBackground width={width} totalHeight={totalHeight} />
        <View style={[styles.row, {
          height: BAR_HEIGHT,
          paddingBottom: safeBottom,
          marginTop: NOTCH_OVERHANG,
        }]}
        pointerEvents="box-none"
        >
          {state.routes.map((route, index) => {
            const isFocused = state.index === index
            const isCreate = route.name === "Create"

            let icon, label
            switch (route.name) {
              case "Home": icon = isFocused ? "home" : "home-outline"; label = "Home"; break
              case "Insight": icon = isFocused ? "stats-chart" : "stats-chart-outline"; label = "Insights"; break
              case "Budget": icon = isFocused ? "wallet" : "wallet-outline"; label = "Budget"; break
              case "SettingsTab": icon = isFocused ? "person" : "person-outline"; label = "Account"; break
            }

            const onPress = () => {
              const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true })
              if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name)
            }

            if (isCreate) {
              return (
                <View key={index} style={styles.centerWrapper}>
                  <TouchableOpacity 
                    onPress={onPress} 
                    activeOpacity={0.8} 
                    style={styles.centerButton}
                    hitSlop={{ top: NOTCH_OVERHANG + 12, bottom: 6, left: 8, right: 8 }}
                  >
                    <Ionicons name="add" size={32} color="#FFF" />
                  </TouchableOpacity>
                </View>
              )
            }
             
            return (
              <TouchableOpacity 
                key={index} 
                style={styles.tab} 
                onPress={onPress} 
                activeOpacity={0.7}
                ref={el => tabRefs[route.name] = el}
                onLayout={() => handleLayout(route.name)}
              >
                <Ionicons name={icon} size={22} color={isFocused ? "#000" : "#9CA3AF"} />
                <Text style={[styles.label, isFocused && styles.activeLabel]}>{label}</Text>
              </TouchableOpacity>
            )
          })}
        </View>
      </View>
    </View>
  )
}

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  row: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 15 },
  tab: { flex: 1, alignItems: "center", justifyContent: "center" },
  label: { fontSize: 10, fontWeight: "700", color: "#9CA3AF", marginTop: 2 },
  activeLabel: { color: "#000" },
  centerWrapper: { flex: 1, alignItems: "center", justifyContent: "center" },
  centerButton: {
    width: 65,
    height: 65,
    borderRadius: 33,
    backgroundColor: "#000000ff",
    justifyContent: "center",
    alignItems: "center",
    marginTop: -40,
    shadowColor: "#1E1B4B",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 20,
  },
})

/* ---------------- AUTH NAV ---------------- */

import WelcomeScreen from "../screens/onboarding/WelcomeScreen"
import CurrencySetup from "../screens/onboarding/CurrencySetup"
import FixedIncomeSetup from "../screens/onboarding/FixedIncomeSetup"
import FixedExpensesSetup from "../screens/onboarding/FixedExpensesSetup"
import InitialBudgetSetup from "../screens/onboarding/InitialBudgetSetup"
import { AppContext } from "../Contex/ContextApi"
import { useContext } from "react"


const AppNavigator = () => {
  const { 
    isFirstLaunch, hasFetchedFromCloud, isSetupComplete, 
    showRatingPrompt, setShowRatingPrompt, setHasRatedApp,
    globalAlert, hideGlobalAlert, expenses, incomes,
    showGlobalAlert, isPremium
  } = useContext(AppContext)
  const insets = useSafeAreaInsets()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isInitializing, setIsInitializing] = useState(true)

  // ── Navigation ref for notification deep-link ───────────────────────
  const navigationRef = useRef(null)
  const lastNotifResponse = Notifications.useLastNotificationResponse()

  useEffect(() => {
    if (!lastNotifResponse) return
    const screen = lastNotifResponse.notification.request.content.data?.screen
    if (!screen || !isAuthenticated || !isSetupComplete) return

    // Small delay to ensure navigator is mounted
    setTimeout(() => {
      try {
        if (screen === 'Create') {
          navigationRef.current?.navigate('BottomTabs', { screen: 'Create' })
        } else if (screen === 'Budget') {
          navigationRef.current?.navigate('BottomTabs', { screen: 'Budget' })
        } else if (screen === 'Insight') {
          navigationRef.current?.navigate('BottomTabs', { screen: 'Insight' })
        }
      } catch (e) {
        console.log('Notification nav error:', e)
      }
    }, 300)
  }, [lastNotifResponse, isAuthenticated, isSetupComplete])

  useEffect(() => {
    const unsubscribe = onAuthStateChanged((user) => {
      setIsAuthenticated(!!user)
      setIsInitializing(false)
    })
    return unsubscribe
  }, [])

  if (isInitializing || isFirstLaunch === null || (isAuthenticated && !hasFetchedFromCloud)) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: '#FFFFFF' }}>
        <ActivityIndicator size="large" color="#000" />
        {isAuthenticated && !hasFetchedFromCloud && (
          <Text style={{ marginTop: 15, fontWeight: '700', color: '#6B7280' }}>Restoring your data...</Text>
        )}
      </View>
    )
  }

  return (
    <>
    <Stack.Navigator
      ref={navigationRef}
      screenOptions={{ headerShown: false }}
    >
      {!isAuthenticated ? (
        <Stack.Screen name="Login">
          {(props) => (
            <LoginScreen {...props} onSkip={() => {
              setIsAuthenticated(true);
            }} />
          )}
        </Stack.Screen>
      ) : (!isSetupComplete) ? (
        <>
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen name="CurrencySetup" component={CurrencySetup} />
          <Stack.Screen name="FixedIncomeSetup" component={FixedIncomeSetup} />
          <Stack.Screen name="FixedExpensesSetup" component={FixedExpensesSetup} />
          <Stack.Screen name="InitialBudgetSetup" component={InitialBudgetSetup} />
        </>
      ) : (
        <>
          <Stack.Screen name="BottomTabs" component={MyTabs} />
          <Stack.Screen name="Category" component={Category} />
          <Stack.Screen name="AddIncome" component={AddIncome} />
          <Stack.Screen name="RecurringManager" component={RecurringManager} />
          <Stack.Screen name="Scanner" component={ScannerScreen} options={{ presentation: 'modal' }} />
        </>
      )}
      <Stack.Screen name="SettingsCurrency" component={CurrencySetup} />
    </Stack.Navigator>



      <PremiumAlert
        visible={showRatingPrompt}
        title="Enjoying Wallety?"
        message="Tap a star to rate us. We appreciate your feedback!"
        icon="star"
        iconColor="#F59E0B"
        showRatingStars={true}
        primaryButtonText="Rate Now"
        secondaryButtonText="Later"
        onPrimaryPress={(rating) => {
          setShowRatingPrompt(false);
          setHasRatedApp(true);
          AsyncStorage.setItem('hasRatedApp', 'true');
          
          if (rating === 0 || rating >= 4) {
             Linking.openURL('market://details?id=com.wallety.budgettracker').catch(() => {
                 Linking.openURL('https://play.google.com/store/apps/details?id=com.wallety.budgettracker');
             });
          } else {
             // For 1-3 stars, thank them internally to avoid bad Play Store reviews
             setTimeout(() => {
                 showGlobalAlert({
                     title: "Thank You!",
                     message: "We appreciate your feedback and will use it to improve Wallety.",
                     icon: "heart",
                     iconColor: "#F59E0B",
                     primaryButtonText: "Got it"
                 });
             }, 500);
          }
        }}
        onSecondaryPress={() => {
          setShowRatingPrompt(false);
          // Set lastRatePrompt time so it only bugs them again after 24 hours
          AsyncStorage.setItem('lastRatePrompt', Date.now().toString());
        }}
      />

      {/* Global generic Premium Alert */}
      <PremiumAlert
        visible={globalAlert.visible}
        title={globalAlert.title}
        message={globalAlert.message}
        icon={globalAlert.icon}
        iconColor={globalAlert.iconColor}
        primaryButtonText={globalAlert.primaryButtonText}
        onPrimaryPress={() => {
          hideGlobalAlert();
          if (globalAlert.onPrimaryPress) globalAlert.onPrimaryPress();
        }}
        secondaryButtonText={globalAlert.secondaryButtonText}
        onSecondaryPress={globalAlert.secondaryButtonText ? () => {
          hideGlobalAlert();
          if (globalAlert.onSecondaryPress) globalAlert.onSecondaryPress();
        } : undefined}
      />
    </>
  )
}

export default AppNavigator