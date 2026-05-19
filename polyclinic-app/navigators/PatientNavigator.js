import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Screens
import ScheduleScreen from '../screens/patient/SchedulesScreen';
import AppointmentBookingScreen from '../screens/patient/AppointmentBookingScreen';
import ProfileScreen from '../screens/shared/ProfileScreen';


const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// =========================
// STACK CHO TAB LỊCH HẸN
// =========================
const AppointmentStack = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen
            name="ScheduleScreen"
            component={ScheduleScreen}
        />
        <Stack.Screen
            name="AppointmentBooking"
            component={AppointmentBookingScreen}
            options={{
                headerShown: true,
                title: 'Đặt lịch khám',
                headerBackTitle: 'Quay lại',
            }}
        />
    </Stack.Navigator>
);

// =========================
// TAB NAVIGATOR CHÍNH
// =========================
const PatientNavigator = () => {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: true,

                tabBarActiveTintColor: '#2196F3',
                tabBarInactiveTintColor: 'gray',

                tabBarStyle: {
                    height: 65,
                    paddingBottom: 5,
                },

                tabBarLabelStyle: {
                    fontSize: 12,
                    fontWeight: '600',
                },

                tabBarIcon: ({ color, size }) => {
                    let iconName;

                    if (route.name === 'Appointments')
                        iconName = 'calendar-check';

                    else if (route.name === 'Invoices')
                        iconName = 'file-document-outline';

                    else if (route.name === 'Notifications')
                        iconName = 'bell-outline';

                    else if (route.name === 'ProfileTab')
                        iconName = 'account-circle';

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

            {/* Dùng AppointmentStack thay vì AppointmentCreateScreen trực tiếp */}
            <Tab.Screen
                name="Appointments"
                component={AppointmentStack}
                options={{
                    title: 'Lịch hẹn',
                    tabBarLabel: 'Lịch hẹn',
                    headerShown: false, // Header do Stack con quản lý
                }}
            />

            {/* <Tab.Screen
                name="Invoices"
                component={InvoiceScreen}
                options={{
                    title: 'Hóa đơn',
                    tabBarLabel: 'Hóa đơn',
                }}
            />

            <Tab.Screen
                name="Notifications"
                component={NotiScreen}
                options={{
                    title: 'Thông báo',
                    tabBarLabel: 'Thông báo',
                }}
            /> */}

            <Tab.Screen
                name="ProfileTab"
                component={ProfileScreen}
                options={{
                    title: 'Cá nhân',
                    tabBarLabel: 'Cá nhân',
                }}
            />

        </Tab.Navigator>
    );
};

export default PatientNavigator;