import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import COLORS from '../styles/colors';
import AppHeader from '../components/shared/AppHeader';
import { useEffect, useState, useContext } from 'react';
import { MyUserContext } from '../configs/Contexts';
import { db } from '../configs/firebase';
import { ref, onValue } from 'firebase/database';
import { View } from 'react-native';
import { Badge } from 'react-native-paper';


import AppointmentListScreen from '../screens/staff/AppointmentListScreen';
import AppointmentDetailScreen from '../screens/staff/AppointmentDetailScreen';
import InvoiceDetailScreen   from '../screens/staff/InvoiceDetailScreen';
import InvoiceListScreen     from '../screens/staff/InvoiceListScreen';

import ProfileScreen from '../screens/shared/ProfileScreen';
import ChatListScreen from '../screens/shared/ChatListScreen';
import ChatScreen     from '../screens/shared/ChatScreen';


const Tab   = createBottomTabNavigator();
const Stack = createStackNavigator();


const headerOptions = {
    header: ({ navigation, route, options }) => (
        <AppHeader
            title={options.title || route.name}
            onBack={navigation.canGoBack() ? () => navigation.goBack() : null}
        />
    ),
};
function AppointmentStack() {
    return (
        <Stack.Navigator screenOptions={headerOptions}>
            <Stack.Screen name="AppointmentList" component={AppointmentListScreen} options={{ title: 'Quản lý lịch hẹn' }} />
            <Stack.Screen name="AppointmentDetail" component={AppointmentDetailScreen} options={{ title: 'Chi tiết lịch hẹn' }} />
        </Stack.Navigator>
    );
}


function InvoiceStack() {
    return (
        <Stack.Navigator screenOptions={headerOptions}>
            <Stack.Screen name="InvoiceList"   component={InvoiceListScreen}   options={{ title: 'Hóa đơn' }} />
            <Stack.Screen name="InvoiceDetail" component={InvoiceDetailScreen} options={{ title: 'Chi tiết hóa đơn' }} />
        </Stack.Navigator>
    );
}

function ProfileStack() {
    return (
        <Stack.Navigator screenOptions={headerOptions}>
            <Stack.Screen name="ProfileHome" component={ProfileScreen}
                          options={{ title: 'Hồ sơ cá nhân' }} />
        </Stack.Navigator>
    );
}

function ChatStack() {
    return (
        <Stack.Navigator screenOptions={headerOptions}>
            <Stack.Screen name="ChatList" component={ChatListScreen} options={{ title: 'Tin nhắn' }} />
            <Stack.Screen name="Chat"     component={ChatScreen}     options={({ route }) => ({ title: route.params.name })} />
        </Stack.Navigator>
    );
}

export default function StaffNavigator() {
    const [user]        = useContext(MyUserContext);
    const [unreadChat, setUnreadChat] = useState(0);

    useEffect(() => {
        if (!user?.id) return;
        const chatsRef = ref(db, 'chats');
        const unsub = onValue(chatsRef, (snapshot) => {
            const data = snapshot.val();
            if (!data) { setUnreadChat(0); return; }
          
            const total = Object.values(data)
                .reduce((sum, chat) => sum + (chat.unread_staff || 0), 0);
            setUnreadChat(total);
        });
        return () => unsub();
    }, [user?.id]);
    return (
        <Tab.Navigator screenOptions={{
            headerShown:           false,
            tabBarActiveTintColor: COLORS.primary,
            tabBarStyle:           { paddingBottom: 5, height: 60 },
            
        }}>

            <Tab.Screen
                name="AppointmentTab"
                component={AppointmentStack}
                options={{
                    tabBarLabel: 'Lịch hẹn',
                    tabBarIcon: ({ color }) => <MaterialCommunityIcons name="calendar-check" size={24} color={color} />,
                }}
            />
            
            <Tab.Screen
                name="InvoiceTab"
                component={InvoiceStack}
                options={{
                    tabBarLabel: 'Thanh toán',
                    tabBarIcon: ({ color }) => <MaterialCommunityIcons name="receipt" size={24} color={color} />,
                }}
            />
            <Tab.Screen
                name="ChatTab"
                component={ChatStack}
                options={{
                    tabBarLabel: 'Tin nhắn',
                    tabBarIcon: ({ color, size }) => (
                        <View>
                            <MaterialCommunityIcons name="chat" size={size} color={color} />
                            {unreadChat > 0 && (
                                <Badge size={16} style={{
                                    position: 'absolute',
                                    top: -4,
                                    right: -8,
                                    backgroundColor: 'red',
                                }}>
                                    {unreadChat > 99 ? '99+' : unreadChat}
                                </Badge>
                            )}
                        </View>
                    ),
                }}
            />

            <Tab.Screen
                name="ProfileTab"
                component={ProfileStack}  
                options={{
                    tabBarLabel: 'Cá nhân',
                    tabBarIcon: ({ color }) =>
                        <MaterialCommunityIcons name="account" size={24} color={color} />,
                }}
            />
        </Tab.Navigator>
    );
}