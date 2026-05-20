import React, { useContext } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Avatar, Button, Card } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MyUserContext } from '../../configs/Contexts';
import COLORS from '../../styles/colors';
import { useNavigation } from '@react-navigation/native';

export default function ProfileScreen() {
    const [user, dispatch] = useContext(MyUserContext);
    const navigation = useNavigation();

    const handleLogout = async () => {
        await AsyncStorage.removeItem('token');
        dispatch({ type: 'LOGOUT' });
    };

    return (
        <View style={styles.container}>
            {/* HEADER */}
            <View style={styles.header}>
                <Avatar.Icon
                    size={60}
                    icon="account"
                    style={styles.avatar}
                />


                <Text style={styles.role}>
                    {user?.role || 'Patient'}
                </Text>
            </View>

            {/* INFO CARD */}
            <Card style={styles.card}>
                <Card.Content>

                    <Text style={styles.label}>
                        Tên đăng nhập
                    </Text>

                    <Text style={styles.value}>
                        {user?.username || '---'}
                    </Text>

                    <Text style={styles.label}>
                        Email
                    </Text>

                    <Text style={styles.value}>
                        {user?.email || '---'}
                    </Text>

                    <Text style={styles.label}>
                        Điện thoại
                    </Text>

                    <Text style={styles.value}>
                        {user?.phone || '---'}
                    </Text>

                </Card.Content>
            </Card>
            {user?.role === 'patient' && (
                <Button
                    mode="contained"
                    icon="account"
                    style={styles.button}
                    onPress={() =>
                        navigation.navigate('PersonalProfile')
                    }
                >
                    Hồ sơ cá nhân
                </Button>
            )}

            {/* MY APPOINTMENTS */}
            {user?.role === 'patient' && (
                <Button
                    mode="contained"
                    icon="calendar-clock"
                    style={styles.appointmentBtn}
                    onPress={() => {
                        navigation.navigate('MyAppointments');
                    }}
                >
                    Lịch hẹn của tôi
                </Button>
                
            )}
            {user?.role === 'patient' && (
                <Button
                    mode="contained"
                    icon="file-document-outline"
                    style={styles.appointmentBtn}
                    onPress={() =>
                        navigation.navigate('MedicalHistory')
                    }
                >
                    Lịch sử khám bệnh
                </Button>
            )}

            {/* LOGOUT */}
            <Button
                mode="outlined"
                style={styles.logoutBtn}
                textColor={COLORS.danger}
                onPress={handleLogout}
            >
                Đăng xuất
            </Button>

        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
        padding: 16,
    },

    header: {
        alignItems: 'center',
        marginBottom: 20,
        marginTop: 16,
    },

    avatar: {
        backgroundColor: COLORS.primary,
    },

    name: {
        fontWeight: 'bold',
        color: COLORS.text,
    },

    role: {
        color: COLORS.gray,
        marginTop: 4,
    },

    card: {
        borderRadius: 12,
        marginBottom: 10,
    },

    label: {
        color: COLORS.gray,
        fontSize: 12,
        marginTop: 12,
        marginBottom:7,
    },

    value: {
        color: COLORS.text,
        fontSize: 15,
        fontWeight: '500',
    },

    appointmentBtn: {
        marginTop: 12,
        borderRadius: 20,
    },

    logoutBtn: {
        marginTop: 12,
        borderColor: COLORS.danger,
        borderRadius: 20,
    },
});