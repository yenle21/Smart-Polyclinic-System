import React, { useReducer } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { PaperProvider } from 'react-native-paper';
import { theme } from './components/shared/theme';

import MyUserReducer from './reducers/MyUserReducer';
import { MyUserContext } from './configs/Contexts';

import AuthNavigator from './navigators/AuthNavigator';
import PatientNavigator from './navigators/PatientNavigator'; // Đảm bảo dòng import này chính xác

export default function App() {
    const [user, dispatch] = useReducer(MyUserReducer, null);

    return (
        <MyUserContext.Provider value={[user, dispatch]}>
            <PaperProvider theme={theme}>
                <NavigationContainer>
                    {user === null ? (
                        <AuthNavigator />
                    ) : (
                        <>
                            {/* Khi đăng nhập chọn role 'patient', app sẽ kích hoạt component này */}
                            {user.role === 'patient' && <PatientNavigator />}
                            
                            {/* Bạn có thể tạm thời comment các role khác lại nếu các file đó chưa có code */}
                            {/* {user.role === 'admin' && <AdminNavigator />} */}
                            {/* {user.role === 'doctor' && <DoctorNavigator />} */}
                        </>
                    )}
                </NavigationContainer>
            </PaperProvider>
        </MyUserContext.Provider>
    );
}