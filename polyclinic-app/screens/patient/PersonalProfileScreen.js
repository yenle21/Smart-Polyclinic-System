import React, { useEffect, useState } from 'react';
import { View, ScrollView, Alert, StyleSheet } from 'react-native';
import { Text, TextInput, Button, Card, RadioButton, ActivityIndicator } from 'react-native-paper';
import { authApis, endpoints } from '../../configs/Apis';

const PersonalProfileScreen = () => {

    const [loading, setLoading]   = useState(false);
    const [noProfile, setNoProfile] = useState(false); // ✅
    const [fullName, setFullName] = useState('');
    const [phone, setPhone]       = useState('');
    const [dob, setDob]           = useState('');
    const [gender, setGender]     = useState('male');
    const [address, setAddress]   = useState('');

    const loadProfile = async () => {
        try {
            setLoading(true);
            const api = await authApis();
            const res = await api.get(endpoints['patient-profile']);
            const data = res.data;

            setFullName(data.full_name || '');
            setPhone(data.phone || '');
            setGender(data.gender || 'male');
            setAddress(data.address || '');

            if (data.dob) {
                const [y, m, d] = data.dob.split('-');
                setDob(`${d}/${m}/${y}`);
            }

        } catch (ex) {
            // ✅ Nếu 404 thì hiện banner, không Alert
            if (ex.response?.status === 404) {
                setNoProfile(true);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadProfile();
    }, []);

    const handleDobChange = (text) => {
        const digits = text.replace(/\D/g, '');
        let formatted = digits;
        if (digits.length >= 3 && digits.length <= 4) {
            formatted = `${digits.slice(0, 2)}/${digits.slice(2)}`;
        } else if (digits.length >= 5) {
            formatted = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
        }
        setDob(formatted);
    };

    const convertDobForApi = () => {
        if (!dob || dob.length < 10) return '';
        const [d, m, y] = dob.split('/');
        return `${y}-${m}-${d}`;
    };

    const validate = () => {
        if (!fullName.trim()) return 'Vui lòng nhập họ tên!';
        if (!phone.trim())    return 'Vui lòng nhập số điện thoại!';
        return null;
    };

    const updateProfile = async () => {
        if (loading) return;
        const error = validate();
        if (error) { Alert.alert('Thiếu thông tin', error); return; }

        try {
            setLoading(true);
            const api  = await authApis();
            const form = new FormData();
            form.append('full_name', fullName.trim());
            form.append('phone',     phone.trim());
            form.append('dob',       convertDobForApi());
            form.append('gender',    gender);
            form.append('address',   address.trim());

            await api.patch(endpoints['patient-profile'], form, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            setNoProfile(false); // ✅ ẩn banner sau khi cập nhật thành công
            Alert.alert('Thành công', 'Cập nhật hồ sơ thành công!');

        } catch (ex) {
            console.log('UPDATE PROFILE ERROR:', ex.response?.data);
            console.log('STATUS:', ex.response?.status);
            console.log('DATA:', JSON.stringify(ex.response?.data));
            console.log('URL:', ex.config?.url);
            Alert.alert('Lỗi', 'Cập nhật hồ sơ thất bại!');
        } finally {
            setLoading(false);
        }
    };

    if (loading && !fullName && !noProfile) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            <Card style={styles.card}>
                <Card.Content>

                    <Text variant="titleLarge" style={styles.title}>
                        👤 Hồ sơ cá nhân
                    </Text>
                    {noProfile && (
                        <View style={styles.noProfileBanner}>
                            <Text style={styles.noProfileText}>
                                ⚠️ Tài khoản này chưa có hồ sơ bệnh nhân.{'\n'}
                                Vui lòng cập nhật hồ sơ cá nhân!
                            </Text>
                        </View>
                    )}

                    <TextInput
                        label="Họ tên *"
                        value={fullName}
                        onChangeText={setFullName}
                        mode="outlined"
                        style={styles.input}
                    />

                    <TextInput
                        label="Số điện thoại *"
                        value={phone}
                        onChangeText={setPhone}
                        keyboardType="phone-pad"
                        mode="outlined"
                        style={styles.input}
                    />

                    <TextInput
                        label="Ngày sinh"
                        value={dob}
                        onChangeText={handleDobChange}
                        keyboardType="numeric"
                        placeholder="dd/mm/yyyy"
                        maxLength={10}
                        mode="outlined"
                        style={styles.input}
                    />

                    <TextInput
                        label="Địa chỉ"
                        value={address}
                        onChangeText={setAddress}
                        mode="outlined"
                        multiline
                        style={styles.input}
                    />

                    <Text style={styles.genderTitle}>Giới tính</Text>
                    <RadioButton.Group value={gender} onValueChange={setGender}>
                        <View style={styles.genderRow}>
                            <View style={styles.genderItem}>
                                <RadioButton value="male" />
                                <Text>Nam</Text>
                            </View>
                            <View style={styles.genderItem}>
                                <RadioButton value="female" />
                                <Text>Nữ</Text>
                            </View>
                        </View>
                    </RadioButton.Group>

                    <Button
                        mode="contained"
                        onPress={updateProfile}
                        loading={loading}
                        disabled={loading}
                        style={styles.button}
                    >
                        Cập nhật hồ sơ
                    </Button>

                </Card.Content>
            </Card>
        </ScrollView>
    );
};

export default PersonalProfileScreen;

const styles = StyleSheet.create({
    container:        { flex: 1, backgroundColor: '#f5f5f5', padding: 16 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    card:             { borderRadius: 14 },
    title:            { fontWeight: '700', marginBottom: 20 },
    input:            { marginBottom: 14 },
    genderTitle:      { fontWeight: '600', marginBottom: 8 },
    genderRow:        { flexDirection: 'row', marginBottom: 16 },
    genderItem:       { flexDirection: 'row', alignItems: 'center', marginRight: 24 },
    button:           { marginTop: 10, borderRadius: 8, paddingVertical: 4 },

    // ✅ Style banner
    noProfileBanner: {
        backgroundColor: '#fff3cd',
        borderLeftWidth: 4,
        borderLeftColor: '#f59e0b',
        borderRadius: 8,
        padding: 12,
        marginBottom: 16,
    },
    noProfileText: {
        color: '#92400e',
        fontSize: 14,
        lineHeight: 22,
    },
});