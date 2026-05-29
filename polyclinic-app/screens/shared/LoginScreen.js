import React, { useContext, useState } from "react";
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
import {
    GoogleSignin,
    statusCodes,
} from '@react-native-google-signin/google-signin';

import Apis, { authApis, endpoints } from "../../configs/Apis";
import { MyUserContext } from "../../configs/Contexts";
import loginstyles from "../../styles/loginstyles";

const ROLES = [
    { key: 'doctor',   label: '🩺 Bác sĩ' },
    { key: 'staff',    label: '💊 Nhân viên y tế' },
    { key: 'pharmacy', label: '💊 Dược sĩ' },
    { key: 'admin',    label: '🛡️ Admin' },
    { key: 'patient',  label: '🧑‍⚕️ Bệnh nhân' },
];

// ✅ Web application Client ID từ Google Cloud Console
GoogleSignin.configure({
    webClientId: '591879549833-qgo82d8cfdhkkk3au38jn8a0r4g8apfe.apps.googleusercontent.com',
    offlineAccess: false,
    scopes: ['email', 'profile'],
});

const Login = () => {

    const userInfo = [
        { field: 'username', title: 'Tên đăng nhập', icon: 'account' },
        { field: 'password', title: 'Mật khẩu',      icon: 'lock'    },
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

    // ================================================================
    // GOOGLE LOGIN
    // ✅ Dùng @react-native-google-signin/google-signin
    // ✅ Trả về OAuth2 token (đáp ứng yêu cầu thầy)
    // ✅ Tích hợp Gmail theo yêu cầu đề tài
    // ================================================================
    const handleGoogleLogin = async () => {
        try {
            setGoogleLoading(true);
            setErr(null);

            // Kiểm tra Google Play Services
            await GoogleSignin.hasPlayServices({
                showPlayServicesUpdateDialog: true,
            });

            // Mở màn hình chọn tài khoản Google
            const signInResult = await GoogleSignin.signIn();

            // Lấy idToken
            const idToken = signInResult?.data?.idToken ?? signInResult?.idToken;

            if (!idToken) {
                throw new Error('Không lấy được idToken từ Google');
            }

            console.log('GOOGLE ID TOKEN:', idToken.substring(0, 30) + '...');

            // Gửi id_token lên backend Django
            const res = await Apis.post(
                endpoints['google-login'],
                { id_token: idToken }
            );

            console.log('BACKEND RESPONSE:', res.data);

            // ✅ Backend trả access_token (OAuth2) — lưu giống login thường
            const accessToken = res.data.access_token;
            await AsyncStorage.setItem('access_token', accessToken);

            // Gọi current-user với OAuth2 token
            const api = await authApis();
            const u   = await api.get(endpoints['current-user']);

            console.log('CURRENT USER:', u.data);

            dispatch({ type: 'LOGIN', payload: u.data });

        } catch (ex) {
            console.log('GOOGLE LOGIN ERROR:', ex?.response?.data || ex);

            if (ex.code === statusCodes.SIGN_IN_CANCELLED) {
                setErr('Đăng nhập Google bị huỷ.');
            } else if (ex.code === statusCodes.IN_PROGRESS) {
                setErr('Đang xử lý đăng nhập, vui lòng chờ...');
            } else if (ex.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
                setErr('Google Play Services không khả dụng trên thiết bị này.');
            } else if (ex?.response?.data?.error) {
                setErr(ex.response.data.error);
            } else {
                setErr('Đăng nhập Google thất bại. Vui lòng thử lại.');
            }
        } finally {
            try { await GoogleSignin.signOut(); } catch (_) {}
            setGoogleLoading(false);
        }
    };

    // ================================================================
    // VALIDATE
    // ================================================================
    const validate = () => {
        if (!role) {
            setErr('Vui lòng chọn vai trò!');
            return false;
        }
        if (!user.username?.trim()) {
            setErr('Vui lòng nhập tên đăng nhập!');
            return false;
        }
        if (!user.password?.trim()) {
            setErr('Vui lòng nhập mật khẩu!');
            return false;
        }
        setErr(null);
        return true;
    };

    // ================================================================
    // LOGIN THƯỜNG (username + password + OAuth2)
    // ================================================================
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

            const res = await Apis.post(
                endpoints['login'],
                params,
                { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
            );

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
                    setErr(`Đăng nhập thất bại: ${
                        ex.response.data.error_description || errCode
                    }`);
                }
            } else {
                setErr('Không thể kết nối đến máy chủ!');
            }
        } finally {
            setLoading(false);
        }
    };

    // ================================================================
    // UI
    // ================================================================
    return (
        <ScrollView
            contentContainerStyle={loginstyles.container}
            keyboardShouldPersistTaps="handled"
        >
            <View style={loginstyles.card}>

                <Text style={loginstyles.cardTitle}>
                    🏥 Smart Polyclinic
                </Text>
                <Text style={loginstyles.cardSub}>
                    Chọn vai trò và đăng nhập
                </Text>

                {/* Dropdown chọn vai trò */}
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

                {/* Input username & password */}
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
                            u.field === 'password'
                                ? (
                                    <TextInput.Icon
                                        icon={showPassword ? "eye-off" : "eye"}
                                        onPress={() => setShowPassword(!showPassword)}
                                    />
                                )
                                : <TextInput.Icon icon={u.icon} />
                        }
                    />
                ))}

                {/* Error */}
                <HelperText
                    type="error"
                    visible={!!err}
                    style={loginstyles.errorText}
                >
                    {err}
                </HelperText>

                {/* Nút đăng nhập thường */}
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

                {/* Divider */}
                <View style={loginstyles.dividerRow}>
                    <View style={loginstyles.dividerLine} />
                    <Text style={loginstyles.dividerText}>hoặc</Text>
                    <View style={loginstyles.dividerLine} />
                </View>

                {/* Nút Google — chỉ hiện khi chọn patient hoặc chưa chọn */}
                {(!role || role.key === 'patient') && (
                    <Button
                        mode="outlined"
                        onPress={handleGoogleLogin}
                        disabled={loading || googleLoading}
                        loading={googleLoading}
                        icon="google"
                        style={loginstyles.googleBtn}
                        labelStyle={loginstyles.googleBtnLabel}
                    >
                        Đăng nhập với Google
                    </Button>
                )}

                {/* Đăng ký */}
                <View style={loginstyles.registerRow}>
                    <Text style={loginstyles.registerText}>
                        Chưa có tài khoản?
                    </Text>
                    <TouchableOpacity onPress={() => nav.navigate('Register')}>
                        <Text style={loginstyles.registerLink}>
                            Đăng ký ngay
                        </Text>
                    </TouchableOpacity>
                </View>

            </View>
        </ScrollView>
    );
};

export default Login;