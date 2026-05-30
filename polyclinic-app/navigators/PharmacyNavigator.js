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

// Pharmacy
import CategoryListScreen       from '../screens/pharmacy/CategoryScreen';
import MedicineListScreen       from '../screens/pharmacy/MedicineListScreen';
import MedicineDetailScreen     from '../screens/pharmacy/MedicineDetailScreen';
import MedicineFormScreen     from '../screens/pharmacy/MedicineFormScreen';
import AlertScreen              from '../screens/pharmacy/AlertScreen';
import StockTransactionScreen   from '../screens/pharmacy/StockTransactionScreen';
import StockFormScreen from '../screens/pharmacy/StockFormScreen';
import PrescriptionScreen       from '../screens/pharmacy/PrescriptionScreen';
import PrescriptionDetailScreen from '../screens/pharmacy/PrescriptionDetailScreen';

// Shared
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

function PharmacyStack() {
    return (
        <Stack.Navigator screenOptions={headerOptions}>
            <Stack.Screen name="CategoryList"   component={CategoryListScreen}   options={{ title: 'Danh mục thuốc' }} />
            <Stack.Screen name="MedicineList"   component={MedicineListScreen}   options={{ title: 'Danh sách thuốc' }} />
            <Stack.Screen name="MedicineDetail" component={MedicineDetailScreen} options={{ title: 'Chi tiết thuốc' }} />
            <Stack.Screen name="MedicineForm" component={MedicineFormScreen} options={{ title: 'Thêm thuốc' }} />
            <Stack.Screen name="Alert"          component={AlertScreen}          options={{ title: 'Cảnh báo kho' }} />
        </Stack.Navigator>
    );
}

function PrescriptionStack() {
    return (
        <Stack.Navigator screenOptions={headerOptions}>
            <Stack.Screen name="PrescriptionList"   component={PrescriptionScreen}       options={{ title: 'Đơn thuốc' }} />
            <Stack.Screen name="PrescriptionDetail" component={PrescriptionDetailScreen} options={{ title: 'Chi tiết đơn thuốc' }} />
        </Stack.Navigator>
    );
}



function StockStack() {
    return (
        <Stack.Navigator screenOptions={headerOptions}>
            <Stack.Screen name="StockTransaction" component={StockTransactionScreen} options={{ title: 'Quản lý kho' }} />
            <Stack.Screen name="StockForm"        component={StockFormScreen}        options={{ title: 'Tạo giao dịch' }} />
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
                name="PharmacyTab"
                component={PharmacyStack}
                options={{
                    tabBarLabel: 'Dược phẩm',
                    tabBarIcon: ({ color }) => <MaterialCommunityIcons name="pill" size={24} color={color} />,
                }}
            />
            <Tab.Screen
                name="StockTab"
                component={StockStack}
                options={{
                    tabBarLabel: 'Kho',
                    tabBarIcon: ({ color }) => <MaterialCommunityIcons name="warehouse" size={24} color={color} />,
                }}
            />
            <Tab.Screen
                name="PrescriptionTab"
                component={PrescriptionStack}
                options={{
                    tabBarLabel: 'Đơn thuốc',
                    tabBarIcon: ({ color }) => <MaterialCommunityIcons name="file-document" size={24} color={color} />,
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