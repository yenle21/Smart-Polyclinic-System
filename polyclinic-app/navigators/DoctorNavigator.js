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

// Appointment
import AppointmentScreen
from '../screens/doctor/AppointmentScreen';

import AppointmentDetailScreenDoctor
from '../screens/doctor/AppoimentDetailScreenDoctor';

// Schedule
import ScheduleManagerScreen
from '../screens/doctor/ScheduleManagerScreen';

// Medical Record
import MedicalRecordListScreen
from '../screens/doctor/MedicalRecordListScreen';

import MedicalRecordDetailScreen
from '../screens/doctor/MedicalRecordDetailScreen';

import PrescriptionScreen
from '../screens/doctor/PrescriptionScreen';

// ← THÊM
import PrescriptionDetailScreen
from '../screens/doctor/PrescriptionDetailScreen';

// Profile
import ProfileScreen
from '../screens/shared/ProfileScreen';


// =====================================================
// NAVIGATORS
// =====================================================
const Tab   = createBottomTabNavigator();
const Stack = createNativeStackNavigator();


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

        {/* ← THÊM MỚI */}
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
// MAIN TAB
// =====================================================
const DoctorNavigator = () => (

    <Tab.Navigator
        screenOptions={({ route }) => ({

            headerShown: false,

            tabBarActiveTintColor:   '#2196F3',
            tabBarInactiveTintColor: 'gray',

            tabBarStyle: {
                height:        65,
                paddingBottom: 5,
            },

            tabBarLabelStyle: {
                fontSize:   12,
                fontWeight: '600',
            },

            tabBarIcon: ({ color, size }) => {

                let iconName;

                switch (route.name) {
                    case 'Appointments': iconName = 'calendar-clock';   break;
                    case 'Schedule':     iconName = 'calendar-edit';    break;
                    case 'MedicalTab':   iconName = 'folder-account';   break;
                    case 'ProfileTab':   iconName = 'account-circle';   break;
                    default:             iconName = 'circle';
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
            options={{ tabBarLabel: 'Lịch khám' }}
        />

        <Tab.Screen
            name="Schedule"
            component={ScheduleManagerScreen}
            options={{
                tabBarLabel: 'Lịch làm việc',
                headerShown: true,
                title:       'Lịch làm việc',
            }}
        />

        <Tab.Screen
            name="MedicalTab"
            component={MedicalStack}
            options={{ tabBarLabel: 'Hồ sơ' }}
        />

        <Tab.Screen
            name="ProfileTab"
            component={ProfileStack}
            options={{ tabBarLabel: 'Cá nhân' }}
        />

    </Tab.Navigator>
);

export default DoctorNavigator;