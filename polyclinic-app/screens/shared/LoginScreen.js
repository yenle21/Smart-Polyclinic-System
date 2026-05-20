import React, { useContext, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import {
    Button,
    HelperText,
    TextInput,
    Menu,
    Divider
} from "react-native-paper";

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from "@react-navigation/native";

import Apis, { authApis, endpoints } from "../../configs/Apis";
import { MyUserContext } from "../../configs/Contexts";
import loginstyles from "../../styles/loginstyles";

const ROLES = [
    { key: 'doctor', label: '🩺  Bác sĩ' },
    { key: 'staff', label: '💊  Nhân viên y tế' },
    { key: 'admin', label: '🛡️  Admin' },
    { key: 'patient', label: '🧑‍⚕️  Bệnh nhân' },
];

const Login = () => {

    const userInfo = [
        {
            field: 'username',
            title: 'Tên đăng nhập',
            icon: 'account',
            secureTextEntry: false
        },
        {
            field: 'password',
            title: 'Mật khẩu',
            icon: 'eye',
            secureTextEntry: true
        },
    ];

    const [user, setUser] = useState({});
    const [role, setRole] = useState(null);
    const [menuVisible, setMenu] = useState(false);
    const [err, setErr] = useState(null);
    const [loading, setLoading] = useState(false);

    // THÊM STATE HIỆN/ẨN PASSWORD
    const [showPassword, setShowPassword] = useState(false);

    const [, dispatch] = useContext(MyUserContext);

    const nav = useNavigation();

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

    const login = async () => {
        if (!validate())
            return;

        try {
            setLoading(true);
            setErr(null);

            const params = new URLSearchParams();

            params.append('username', user.username);
            params.append('password', user.password);
            params.append('client_id', 'Qo0xwsPc00Wama0YySwi81z1jfnjPbUxi6xYc5H1');
            params.append('client_secret', 'SIN6g29BplhvAY0IfUin8OVGnOzAuvbfy9WXbO8FWIitHgzlRYYDYtixGFOQXbpil0DwAOhx5PdVfGjbOOlZaZo2GzVW6WzqsR4kXa927OTC3qxqUtmFRjqauSvebbfS');
            params.append('grant_type', 'password');

            let res = await Apis.post(
                endpoints['login'],
                params,
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                }
            );

            await AsyncStorage.setItem(
                'access_token',
                res.data.access_token
            );

            const authenticatedApi = await authApis();

            let u = await authenticatedApi.get(
                endpoints['current-user']
            );

            dispatch({
                type: 'LOGIN',
                payload: {
                    ...u.data,
                    role: role.key
                }
            });

        } catch (ex) {

            console.error("--- LỖI ĐĂNG NHẬP CHI TIẾT ---");

            if (ex.response && ex.response.data) {

                console.log(
                    "Nội dung lỗi từ Django trả về:",
                    ex.response.data
                );

                if (ex.response.data.error === 'invalid_grant') {
                    setErr('Tài khoản hoặc mật khẩu không chính xác!');
                }

                else if (ex.response.data.error === 'invalid_client') {
                    setErr('Lỗi cấu hình bảo mật hệ thống!');
                }

                else {
                    setErr(
                        `Đăng nhập thất bại: ${ex.response.data.error_description || ex.response.data.error}`
                    );
                }

            } else {

                console.log(
                    "Lỗi không có response:",
                    ex.message
                );

                setErr(
                    'Không thể kết nối đến máy chủ!'
                );
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

                {/* Tiêu đề */}
                <Text style={loginstyles.cardTitle}>
                    🏥 Smart Polyclinic
                </Text>

                <Text style={loginstyles.cardSub}>
                    Chọn vai trò và đăng nhập
                </Text>

                {/* Dropdown Role */}
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
                                role && loginstyles.dropdownLabelSelected,
                            ]}
                            icon="chevron-down"
                        >
                            {role
                                ? role.label
                                : 'Chọn vai trò...'}
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
                                    role?.key === r.key &&
                                    loginstyles.menuItemTitleActive,
                                ]}
                                style={[
                                    loginstyles.menuItem,
                                    role?.key === r.key &&
                                    loginstyles.menuItemActive,
                                ]}
                                onPress={() => {
                                    setRole(r);
                                    setMenu(false);
                                    setErr(null);
                                }}
                            />

                            {index < ROLES.length - 1 &&
                                <Divider />
                            }

                        </React.Fragment>
                    ))}

                </Menu>

                {/* Input */}
                {userInfo.map(u => (
                    <TextInput
                        key={u.field}
                        value={user[u.field]}
                        onChangeText={(t) =>
                            setUser({
                                ...user,
                                [u.field]: t
                            })
                        }

                        style={loginstyles.input}

                        label={u.title}

                        placeholder={u.title}

                        // PASSWORD TOGGLE
                        secureTextEntry={
                            u.field === 'password'
                                ? !showPassword
                                : false
                        }

                        right={
                            u.field === 'password' ? (
                                <TextInput.Icon
                                    icon={
                                        showPassword
                                            ? "eye-off"
                                            : "eye"
                                    }

                                    onPress={() =>
                                        setShowPassword(!showPassword)
                                    }
                                />
                            ) : (
                                <TextInput.Icon
                                    icon={u.icon}
                                />
                            )
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

                {/* Button */}
                <Button
                    loading={loading}
                    disabled={loading}
                    mode="contained"
                    onPress={login}
                    style={loginstyles.loginBtn}
                    labelStyle={loginstyles.loginBtnLabel}
                >
                    Đăng nhập
                </Button>

                {/* Register */}
                <View style={loginstyles.registerRow}>

                    <Text style={loginstyles.registerText}>
                        Chưa có tài khoản?
                    </Text>

                    <TouchableOpacity
                        onPress={() =>
                            nav.navigate('Register')
                        }
                    >
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