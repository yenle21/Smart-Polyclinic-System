import React, { useState, useEffect, useContext, useRef } from 'react';
import { View } from 'react-native';
import { Badge } from 'react-native-paper';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { authApis, endpoints } from '../configs/Apis';
import { MyUserContext } from '../configs/Contexts';
import { db } from '../configs/firebase';
import { ref, onValue, off } from 'firebase/database';

import ScheduleScreen             from '../screens/patient/SchedulesScreen';
import AppointmentBookingScreen   from '../screens/patient/AppointmentBookingScreen';
import MyAppointmentsScreen       from '../screens/patient/MyAppointmentsScreen';
import AppointmentDetailScreen    from '../screens/patient/AppointmentDetailScreen';
import InvoiceScreen              from '../screens/patient/InvoiceScreen';
import ProfileScreen              from '../screens/shared/ProfileScreen';
import PersonalProfileScreen      from '../screens/patient/PersonalProfileScreen';
import MedicalHistoryScreen       from '../screens/patient/MedicalHistoryScreen';
import MedicalHistoryDetailScreen from '../screens/patient/MedicalHistoryDetailScreen';
import NotificationScreen         from '../screens/patient/NotificationScreen';
import IncomingCallScreen         from '../screens/patient/IncomingCallScreen';
import VideoCallScreen            from '../screens/shared/VideoCallScreen';
import ChatListScreen             from '../screens/shared/ChatListScreen';
import ChatScreen                 from '../screens/shared/ChatScreen';
import PaymentResultScreen        from '../screens/patient/PaymentResultScreen';

const Tab   = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const AppointmentStack = () => (
    <Stack.Navigator>
        <Stack.Screen name="ScheduleScreen"    component={ScheduleScreen}           options={{ title: 'Đặt lịch khám' }} />
        <Stack.Screen name="AppointmentBooking" component={AppointmentBookingScreen} options={{ title: 'Đặt lịch khám', headerBackTitle: 'Quay lại' }} />
    </Stack.Navigator>
);

const ProfileStack = () => (
    <Stack.Navigator>
        <Stack.Screen name="ProfileScreen"        component={ProfileScreen}             options={{ title: 'Cá nhân' }} />
        <Stack.Screen name="PersonalProfile"      component={PersonalProfileScreen}     options={{ title: 'Hồ sơ cá nhân', headerBackTitle: 'Quay lại' }} />
        <Stack.Screen name="MyAppointments"       component={MyAppointmentsScreen}      options={{ title: 'Lịch hẹn của tôi', headerBackTitle: 'Quay lại' }} />
        <Stack.Screen name="AppointmentDetail"    component={AppointmentDetailScreen}   options={{ title: 'Chi tiết lịch hẹn', headerBackTitle: 'Quay lại' }} />
        <Stack.Screen name="MedicalHistory"       component={MedicalHistoryScreen}      options={{ title: 'Lịch sử khám bệnh', headerBackTitle: 'Quay lại' }} />
        <Stack.Screen name="MedicalHistoryDetail" component={MedicalHistoryDetailScreen} options={{ title: 'Chi tiết bệnh án', headerBackTitle: 'Quay lại' }} />
        <Stack.Screen name="ScheduleScreen"       component={ScheduleScreen}            options={{ title: 'Chọn lịch mới', headerBackTitle: 'Quay lại' }} />
    </Stack.Navigator>
);

function ChatStack() {
    return (
        <Stack.Navigator>
            <Stack.Screen name="ChatList" component={ChatListScreen} options={{ title: 'Tin nhắn' }} />
            <Stack.Screen name="Chat" component={ChatScreen} options={({ route }) => ({ title: route.params.name })} />
        </Stack.Navigator>
    );
}

const TabNavigator = () => {
    const [user]          = useContext(MyUserContext);
    const [unreadCount, setUnreadCount] = useState(0);
    const navigation      = useNavigation();
    const handledCallsRef = useRef(new Set());

    const fetchUnread = async () => {
        try {
            const api  = await authApis();
            const res  = await api.get(endpoints['notifications']);
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

    useEffect(() => {
        if (!user?.id) return;

        const callsRef = ref(db, 'calls');
        const handler = onValue(callsRef, (snapshot) => {
            if (!snapshot.exists()) return;

            snapshot.forEach((child) => {
                const callId = child.key;
                const call   = child.val();

                if (
                    call.status === 'calling' &&
                    String(call.receiverId) === String(user.id) &&
                    !handledCallsRef.current.has(`${callId}_${call.attempt}`)
                ) {
                    handledCallsRef.current.add(`${callId}_${call.attempt}`);
                    navigation.navigate('IncomingCall', {
                        callId,
                        doctorName: call.doctorName || 'Bác sĩ',
                        attempt:    call.attempt || 1,
                    });
                }
            });
        });

        return () => off(callsRef, 'value', handler);
    }, [user?.id, navigation]);

    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarActiveTintColor:   '#2196F3',
                tabBarInactiveTintColor: 'gray',
                tabBarStyle:             { height: 65, paddingBottom: 5 },
                tabBarLabelStyle:        { fontSize: 12, fontWeight: '600' },
                tabBarIcon: ({ color, size }) => {
                    let iconName;
                    if      (route.name === 'Appointments')  iconName = 'calendar-check';
                    else if (route.name === 'Invoices')      iconName = 'file-document-outline';
                    else if (route.name === 'Notifications') iconName = 'bell';
                    else if (route.name === 'ProfileTab')    iconName = 'account-circle';

                    if (route.name === 'Notifications') {
                        return (
                            <View>
                                <MaterialCommunityIcons name={iconName} size={size} color={color} />
                                {unreadCount > 0 && (
                                    <Badge size={16} style={{ position: 'absolute', top: -4, right: -8, backgroundColor: 'red' }}>
                                        {unreadCount > 99 ? '99+' : unreadCount}
                                    </Badge>
                                )}
                            </View>
                        );
                    }
                    return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
                },
            })}
        >
            <Tab.Screen name="Appointments"  component={AppointmentStack} options={{ tabBarLabel: 'Lịch hẹn' }} />
            <Tab.Screen name="Invoices"      component={InvoiceScreen}    options={{ tabBarLabel: 'Hóa đơn', headerShown: true, title: 'Hóa đơn' }} />
            <Tab.Screen
                name="ChatTab"
                component={ChatStack}
                options={{
                    tabBarLabel: 'Tin nhắn',
                    tabBarIcon: ({ color }) => <MaterialCommunityIcons name="chat" size={24} color={color} />,
                }}
            />
            <Tab.Screen name="Notifications" component={NotificationScreen} options={{ tabBarLabel: 'Thông báo', headerShown: true, title: 'Thông báo', listeners: { tabPress: () => setUnreadCount(0) } }} />
            <Tab.Screen name="ProfileTab"    component={ProfileStack}      options={{ tabBarLabel: 'Cá nhân' }} />
        </Tab.Navigator>
    );
};

const PatientNavigator = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="MainTabs"    component={TabNavigator} />
        <Stack.Screen
            name="IncomingCall"
            component={IncomingCallScreen}
            options={{ presentation: 'fullScreenModal', gestureEnabled: false }}
        />
        <Stack.Screen
            name="VideoCall"
            component={VideoCallScreen}
            options={{ headerShown: false, gestureEnabled: false }}
        />
        {/* Màn hình nhận kết quả thanh toán VNPAY/MoMo qua deep link */}
        <Stack.Screen
            name="PaymentResult"
            component={PaymentResultScreen}
            options={{ headerShown: true, title: 'Kết quả thanh toán' }}
        />
    </Stack.Navigator>
);

export default PatientNavigator;