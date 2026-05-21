import React, { useState } from "react";
import {
    View, Text, ScrollView, TouchableOpacity,
    Image, Alert,
} from "react-native";
import styles from "../../styles/registerstyles";
import { Button, HelperText, TextInput } from "react-native-paper";
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from "@react-navigation/native";

import Apis, { endpoints } from "../../configs/Apis";

const Register = () => {
    const nav = useNavigation();

    const [form, setForm] = useState({
        username:         '',
        email:            '',
        phone:            '',
        password:         '',
        password_confirm: '',
    });
    const [avatar, setAvatar]     = useState(null);   // { uri }
    const [showPass, setShowPass] = useState(false);
    const [showCfm,  setShowCfm]  = useState(false);
    const [err, setErr]           = useState(null);
    const [loading, setLoading]   = useState(false);

    // ── helpers ─────────────────────────────────────
    const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

    const pickAvatar = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Cần quyền truy cập', 'Vui lòng cho phép truy cập thư viện ảnh.');
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });
        if (!result.canceled) setAvatar(result.assets[0]);
    };

    const validate = () => {
        if (!form.username.trim())       return setErr('Vui lòng nhập tên đăng nhập'), false;
        if (!/^[a-zA-Z0-9]+$/.test(form.username)) return setErr('Username chỉ được chứa chữ và số!'), false;
        if (!form.email.trim())          return setErr('Vui lòng nhập email'), false;
        if (!/\S+@\S+\.\S+/.test(form.email)) return setErr('Email không hợp lệ'), false;
        if (!form.phone.trim())          return setErr('Vui lòng nhập số điện thoại'), false;
        if (!/^\d{10}$/.test(form.phone)) return setErr('Số điện thoại phải có 10 chữ số!'), false;
        if (!form.password)              return setErr('Vui lòng nhập mật khẩu'), false;
        if (form.password.length < 8)   return setErr('Mật khẩu phải ít nhất 8 ký tự!'), false;
        if (!/\d/.test(form.password))  return setErr('Mật khẩu phải có ít nhất 1 số!'), false;
        if (!/[A-Z]/.test(form.password)) return setErr('Mật khẩu phải có ít nhất 1 chữ hoa!'), false;
        if (form.password !== form.password_confirm) return setErr('Mật khẩu xác nhận không khớp!'), false;
        setErr(null);
        return true;
    };

    const register = async () => {
        if (!validate()) return;
        try {
            setLoading(true);

            // Dùng FormData để gửi kèm ảnh
            const data = new FormData();
            data.append('username',         form.username.trim());
            data.append('email',            form.email.trim());
            data.append('phone',            form.phone.trim());
            data.append('password',         form.password);
            data.append('password_confirm', form.password_confirm);

            if (avatar) {
                const filename  = avatar.uri.split('/').pop();
                const ext = filename.split('.').pop().toLowerCase();
                const mimeType = ext === 'jpg' ? 'jpeg' : ext;
                data.append('avatar', {
                    uri:  avatar.uri,
                    name: filename,
                    type: `image/${mimeType}`,
                });
            }

           await Apis.post(endpoints['register'], data, {
                headers: { 'Content-Type': undefined },
            });

            Alert.alert(
                '🎉 Đăng ký thành công!',
                'Tài khoản của bạn đã được tạo. Vui lòng đăng nhập.',
                [{ text: 'Đăng nhập ngay', onPress: () => nav.navigate('Login') }]
            );

        } catch (ex) {
            console.error(ex?.response?.data || ex);
            const data = ex?.response?.data;
            const msg  = data?.username?.[0]
                      || data?.email?.[0]
                      || data?.phone?.[0]
                      || data?.password?.[0]
                      || data?.password_confirm?.[0]
                      || data?.non_field_errors?.[0]
                      || 'Đăng ký thất bại. Vui lòng thử lại!';
            setErr(msg);
            console.error('DATA:', JSON.stringify(ex?.response?.data));
        } finally {
            setLoading(false);
        }
    };

    // ── render ──────────────────────────────────────
    return (
        <ScrollView
            contentContainerStyle={styles.container}
            keyboardShouldPersistTaps="handled"
        >
            <View style={styles.card}>

                {/* Tiêu đề */}
                <Text style={styles.cardTitle}>📋 Tạo tài khoản</Text>
                <Text style={styles.cardSub}>Điền thông tin để đăng ký</Text>

                {/* Avatar */}
                <TouchableOpacity style={styles.avatarWrap} onPress={pickAvatar}>
                    {avatar ? (
                        <Image source={{ uri: avatar.uri }} style={styles.avatarImg} />
                    ) : (
                        <View style={styles.avatarPlaceholder}>
                            <Text style={styles.avatarIcon}>📷</Text>
                            <Text style={styles.avatarText}>Chọn ảnh</Text>
                        </View>
                    )}
                    <View style={styles.avatarBadge}>
                        <Text style={styles.avatarBadgeText}>✏️</Text>
                    </View>
                </TouchableOpacity>

                {/* Username */}
                <TextInput
                    label="Tên đăng nhập"
                    value={form.username}
                    onChangeText={t => update('username', t)}
                    style={styles.input}
                    autoCapitalize="none"
                    right={<TextInput.Icon icon="account" />}
                />

                {/* Email */}
                <TextInput
                    label="Email"
                    value={form.email}
                    onChangeText={t => update('email', t)}
                    style={styles.input}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    right={<TextInput.Icon icon="email" />}
                />

                {/* Số điện thoại */}
                <TextInput
                    label="Số điện thoại"
                    value={form.phone}
                    onChangeText={t => update('phone', t)}
                    style={styles.input}
                    keyboardType="phone-pad"
                    right={<TextInput.Icon icon="phone" />}
                />

                {/* Password */}
                <TextInput
                    label="Mật khẩu"
                    value={form.password}
                    onChangeText={t => update('password', t)}
                    style={styles.input}
                    secureTextEntry={!showPass}
                    right={
                        <TextInput.Icon
                            icon={showPass ? 'eye-off' : 'eye'}
                            onPress={() => setShowPass(!showPass)}
                        />
                    }
                />

                {/* Confirm Password */}
                <TextInput
                    label="Xác nhận mật khẩu"
                    value={form.password_confirm}
                    onChangeText={t => update('password_confirm', t)}
                    style={styles.input}
                    secureTextEntry={!showCfm}
                    right={
                        <TextInput.Icon
                            icon={showCfm ? 'eye-off' : 'eye'}
                            onPress={() => setShowCfm(!showCfm)}
                        />
                    }
                />

                {/* Lỗi */}
                <HelperText type="error" visible={!!err}>
                    {err}
                </HelperText>

                {/* Nút đăng ký */}
                <Button
                    loading={loading}
                    disabled={loading}
                    mode="contained"
                    onPress={register}
                    style={styles.registerBtn}
                    labelStyle={styles.registerBtnLabel}
                >
                    Đăng ký
                </Button>

                {/* Link quay lại login */}
                <View style={styles.loginRow}>
                    <Text style={styles.loginText}>Đã có tài khoản? </Text>
                    <TouchableOpacity onPress={() => nav.navigate('Login')}>
                        <Text style={styles.loginLink}>Đăng nhập</Text>
                    </TouchableOpacity>
                </View>

            </View>
        </ScrollView>
    );
};

export default Register;