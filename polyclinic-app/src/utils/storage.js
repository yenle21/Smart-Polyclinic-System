import AsyncStorage from '@react-native-async-storage/async-storage';

export const saveToken  = (token) => AsyncStorage.setItem('access_token', token);
export const getToken   = ()      => AsyncStorage.getItem('access_token');
export const removeToken= ()      => AsyncStorage.removeItem('access_token');
export const saveUser   = (user)  => AsyncStorage.setItem('user', JSON.stringify(user));
export const getUser    = async () => {
    const u = await AsyncStorage.getItem('user');
    return u ? JSON.parse(u) : null;
};
export const clearAll   = ()      => AsyncStorage.clear();