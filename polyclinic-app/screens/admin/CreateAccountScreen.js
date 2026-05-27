import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Alert, TouchableOpacity, Image } from 'react-native';
import { Text, Card, TextInput, Button } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { uploadApis, endpoints } from '../../configs/Apis';
import COLORS from '../../styles/colors';

const ROLES = [
    { value: 'doctor',   label: '👨‍⚕️ Bác sĩ' },
    { value: 'staff',    label: '👤 Nhân viên' },
    { value: 'pharmacy', label: '💊 Dược sĩ' },
];



export default function CreateAccountScreen() {
    const [role,            setRole]            = useState('doctor');
    const [loading,         setLoading]         = useState(false);
    const [specialties,     setSpecialties]     = useState([]);
    const [selectedSpecs,   setSelectedSpecs]   = useState([]);
    const [avatar,          setAvatar]          = useState(null);  // ← thêm

    const [username,        setUsername]        = useState('');
    const [password,        setPassword]        = useState('');
    const [passwordConfirm, setPasswordConfirm] = useState('');
    const [firstName,       setFirstName]       = useState('');
    const [lastName,        setLastName]        = useState('');
    const [email,           setEmail]           = useState('');
    const [phone,           setPhone]           = useState('');

    const [degree,  setDegree]  = useState('');
    const [bio,     setBio]     = useState('');
    const [fee,     setFee]     = useState('');

    useEffect(() => {
        const fetchSpecialties = async () => {
            try {
                const api = await uploadApis();
                const res = await api.get(endpoints['specialties']);
                setSpecialties(res.data.results || res.data);
            } catch (err) { console.error(err); }
        };
        fetchSpecialties();
    }, []);

    const resetForm = () => {
        setUsername(''); setPassword(''); setPasswordConfirm('');
        setFirstName(''); setLastName(''); setEmail(''); setPhone('');
        setSelectedSpecs([]); setDegree(''); setBio(''); setFee('');
        setAvatar(null);  // ← reset avatar
    };
    const pickAvatar = async () => {
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

    const toggleSpecialty = (s) => {
        setSelectedSpecs(prev =>
            prev.find(x => x.id === s.id)
                ? prev.filter(x => x.id !== s.id)
                : [...prev, s]
        );
    };

    const handleSubmit = async () => {
        if (!username || !password || !passwordConfirm || !email) {
            Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin bắt buộc (*)');
            return;
        }
        if (password !== passwordConfirm) {
            Alert.alert('Lỗi', 'Mật khẩu xác nhận không khớp');
            return;
        }
        if (role === 'doctor' && selectedSpecs.length === 0) {
            Alert.alert('Lỗi', 'Vui lòng chọn ít nhất một chuyên khoa');
            return;
        }

        try {
            setLoading(true);
            const api = await uploadApis(); 

            const formData = new FormData();
            formData.append('username',         username);
            formData.append('password',         password);
            formData.append('password_confirm', passwordConfirm);
            formData.append('first_name',       firstName);
            formData.append('last_name',        lastName);
            formData.append('email',            email);
            formData.append('phone',            phone);
            formData.append('role',             role);

            // ← avatar
            if (avatar) {
                formData.append('avatar', {
                    uri:  avatar.uri,
                    type: avatar.type  || 'image/jpeg',
                    name: avatar.fileName || 'avatar.jpg',
                });
            }

            if (role === 'doctor') {
                selectedSpecs.forEach(s => formData.append('specialties', s.id));
                formData.append('degree',           degree);
                formData.append('bio',              bio);
                formData.append('consultation_fee', fee || 0);
            }

            const endpointMap = {
                doctor:   endpoints['create-doctor'],
                staff:    endpoints['create-staff'],
                pharmacy: endpoints['create-pharmacy'],
            };

            
            await api.post(endpointMap[role], formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                
            });

            const roleLabel = ROLES.find(r => r.value === role)?.label || role;
            Alert.alert('Thành công', `Đã tạo tài khoản ${roleLabel} thành công!`);
            resetForm();
        } catch (err) {
            const errors = err.response?.data;
            const msg = typeof errors === 'object'
                ? Object.values(errors).flat().join('\n')
                : 'Có lỗi xảy ra';
            Alert.alert('Lỗi', msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView style={styles.container}>

            {/* Chọn role */}
            <Card style={styles.card}>
                <Card.Content>
                    <Text variant="titleMedium" style={styles.sectionTitle}>Loại tài khoản</Text>
                    <View style={styles.roleRow}>
                        {ROLES.map(r => (
                            <TouchableOpacity key={r.value}
                                onPress={() => { setRole(r.value); resetForm(); }}
                                style={[styles.roleBtn, role === r.value && styles.roleBtnActive]}>
                                <Text style={[styles.roleBtnText, role === r.value && styles.roleBtnTextActive]}>
                                    {r.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </Card.Content>
            </Card>

            {/* Thông tin tài khoản */}
            <Card style={styles.card}>
                <Card.Content>
                    <Text variant="titleMedium" style={styles.sectionTitle}>🔐 Thông tin tài khoản</Text>

                    {/* Avatar picker */}
                    <TouchableOpacity onPress={pickAvatar} style={styles.avatarWrapper}>
                        {avatar
                            ? <Image source={{ uri: avatar.uri }} style={styles.avatarImg} />
                            : <View style={styles.avatarPlaceholder}>
                                <Text style={styles.avatarIcon}>📷</Text>
                                <Text style={styles.avatarHint}>Chọn ảnh đại diện</Text>
                              </View>
                        }
                    </TouchableOpacity>

                    <View style={styles.row}>
                        <TextInput label="Họ" mode="outlined" value={lastName}
                                   onChangeText={setLastName} style={[styles.input, { flex: 1 }]} />
                        <TextInput label="Tên" mode="outlined" value={firstName}
                                   onChangeText={setFirstName} style={[styles.input, { flex: 1 }]} />
                    </View>
                    <TextInput label="Tên đăng nhập *" mode="outlined" value={username}
                               onChangeText={setUsername} style={styles.input} autoCapitalize="none" />
                    <TextInput label="Email *" mode="outlined" value={email}
                               onChangeText={setEmail} style={styles.input}
                               keyboardType="email-address" autoCapitalize="none" />
                    <TextInput label="Số điện thoại" mode="outlined" value={phone}
                               onChangeText={setPhone} style={styles.input} keyboardType="phone-pad" />
                    <TextInput label="Mật khẩu *" mode="outlined" value={password}
                               onChangeText={setPassword} style={styles.input} secureTextEntry />
                    <TextInput label="Xác nhận mật khẩu *" mode="outlined" value={passwordConfirm}
                               onChangeText={setPasswordConfirm} style={styles.input} secureTextEntry />
                </Card.Content>
            </Card>

            {/* Doctor fields */}
            {role === 'doctor' && (
                <Card style={styles.card}>
                    <Card.Content>
                        <Text variant="titleMedium" style={styles.sectionTitle}>🩺 Thông tin bác sĩ</Text>

                        <Text style={styles.fieldLabel}>Chuyên khoa * (chọn một hoặc nhiều)</Text>
                        <View style={styles.specGrid}>
                            {specialties.map(s => {
                                const selected = !!selectedSpecs.find(x => x.id === s.id);
                                return (
                                    <TouchableOpacity key={s.id}
                                        onPress={() => toggleSpecialty(s)}
                                        style={[styles.specChip, selected && styles.specChipActive]}>
                                        <Text style={[styles.specChipText, selected && styles.specChipTextActive]}>
                                            {s.name}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

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
    container:           { flex: 1, backgroundColor: '#F5F6FA' },
    card:                { margin: 12, marginBottom: 0, borderRadius: 12 },
    sectionTitle:        { fontWeight: 'bold', marginBottom: 12, color: '#111' },
    row:                 { flexDirection: 'row', gap: 10 },
    input:               { marginBottom: 12, backgroundColor: '#fff' },
    fieldLabel:          { fontSize: 13, color: '#666', marginBottom: 8 },
    btn:                 { margin: 12, borderRadius: 8, paddingVertical: 4 },

    // Role selector
    roleRow:             { flexDirection: 'row', gap: 8 },
    roleBtn:             { flex: 1, paddingVertical: 10, borderRadius: 8, borderWidth: 1,
                           borderColor: '#D1D5DB', alignItems: 'center', backgroundColor: '#fff' },
    roleBtnActive:       { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
    roleBtnText:         { fontSize: 13, color: '#555' },
    roleBtnTextActive:   { color: '#fff', fontWeight: 'bold' },

    // Avatar
    avatarWrapper:       { alignSelf: 'center', marginBottom: 16 },
    avatarImg:           { width: 90, height: 90, borderRadius: 45 },
    avatarPlaceholder:   { width: 90, height: 90, borderRadius: 45, backgroundColor: '#F3F4F6',
                           borderWidth: 1, borderColor: '#D1D5DB', borderStyle: 'dashed',
                           alignItems: 'center', justifyContent: 'center' },
    avatarIcon:          { fontSize: 24 },
    avatarHint:          { fontSize: 10, color: '#9CA3AF', marginTop: 2, textAlign: 'center' },

    // Specialty chips
    specGrid:            { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
    specChip:            { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
                           borderWidth: 1, borderColor: '#D1D5DB', backgroundColor: '#fff' },
    specChipActive:      { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
    specChipText:        { fontSize: 13, color: '#555' },
    specChipTextActive:  { color: '#fff', fontWeight: '600' },
});