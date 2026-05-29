import React, { useReducer, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { PaperProvider } from 'react-native-paper';
import { theme } from './components/shared/theme';

import MyUserReducer from './reducers/MyUserReducer';
import { MyUserContext } from './configs/Contexts';
import * as WebBrowser from 'expo-web-browser';
import AuthNavigator     from './navigators/AuthNavigator';
import PatientNavigator  from './navigators/PatientNavigator';
import DoctorNavigator   from './navigators/DoctorNavigator';
import PharmacyNavigator from './navigators/PharmacyNavigator';
import StaffNavigator    from './navigators/StaffNavigator';
import AdminNavigator    from './navigators/AdminNavigator';

import { db } from './configs/firebase';
import { ref, set } from 'firebase/database';



export default function App() {
    const [user, dispatch] = useReducer(MyUserReducer, null);

    useEffect(() => {
        const testFirebase = async () => {
            await set(ref(db, 'test'), { connected: true, time: Date.now() });
            console.log('✅ Firebase connected!');
        };
        testFirebase();
    }, []);

    const getNavigator = () => {
        if (!user) return <AuthNavigator />;

        const role = user.role;

        if (role === 'patient')  return <PatientNavigator />;
        if (role === 'doctor')   return <DoctorNavigator />;
        if (role === 'admin')    return <AdminNavigator />;
        if (role === 'pharmacy') return <PharmacyNavigator />;
        if (role === 'staff')    return <StaffNavigator />;

        return <AuthNavigator />;
    };

    return (
        <MyUserContext.Provider value={[user, dispatch]}>
            <PaperProvider theme={theme}>
                <NavigationContainer >
                    {getNavigator()}
                </NavigationContainer>
            </PaperProvider>
        </MyUserContext.Provider>
    );
}