import React, { useContext, useState, useEffect } from "react";
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
} from "react-native";

import {
    Button,
    HelperText,
    TextInput,
    Menu,
    Divider,
} from "react-native-paper";

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from "@react-navigation/native";
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';

import Apis, { authApis, endpoints } from "../../configs/Apis";
import { MyUserContext } from "../../configs/Contexts";
import loginstyles from "../../styles/loginstyles";

WebBrowser.maybeCompleteAuthSession();

// ✅ Dùng iOS Client ID
const GOOGLE_CLIENT_ID = '591879549833-bukf3qsarrvphb9nfl8lc3llaq61e4bb.apps.googleusercontent.com';

const discovery = {
    authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenEndpoint:         'https://oauth2.googleapis.com/token',
};

const ROLES = [
    { key: 'doctor',   label: '🩺 Bác sĩ' },
    { key: 'staff',    label: '💊 Nhân viên y tế' },
    { key: 'pharmacy', label: '💊 Dược sĩ' },
    { key: 'admin',    label: '🛡️ Admin' },
    { key: 'patient',  label: '🧑‍⚕️ Bệnh nhân' },
];

const Login = () => {

    const userInfo = [
        { field: 'username', title: 'Tên đăng nhập', icon: 'account' },
        { field: 'password', title: 'Mật khẩu',      icon: 'lock' },
    ];

    const [user,          setUser]          = useState({});
    const [role,          setRole]          = useState(null);
    const [menuVisible,   setMenu]          = useState(false);
    const [err,           setErr]           = useState(null);
    const [loading,       setLoading]       = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [showPassword,  setShowPassword]  = useState(false);

    const [, dispatch] = useContext(MyUserContext);
    const nav = useNavigation();

    // ✅ Dùng reversed iOS Client ID làm redirect URI
    const redirectUri = 'com.googleusercontent.apps.591879549833-bukf3qsarrvphb9nfl8lc3llaq61e4bb:/oauthredirect';

    useEffect(() => {
        console.log('REDIRECT URI:', redirectUri);
    }, []);

    // ✅ Dùng ResponseType.Token — lấy access_token trực tiếp, không cần proxy
    const [request, response, promptAsync] = AuthSession.useAuthRequest(
        {
            clientId:     GOOGLE_CLIENT_ID,
            scopes:       ['openid', 'email', 'profile'],
            responseType: AuthSession.ResponseType.Token,
            redirectUri,
        },
        discovery
    );

    // ✅ Lấy access_token trực tiếp từ response
    useEffect(() => {
        if (response?.type === 'success') {
            const { access_token } = response.params;
            if (access_token) {
                handleGoogleToken(access_token);
            } else {
                setErr('Không nhận được token từ Google.');
            }
        } else if (response?.type === 'error') {
            console.log('GOOGLE RESPONSE ERROR:', response.error);
            setErr('Đăng nhập Google thất bại. Vui lòng thử lại.');
        }
    }, [response]);

    // ========================
    // GỬI ACCESS TOKEN LÊN BACKEND
    // ========================
    const handleGoogleToken = async (accessToken) => {
        try {
            setGoogleLoading(true);
            setErr(null);

            // ✅ Gửi access_token lên backend
            const res = await Apis.post(endpoints['google-login'], {
                access_token: accessToken,
            });

            const { access } = res.data;
            await AsyncStorage.setItem('access_token', access);

            const api = await authApis();
            const u   = await api.get(endpoints['current-user']);

            dispatch({ type: 'LOGIN', payload: u.data });

        } catch (ex) {
            console.log('GOOGLE LOGIN ERROR:', ex.response?.data || ex);
            setErr('Đăng nhập Google thất bại. Vui lòng thử lại.');
        } finally {
            setGoogleLoading(false);
        }
    };

    // ========================
    // VALIDATE
    // ========================
    const validate = () => {
        if (!role) {
            setErr('Vui lòng chọn vai trò!');
            return false;
        }
        if (!user.username) {
            setErr('Vui lòng nhập tên đăng nhập!');
            return false;
        }
        if (!user.password) {
            setErr('Vui lòng nhập mật khẩu!');
            return false;
        }
        setErr(null);
        return true;
    };

    // ========================
    // LOGIN THƯỜNG
    // ========================
    const login = async () => {
        if (!validate()) return;

        try {
            setLoading(true);
            setErr(null);

            const params = new URLSearchParams();
            params.append('username',      user.username);
            params.append('password',      user.password);
            params.append('client_id',     'Qo0xwsPc00Wama0YySwi81z1jfnjPbUxi6xYc5H1');
            params.append('client_secret', 'SIN6g29BplhvAY0IfUin8OVGnOzAuvbfy9WXbO8FWIitHgzlRYYDYtixGFOQXbpil0DwAOhx5PdVfGjbOOlZaZo2GzVW6WzqsR4kXa927OTC3qxqUtmFRjqauSvebbfS');
            params.append('grant_type',    'password');


            const res = await Apis.post(endpoints['login'], params, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            });


            const accessToken = res.data.access_token;
            await AsyncStorage.setItem('access_token', accessToken);

            const api = await authApis();
            const u   = await api.get(endpoints['current-user']);
            const currentUser = u.data;

            if (currentUser.role !== role.key) {
                setErr(`Tài khoản này không phải ${role.label}`);
                return;
            }

            dispatch({ type: 'LOGIN', payload: currentUser });

        } catch (ex) {
            console.log('LOGIN ERROR:', ex.response?.data || ex);

            if (ex.response?.data) {
                const errCode = ex.response.data.error;
                if (errCode === 'invalid_grant') {
                    setErr('Tài khoản hoặc mật khẩu không chính xác!');
                } else if (errCode === 'invalid_client') {
                    setErr('Lỗi cấu hình bảo mật hệ thống!');
                } else {
                    setErr(`Đăng nhập thất bại: ${ex.response.data.error_description || errCode}`);
                }
            } else {
                setErr('Không thể kết nối đến máy chủ!');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView
            contentContainerStyle={loginstyles.container}
            keyboardShouldPersistTaps="handled"
        >
            <View style={loginstyles.card}>

                {/* TITLE */}
                <Text style={loginstyles.cardTitle}>🏥 Smart Polyclinic</Text>
                <Text style={loginstyles.cardSub}>Chọn vai trò và đăng nhập</Text>

                {/* ROLE DROPDOWN */}
                <Menu
                    visible={menuVisible}
                    onDismiss={() => setMenu(false)}
                    anchor={
                        <Button
                            mode="outlined"
                            onPress={() => setMenu(true)}
                            style={loginstyles.dropdownBtn}
                            contentStyle={loginstyles.dropdownContent}
                            labelStyle={[
                                loginstyles.dropdownLabel,
                                role && loginstyles.dropdownLabelSelected
                            ]}
                            icon="chevron-down"
                        >
                            {role ? role.label : 'Chọn vai trò...'}
                        </Button>
                    }
                    style={loginstyles.menuStyle}
                >
                    {ROLES.map((r, index) => (
                        <React.Fragment key={r.key}>
                            <Menu.Item
                                title={r.label}
                                titleStyle={[
                                    loginstyles.menuItemTitle,
                                    role?.key === r.key && loginstyles.menuItemTitleActive
                                ]}
                                style={[
                                    loginstyles.menuItem,
                                    role?.key === r.key && loginstyles.menuItemActive
                                ]}
                                onPress={() => {
                                    setRole(r);
                                    setMenu(false);
                                    setErr(null);
                                }}
                            />
                            {index < ROLES.length - 1 && <Divider />}
                        </React.Fragment>
                    ))}
                </Menu>

                {/* INPUTS */}
                {userInfo.map(u => (
                    <TextInput
                        key={u.field}
                        value={user[u.field]}
                        onChangeText={(t) => setUser({ ...user, [u.field]: t })}
                        style={loginstyles.input}
                        label={u.title}
                        placeholder={u.title}
                        secureTextEntry={u.field === 'password' ? !showPassword : false}
                        right={
                            u.field === 'password' ? (
                                <TextInput.Icon
                                    icon={showPassword ? "eye-off" : "eye"}
                                    onPress={() => setShowPassword(!showPassword)}
                                />
                            ) : (
                                <TextInput.Icon icon={u.icon} />
                            )
                        }
                    />
                ))}

                {/* ERROR */}
                <HelperText type="error" visible={!!err} style={loginstyles.errorText}>
                    {err}
                </HelperText>

                {/* LOGIN BUTTON */}
                <Button
                    loading={loading}
                    disabled={loading || googleLoading}
                    mode="contained"
                    onPress={login}
                    style={loginstyles.loginBtn}
                    labelStyle={loginstyles.loginBtnLabel}
                >
                    Đăng nhập
                </Button>

                {/* DIVIDER */}
                <View style={loginstyles.dividerRow}>
                    <View style={loginstyles.dividerLine} />
                    <Text style={loginstyles.dividerText}>hoặc</Text>
                    <View style={loginstyles.dividerLine} />
                </View>

                {/* GOOGLE LOGIN BUTTON */}
                <Button
                    mode="outlined"
                    onPress={() => promptAsync()}
                    disabled={!request || loading || googleLoading}
                    loading={googleLoading}
                    icon="google"
                    style={loginstyles.googleBtn}
                    labelStyle={loginstyles.googleBtnLabel}
                >
                    Đăng nhập với Google
                </Button>

                {/* REGISTER */}
                <View style={loginstyles.registerRow}>
                    <Text style={loginstyles.registerText}>Chưa có tài khoản?</Text>
                    <TouchableOpacity onPress={() => nav.navigate('Register')}>
                        <Text style={loginstyles.registerLink}>Đăng ký ngay</Text>
                    </TouchableOpacity>
                </View>

            </View>
        </ScrollView>
    );
};

export default Login;