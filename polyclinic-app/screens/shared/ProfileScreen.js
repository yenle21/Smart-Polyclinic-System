import React, { useContext } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Avatar, Button, Card } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MyUserContext } from '../../configs/Contexts';
import COLORS from '../../styles/colors';

export default function ProfileScreen() {
    const [user, dispatch] = useContext(MyUserContext);

    const handleLogout = async () => {
        await AsyncStorage.removeItem('token');
        dispatch({ type: 'LOGOUT' });
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Avatar.Icon size={80} icon="account" style={styles.avatar} />
                <Text variant="headlineSmall" style={styles.name}>
                    {user?.first_name} {user?.last_name}
                </Text>
                <Text style={styles.role}>{user?.role || 'Staff'}</Text>
            </View>

            <Card style={styles.card}>
                <Card.Content>
                    <Text style={styles.label}>Tên đăng nhập</Text>
                    <Text style={styles.value}>{user?.username || '---'}</Text>
                    <Text style={styles.label}>Email</Text>
                    <Text style={styles.value}>{user?.email || '---'}</Text>
                    <Text style={styles.label}>Điện thoại</Text>
                    <Text style={styles.value}>{user?.phone || '---'}</Text>
                </Card.Content>
            </Card>

            <Button mode="outlined" style={styles.logoutBtn}
                    textColor={COLORS.danger} onPress={handleLogout}>
                Đăng xuất
            </Button>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background, padding: 16 },
    header:    { alignItems: 'center', marginBottom: 24, marginTop: 16 },
    avatar:    { backgroundColor: COLORS.primary },
    name:      { fontWeight: 'bold', marginTop: 12, color: COLORS.text },
    role:      { color: COLORS.gray, marginTop: 4 },
    card:      { borderRadius: 12, marginBottom: 16 },
    label:     { color: COLORS.gray, fontSize: 12, marginTop: 12 },
    value:     { color: COLORS.text, fontSize: 15, fontWeight: '500' },
    logoutBtn: { borderColor: COLORS.danger, borderRadius: 8 },
});