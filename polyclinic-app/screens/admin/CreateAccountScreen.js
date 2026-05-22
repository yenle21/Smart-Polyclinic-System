// screens/admin/CreateAccountScreen.js
import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { Text, Card, TextInput, Button, SegmentedButtons, Menu } from 'react-native-paper';
import { authApis, endpoints } from '../../configs/Apis';
import COLORS from '../../styles/colors';

export default function CreateAccountScreen() {
    const [role,            setRole]            = useState('doctor');
    const [loading,         setLoading]         = useState(false);
    const [specialties,     setSpecialties]     = useState([]);
    const [menuVisible,     setMenuVisible]     = useState(false);

    // Common fields
    const [username,        setUsername]        = useState('');
    const [password,        setPassword]        = useState('');
    const [passwordConfirm, setPasswordConfirm] = useState('');
    const [firstName,       setFirstName]       = useState('');
    const [lastName,        setLastName]        = useState('');
    const [email,           setEmail]           = useState('');
    const [phone,           setPhone]           = useState('');

    // Doctor fields
    const [specialty,       setSpecialty]       = useState(null);
    const [degree,          setDegree]          = useState('');
    const [bio,             setBio]             = useState('');
    const [fee,             setFee]             = useState('');

    useEffect(() => {
        const fetchSpecialties = async () => {
            try {
                const api = await authApis();
                const res = await api.get(endpoints['specialties']);
                setSpecialties(res.data.results || res.data);
            } catch (err) {
                console.error(err);
            }
        };
        fetchSpecialties();
    }, []);

    const resetForm = () => {
        setUsername(''); setPassword(''); setPasswordConfirm('');
        setFirstName(''); setLastName(''); setEmail(''); setPhone('');
        setSpecialty(null); setDegree(''); setBio(''); setFee('');
    };

    const handleSubmit = async () => {
        if (!username || !password || !passwordConfirm || !email) {
            Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin bắt buộc');
            return;
        }
        if (role === 'doctor' && !specialty) {
            Alert.alert('Lỗi', 'Vui lòng chọn chuyên khoa');
            return;
        }

        try {
            setLoading(true);
            const api = await authApis();

            // Dùng FormData thay JSON
            const formData = new FormData();
            formData.append('username',         username);
            formData.append('password',         password);
            formData.append('password_confirm', passwordConfirm);
            formData.append('first_name',       firstName);
            formData.append('last_name',        lastName);
            formData.append('email',            email);
            formData.append('phone',            phone);

            if (role === 'doctor') {
                formData.append('specialty',        specialty.id);
                formData.append('degree',           degree);
                formData.append('bio',              bio);
                formData.append('consultation_fee', fee || 0);
            }

            const endpoint = role === 'doctor'
                ? endpoints['create-doctor']
                : endpoints['create-staff'];

            await api.post(endpoint, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            Alert.alert('Thành công', `Đã tạo tài khoản ${role === 'doctor' ? 'bác sĩ' : 'nhân viên'} thành công!`);
            resetForm();
        } catch (err) {
            const errors = err.response?.data;
            const msg    = typeof errors === 'object'
                ? Object.values(errors).flat().join('\n')
                : 'Có lỗi xảy ra';
            Alert.alert('Lỗi', msg);
        } finally {
            setLoading(false);
        }
    };
    return (
        <ScrollView style={styles.container}>
            <Card style={styles.card}>
                <Card.Content>
                    <Text variant="titleMedium" style={styles.sectionTitle}>Loại tài khoản</Text>
                    <SegmentedButtons
                        value={role}
                        onValueChange={setRole}
                        buttons={[
                            { value: 'doctor', label: '👨‍⚕️ Bác sĩ' },
                            { value: 'staff',  label: '👤 Nhân viên' },
                        ]}
                        style={styles.segment}
                    />
                </Card.Content>
            </Card>

            {/* Thông tin tài khoản */}
            <Card style={styles.card}>
                <Card.Content>
                    <Text variant="titleMedium" style={styles.sectionTitle}>🔐 Thông tin tài khoản</Text>

                    <View style={styles.row}>
                        <TextInput label="Họ *" mode="outlined" value={lastName}
                                   onChangeText={setLastName} style={[styles.input, { flex: 1 }]} />
                        <TextInput label="Tên *" mode="outlined" value={firstName}
                                   onChangeText={setFirstName} style={[styles.input, { flex: 1 }]} />
                    </View>

                    <TextInput label="Tên đăng nhập *" mode="outlined" value={username}
                               onChangeText={setUsername} style={styles.input}
                               autoCapitalize="none" />
                    <TextInput label="Email *" mode="outlined" value={email}
                               onChangeText={setEmail} style={styles.input}
                               keyboardType="email-address" autoCapitalize="none" />
                    <TextInput label="Số điện thoại" mode="outlined" value={phone}
                               onChangeText={setPhone} style={styles.input}
                               keyboardType="phone-pad" />
                    <TextInput label="Mật khẩu *" mode="outlined" value={password}
                               onChangeText={setPassword} style={styles.input}
                               secureTextEntry />
                    <TextInput label="Xác nhận mật khẩu *" mode="outlined" value={passwordConfirm}
                               onChangeText={setPasswordConfirm} style={styles.input}
                               secureTextEntry />
                </Card.Content>
            </Card>

            {/* Doctor fields */}
            {role === 'doctor' && (
                <Card style={styles.card}>
                    <Card.Content>
                        <Text variant="titleMedium" style={styles.sectionTitle}>🩺 Thông tin bác sĩ</Text>

                        {/* Chọn chuyên khoa */}
                        <Text style={styles.fieldLabel}>Chuyên khoa *</Text>
                        <Menu visible={menuVisible}
                              onDismiss={() => setMenuVisible(false)}
                              anchor={
                                  <Button mode="outlined" onPress={() => setMenuVisible(true)}
                                          style={styles.menuBtn}>
                                      {specialty ? specialty.name : 'Chọn chuyên khoa'}
                                  </Button>
                              }>
                            {specialties.map(s => (
                                <Menu.Item key={s.id} title={s.name}
                                           onPress={() => { setSpecialty(s); setMenuVisible(false); }} />
                            ))}
                        </Menu>

                        <TextInput label="Học vị (VD: Tiến sĩ, Thạc sĩ)" mode="outlined"
                                   value={degree} onChangeText={setDegree} style={styles.input} />
                        <TextInput label="Phí khám (VNĐ)" mode="outlined"
                                   value={fee} onChangeText={setFee} style={styles.input}
                                   keyboardType="numeric" />
                        <TextInput label="Giới thiệu" mode="outlined" value={bio}
                                   onChangeText={setBio} style={styles.input}
                                   multiline numberOfLines={3} />
                    </Card.Content>
                </Card>
            )}

            <Button mode="contained" onPress={handleSubmit}
                    loading={loading} disabled={loading}
                    style={styles.btn} buttonColor={COLORS.primary}>
                Tạo tài khoản
            </Button>

            <View style={{ height: 32 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container:    { flex: 1, backgroundColor: '#F5F6FA' },
    card:         { margin: 12, marginBottom: 0, borderRadius: 12 },
    sectionTitle: { fontWeight: 'bold', marginBottom: 12, color: '#111' },
    segment:      { marginBottom: 4 },
    row:          { flexDirection: 'row', gap: 10 },
    input:        { marginBottom: 12, backgroundColor: '#fff' },
    fieldLabel:   { fontSize: 13, color: '#666', marginBottom: 6 },
    menuBtn:      { marginBottom: 12, borderRadius: 8 },
    btn:          { margin: 12, borderRadius: 8, paddingVertical: 4 },
});