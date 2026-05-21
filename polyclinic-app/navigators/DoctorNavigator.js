import React from 'react';
import { View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// =========================
// SCREENS
// =========================
import DoctorHomeScreen from '../screens/doctor/DoctorHomeScreen';
import AppointmentScreen from '../screens/doctor/AppointmentScreen';
import ProfileScreen from '../screens/shared/ProfileScreen';
import AppointmentDetailScreenDoctor from '../screens/doctor/AppoimentDetailScreenDoctor';
import VideoCallScreen from '../screens/shared/VideoCallScreen';

// =========================
// NAVIGATOR INIT
// =========================
const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// =========================
// APPOINTMENT STACK
// =========================
const AppointmentStack = () => (
     <Stack.Navigator>
        {/* LIST SCREEN */}
        <Stack.Screen
            name="AppointmentList"
            component={AppointmentScreen}
            options={{ title: 'Lịch khám' }}
        />

        {/* DETAIL SCREEN */}
        <Stack.Screen
            name="AppointmentDetail"
            component={AppointmentDetailScreenDoctor}
            options={{ title: 'Chi tiết lịch khám' }}
        />

        <Stack.Screen
            name="VideoCall"
            component={VideoCallScreen}
            options={{ headerShown: false, gestureEnabled: false }}
        />
    </Stack.Navigator>
    
);

// =========================
// PROFILE STACK (nếu cần mở rộng sau này)
// =========================
const ProfileStack = () => (
    <Stack.Navigator>
        <Stack.Screen
            name="ProfileScreen"
            component={ProfileScreen}
            options={{ title: 'Cá nhân' }}
        />
    </Stack.Navigator>
);

// =========================
// HOME STACK — bọc HomeScreen để có VideoCall
// =========================
const HomeStack = () => (
    <Stack.Navigator>
        <Stack.Screen
            name="DoctorHome"
            component={DoctorHomeScreen}
            options={{ title: 'Tổng quan' }}
        />
        <Stack.Screen
            name="VideoCall"
            component={VideoCallScreen}
            options={{ headerShown: false, gestureEnabled: false }}
        />
    </Stack.Navigator>
);

// =========================
// MAIN TAB NAVIGATOR
// =========================
const DoctorNavigator = () => {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarActiveTintColor: '#2196F3',
                tabBarInactiveTintColor: 'gray',
                tabBarStyle: { height: 65, paddingBottom: 5 },
                tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },

                tabBarIcon: ({ color, size }) => {
                    let iconName;

                    if (route.name === 'Home') iconName = 'view-dashboard';
                    else if (route.name === 'Appointments') iconName = 'calendar-clock';
                    else if (route.name === 'ProfileTab') iconName = 'account-circle';

                    return (
                        <MaterialCommunityIcons
                            name={iconName}
                            size={size}
                            color={color}
                        />
                    );
                },
            })}
        >
            {/* ================= HOME ================= */}
            <Tab.Screen
                name="Home"
                component={HomeStack}
                options={{ tabBarLabel: 'Tổng quan', headerShown: false }}
            />

            {/* ================= APPOINTMENTS ================= */}
            <Tab.Screen
                name="Appointments"
                component={AppointmentStack}
                options={{ tabBarLabel: 'Lịch khám' }}
            />

            {/* ================= PROFILE ================= */}
            <Tab.Screen
                name="ProfileTab"
                component={ProfileStack}
                options={{ tabBarLabel: 'Cá nhân' }}
            />
        </Tab.Navigator>
    );
};

export default DoctorNavigator;