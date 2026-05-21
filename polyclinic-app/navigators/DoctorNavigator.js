import React from 'react';

import {
    createBottomTabNavigator,
} from '@react-navigation/bottom-tabs';

import {
    createNativeStackNavigator,
} from '@react-navigation/native-stack';

import {
    MaterialCommunityIcons,
} from '@expo/vector-icons';

// =====================================================
// SCREENS
// =====================================================

// HOME
import DoctorHomeScreen
from '../screens/doctor/DoctorHomeScreen';

// APPOINTMENT
import AppointmentScreen
from '../screens/doctor/AppointmentScreen';

import AppointmentDetailScreenDoctor
from '../screens/doctor/AppoimentDetailScreenDoctor';

// VIDEO CALL
import VideoCallScreen
from '../screens/shared/VideoCallScreen';

// SCHEDULE
import ScheduleManagerScreen
from '../screens/doctor/ScheduleManagerScreen';

// MEDICAL RECORD
import MedicalRecordListScreen
from '../screens/doctor/MedicalRecordListScreen';

import MedicalRecordDetailScreen
from '../screens/doctor/MedicalRecordDetailScreen';

// PRESCRIPTION
import PrescriptionScreen
from '../screens/doctor/PrescriptionScreen';

import PrescriptionDetailScreen
from '../screens/doctor/PrescriptionDetailScreen';

// PROFILE
import ProfileScreen
from '../screens/shared/ProfileScreen';


// =====================================================
// NAVIGATORS
// =====================================================
const Tab   = createBottomTabNavigator();
const Stack = createNativeStackNavigator();


// =====================================================
// HOME STACK
// =====================================================
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
            options={{
                headerShown: false,
                gestureEnabled: false,
            }}
        />

    </Stack.Navigator>
);


// =====================================================
// APPOINTMENT STACK
// =====================================================
const AppointmentStack = () => (
    <Stack.Navigator>

        <Stack.Screen
            name="AppointmentList"
            component={AppointmentScreen}
            options={{ title: 'Lịch khám' }}
        />

        <Stack.Screen
            name="AppointmentDetail"
            component={AppointmentDetailScreenDoctor}
            options={{ title: 'Chi tiết lịch khám' }}
        />

        <Stack.Screen
            name="MedicalRecordDetail"
            component={MedicalRecordDetailScreen}
            options={{ title: 'Chi tiết hồ sơ' }}
        />

        <Stack.Screen
            name="Prescription"
            component={PrescriptionScreen}
            options={{ title: 'Kê đơn thuốc' }}
        />

        <Stack.Screen
            name="VideoCall"
            component={VideoCallScreen}
            options={{
                headerShown: false,
                gestureEnabled: false,
            }}
        />

    </Stack.Navigator>
);


// =====================================================
// MEDICAL STACK
// =====================================================
const MedicalStack = () => (
    <Stack.Navigator>

        <Stack.Screen
            name="MedicalRecordList"
            component={MedicalRecordListScreen}
            options={{ title: 'Hồ sơ bệnh nhân' }}
        />

        <Stack.Screen
            name="MedicalRecordDetailTab"
            component={MedicalRecordDetailScreen}
            options={{ title: 'Chi tiết hồ sơ' }}
        />

        <Stack.Screen
            name="PrescriptionTab"
            component={PrescriptionScreen}
            options={{ title: 'Kê đơn thuốc' }}
        />

        <Stack.Screen
            name="PrescriptionDetail"
            component={PrescriptionDetailScreen}
            options={{ title: 'Chi tiết đơn thuốc' }}
        />

    </Stack.Navigator>
);


// =====================================================
// PROFILE STACK
// =====================================================
const ProfileStack = () => (
    <Stack.Navigator>

        <Stack.Screen
            name="Profile"
            component={ProfileScreen}
            options={{ title: 'Cá nhân' }}
        />

    </Stack.Navigator>
);


// =====================================================
// MAIN TAB NAVIGATOR
// =====================================================
const DoctorNavigator = () => (

    <Tab.Navigator
        screenOptions={({ route }) => ({

            headerShown: false,

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

                switch (route.name) {

                    case 'Home':
                        iconName = 'view-dashboard';
                        break;

                    case 'Appointments':
                        iconName = 'calendar-clock';
                        break;

                    case 'Schedule':
                        iconName = 'calendar-edit';
                        break;

                    case 'MedicalTab':
                        iconName = 'folder-account';
                        break;

                    case 'ProfileTab':
                        iconName = 'account-circle';
                        break;

                    default:
                        iconName = 'circle';
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

        {/* HOME */}
        <Tab.Screen
            name="Home"
            component={HomeStack}
            options={{ tabBarLabel: 'Tổng quan' }}
        />

        {/* APPOINTMENTS */}
        <Tab.Screen
            name="Appointments"
            component={AppointmentStack}
            options={{ tabBarLabel: 'Lịch khám' }}
        />

        {/* SCHEDULE */}
        <Tab.Screen
            name="Schedule"
            component={ScheduleManagerScreen}
            options={{
                tabBarLabel: 'Lịch làm việc',
                headerShown: true,
                title: 'Lịch làm việc',
            }}
        />

        {/* MEDICAL */}
        <Tab.Screen
            name="MedicalTab"
            component={MedicalStack}
            options={{ tabBarLabel: 'Hồ sơ' }}
        />

        {/* PROFILE */}
        <Tab.Screen
            name="ProfileTab"
            component={ProfileStack}
            options={{ tabBarLabel: 'Cá nhân' }}
        />

    </Tab.Navigator>
);

export default DoctorNavigator;