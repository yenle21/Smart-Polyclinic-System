import React, { useState, useEffect } from 'react';
import { View } from 'react-native';
import { Badge } from 'react-native-paper';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { authApis, endpoints } from '../configs/Apis';

// =========================
// SCREENS
// =========================
import ScheduleScreen from '../screens/patient/SchedulesScreen';
import AppointmentBookingScreen from '../screens/patient/AppointmentBookingScreen';
import MyAppointmentsScreen from '../screens/patient/MyAppointmentsScreen';
import AppointmentDetailScreen from '../screens/patient/AppointmentDetailScreen';
import InvoiceScreen from '../screens/patient/InvoiceScreen';
import ProfileScreen from '../screens/shared/ProfileScreen';
import PersonalProfileScreen from '../screens/patient/PersonalProfileScreen';
import MedicalHistoryScreen from '../screens/patient/MedicalHistoryScreen';
import MedicalHistoryDetailScreen from '../screens/patient/MedicalHistoryDetailScreen';
import NotificationScreen from '../screens/patient/NotificationScreen'; // ✅ thêm

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// =========================
// APPOINTMENT STACK
// =========================
const AppointmentStack = () => (
    <Stack.Navigator>
        <Stack.Screen
            name="ScheduleScreen"
            component={ScheduleScreen}
            options={{ title: 'Đặt lịch khám' }}
        />
        <Stack.Screen
            name="AppointmentBooking"
            component={AppointmentBookingScreen}
            options={{ title: 'Đặt lịch khám', headerBackTitle: 'Quay lại' }}
        />
    </Stack.Navigator>
);

// =========================
// PROFILE STACK
// =========================
const ProfileStack = () => (
    <Stack.Navigator>
        <Stack.Screen
            name="ProfileScreen"
            component={ProfileScreen}
            options={{ title: 'Cá nhân' }}
        />
        <Stack.Screen
            name="PersonalProfile"
            component={PersonalProfileScreen}
            options={{ title: 'Hồ sơ cá nhân', headerBackTitle: 'Quay lại' }}
        />
        <Stack.Screen
            name="MyAppointments"
            component={MyAppointmentsScreen}
            options={{ title: 'Lịch hẹn của tôi', headerBackTitle: 'Quay lại' }}
        />
        <Stack.Screen
            name="AppointmentDetail"
            component={AppointmentDetailScreen}
            options={{ title: 'Chi tiết lịch hẹn', headerBackTitle: 'Quay lại' }}
        />
        <Stack.Screen
            name="MedicalHistory"
            component={MedicalHistoryScreen}
            options={{ title: 'Lịch sử khám bệnh', headerBackTitle: 'Quay lại' }}
        />
        <Stack.Screen
            name="MedicalHistoryDetail"
            component={MedicalHistoryDetailScreen}
            options={{ title: 'Chi tiết bệnh án', headerBackTitle: 'Quay lại' }}
        />
    </Stack.Navigator>
);

// =========================
// MAIN TAB NAVIGATOR
// =========================
const PatientNavigator = () => {

    const [unreadCount, setUnreadCount] = useState(0);

    const fetchUnread = async () => {
        try {
            const api = await authApis();
            const res = await api.get(endpoints['notifications']);
            const data = res.data.results ?? res.data;
            setUnreadCount(data.filter(n => !n.is_read).length);
        } catch (ex) {
            console.log('FETCH UNREAD ERROR:', ex);
        }
    };

    useEffect(() => {
        fetchUnread();
        const interval = setInterval(fetchUnread, 6000);
        return () => clearInterval(interval);
    }, []);

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

                    if (route.name === 'Appointments')       iconName = 'calendar-check';
                    else if (route.name === 'Invoices')      iconName = 'file-document-outline';
                    else if (route.name === 'Notifications') iconName = 'bell';
                    else if (route.name === 'ProfileTab')    iconName = 'account-circle';

                    if (route.name === 'Notifications') {
                        return (
                            <View>
                                <MaterialCommunityIcons
                                    name={iconName}
                                    size={size}
                                    color={color}
                                />
                                {unreadCount > 0 && (
                                    <Badge
                                        size={16}
                                        style={{
                                            position: 'absolute',
                                            top: -4,
                                            right: -8,
                                            backgroundColor: 'red',
                                        }}
                                    >
                                        {unreadCount > 99 ? '99+' : unreadCount}
                                    </Badge>
                                )}
                            </View>
                        );
                    }

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
            <Tab.Screen
                name="Appointments"
                component={AppointmentStack}
                options={{ tabBarLabel: 'Lịch hẹn' }}
            />

            <Tab.Screen
                name="Invoices"
                component={InvoiceScreen}
                options={{ tabBarLabel: 'Hóa đơn', headerShown: true, title: 'Hóa đơn' }}
            />

            <Tab.Screen
                name="Notifications"
                component={NotificationScreen}
                options={{
                    tabBarLabel: 'Thông báo',
                    headerShown: true,
                    title: 'Thông báo',
                    listeners: {
                        tabPress: () => setUnreadCount(0),
                    },
                }}
            />

            <Tab.Screen
                name="ProfileTab"
                component={ProfileStack}
                options={{ tabBarLabel: 'Cá nhân' }}
            />
        </Tab.Navigator>
    );
};

export default PatientNavigator;