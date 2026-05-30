import React, { useState } from "react";
import {
    View, Text, ScrollView, TouchableOpacity,
    Image, Alert, KeyboardAvoidingView, Platform,
} from "react-native";

import styles from "../../styles/registerstyles";
import { Button, HelperText, TextInput } from "react-native-paper";
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from "@react-navigation/native";

import Apis, { endpoints } from "../../configs/Apis";

const userInfo = [
    { field: 'first_name',       title: 'Họ',                 icon: 'account'        },
    { field: 'last_name',        title: 'Tên',                icon: 'account'        },
    { field: 'username',         title: 'Username',           icon: 'account-circle' },
    { field: 'email',            title: 'Email',              icon: 'email'          },
    { field: 'phone',            title: 'SĐT',                icon: 'phone'          },
    { field: 'password',         title: 'Mật khẩu',           icon: 'eye', secureTextEntry: true },
    { field: 'password_confirm', title: 'Xác nhận mật khẩu', icon: 'eye', secureTextEntry: true },
];

const Register = () => {
    const nav = useNavigation();

    const [user, setUser] = useState({});
    const [avatar, setAvatar] = useState(null);
    const [err, setErr] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showPass, setShowPass] = useState(false);
    const [showCfm, setShowCfm] = useState(false);

    const picker = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Cần quyền truy cập', 'Vui lòng cấp quyền ảnh');
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });
        if (!result.canceled) setAvatar(result.assets[0]);
    };

    const validate = () => {
        if (!user.first_name?.trim()) return setErr('Nhập họ'), false;
        if (!user.last_name?.trim()) return setErr('Nhập tên'), false;
        if (!user.username?.trim()) return setErr('Nhập username'), false;
        if (!/^[a-zA-Z0-9]+$/.test(user.username)) return setErr('Username chỉ chữ và số'), false;
        if (!user.email?.trim()) return setErr('Nhập email'), false;
        if (!/\S+@\S+\.\S+/.test(user.email)) return setErr('Email sai'), false;
        if (!user.phone?.trim()) return setErr('Nhập SĐT'), false;
        if (!/^\d{10}$/.test(user.phone)) return setErr('SĐT phải 10 số'), false;
        if (!user.password) return setErr('Nhập mật khẩu'), false;
        if (user.password.length < 8) return setErr('>= 8 ký tự'), false;
        if (!/[A-Z]/.test(user.password)) return setErr('Có chữ hoa'), false;
        if (!/\d/.test(user.password)) return setErr('Có số'), false;
        if (user.password !== user.password_confirm) return setErr('Mật khẩu không khớp'), false;
        setErr(null);
        return true;
    };

    const register = async () => {
        if (!validate()) return;
        try {
            setLoading(true);
            const form = new FormData();
            for (var key of Object.keys(user)) form.append(key, user[key]);
            if (avatar) {
                const filename = avatar.uri.split('/').pop();
                const ext = filename.split('.').pop();
                form.append('avatar_upload', {
                    uri: avatar.uri,
                    name: filename,
                    type: `image/${ext === 'png' ? 'png' : 'jpeg'}`,
                });
            }
            const res = await Apis.post(endpoints['register'], form, {
                headers: { 'Content-Type': 'multipart/form-data' },
                timeout: 90000,
            });
            if (res.status === 200 || res.status === 201) {
                Alert.alert("Thành công", "Đăng ký thành công", [
                    { text: "OK", onPress: () => nav.navigate("Login") }
                ]);
            }
        } catch (ex) {
            console.error(ex);
            const errData = ex?.response?.data;
            setErr(
                errData?.username?.[0] || errData?.email?.[0] || errData?.phone?.[0] ||
                errData?.first_name?.[0] || errData?.last_name?.[0] ||
                errData?.password?.[0] || errData?.password_confirm?.[0] ||
                errData?.detail || errData?.non_field_errors?.[0] || 'Đăng ký thất bại'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
       
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
        >
            <ScrollView
                contentContainerStyle={styles.container}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.card}>

                    <Text style={styles.cardTitle}>📋 Đăng ký</Text>

                    {/* AVATAR */}
                    <TouchableOpacity onPress={picker} style={styles.avatarWrap}>
                        {avatar ? (
                            <Image source={{ uri: avatar.uri }} style={styles.avatarImg} />
                        ) : (
                            <Text>📷 Chọn ảnh</Text>
                        )}
                    </TouchableOpacity>

                    {/* TEXTINPUT LIST */}
                    {userInfo.map(u => (
                        <TextInput
                            key={u.field}
                            label={u.title}
                            value={user[u.field] || ''}
                            onChangeText={t => setUser({ ...user, [u.field]: t })}
                            secureTextEntry={
                                u.field === 'password' ? !showPass :
                                u.field === 'password_confirm' ? !showCfm :
                                false
                            }
                            right={
                                u.field === 'password' ? (
                                    <TextInput.Icon
                                        icon={showPass ? "eye-off" : "eye"}
                                        onPress={() => setShowPass(!showPass)}
                                    />
                                ) : u.field === 'password_confirm' ? (
                                    <TextInput.Icon
                                        icon={showCfm ? "eye-off" : "eye"}
                                        onPress={() => setShowCfm(!showCfm)}
                                    />
                                ) : (
                                    <TextInput.Icon icon={u.icon} />
                                )
                            }
                            style={styles.input}
                        />
                    ))}

                    <HelperText type="error" visible={!!err}>
                        {err}
                    </HelperText>

                    <Button
                        loading={loading}
                        disabled={loading}
                        mode="contained"
                        onPress={register}
                    >
                        Đăng ký
                    </Button>

                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

export default Register;