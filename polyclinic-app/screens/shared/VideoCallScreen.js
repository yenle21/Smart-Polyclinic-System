import React, { useEffect } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { Linking } from 'react-native';
import { db } from '../../configs/firebase';
import { ref, update } from 'firebase/database';
import { authApis } from '../../configs/Apis';

const VideoCallScreen = ({ route, navigation }) => {
    const { callId } = route.params;

    // Dùng 8x8.vc — Jitsi server không cần moderator, hoàn toàn miễn phí
    const roomUrl = `https://meet.ffmuc.net/polyclinic-${callId}`;

    console.log('=== ROOM URL:', roomUrl);
    console.log('=== CALL ID:', callId);

    useEffect(() => {
        // Tự động mở trình duyệt
        Linking.openURL(roomUrl).catch(() => {
            Alert.alert('Lỗi', 'Không thể mở trình duyệt!');
        });
    }, []);

    const endCall = async () => {
        try {
            await update(ref(db, `calls/${callId}`), { status: 'ended' });
            
        } catch (e) {
            if (e.response?.status !== 403) {
                console.error('endCall error:', e);
        }
        }

        if (navigation.canGoBack()) {
            navigation.goBack();
        } else {
            navigation.navigate('DoctorHome');
        }
    };

    // const endCall = async () => {
    //     try {
    //         await update(ref(db, `calls/${callId}`), { status: 'ended' });
    //     } catch (e) {
    //         console.error('endCall error:', e);
    //     }

    //     // Luôn chuyển sang kê đơn sau khi kết thúc call
    //     navigation.replace('PrescriptionForm', { appointmentId: callId });
    // };

    return (
        <View style={styles.container}>
            <Text style={styles.icon}>📞</Text>
            <Text style={styles.title}>Đang khám online</Text>
            <Text style={styles.subtitle}>
                Cuộc gọi đang diễn ra trên trình duyệt.{'\n'}
                Quay lại đây để kết thúc cuộc gọi.
            </Text>
            <Button
                mode="outlined"
                icon="open-in-new"
                style={styles.reopenBtn}
                onPress={() => Linking.openURL(roomUrl)}
            >
                Mở lại cuộc gọi
            </Button>
            <Button
                mode="contained"
                icon="phone-hangup"
                buttonColor="#EF4444"
                style={styles.endBtn}
                onPress={endCall}
            >
                Kết thúc cuộc gọi
            </Button>
        </View>
    );
};

export default VideoCallScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#1a1a2e',
        padding: 24,
    },
    icon: {
        fontSize: 64,
        marginBottom: 24,
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 12,
    },
    subtitle: {
        fontSize: 15,
        color: '#aaa',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 40,
    },
    reopenBtn: {
        borderColor: '#fff',
        borderRadius: 30,
        marginBottom: 16,
        width: 220,
    },
    endBtn: {
        borderRadius: 30,
        width: 220,
    },
});