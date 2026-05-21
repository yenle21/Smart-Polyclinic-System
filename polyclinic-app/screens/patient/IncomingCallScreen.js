import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Vibration, Alert } from 'react-native';
import { Button } from 'react-native-paper';
import { db } from '../../configs/firebase';
import { ref, update } from 'firebase/database';

const VIBRATE_PATTERN = [500, 500, 500, 500, 500]; // reo chuông

const IncomingCallScreen = ({ route, navigation }) => {
    const { callId, doctorName, attempt } = route.params;
    const callRef = ref(db, `calls/${callId}`);
    const vibrationRef = useRef(null);

    useEffect(() => {
        // Rung chuông liên tục
        Vibration.vibrate(VIBRATE_PATTERN, true);

        return () => {
            Vibration.cancel();
        };
    }, []);

    const accept = async () => {
        Vibration.cancel();
        await update(callRef, { status: 'accepted' });
        navigation.replace('VideoCall', { callId }); // ✅ thay Alert cũ
    };

    const reject = async () => {
        Vibration.cancel();
        await update(callRef, { status: 'rejected' });
        navigation.goBack();
    };

    return (
        <View style={styles.container}>

            {/* ICON */}
            <View style={styles.iconWrap}>
                <Text style={styles.icon}>📞</Text>
            </View>

            {/* INFO */}
            <Text style={styles.title}>Cuộc gọi đến</Text>
            <Text style={styles.doctorName}>{doctorName}</Text>
            <Text style={styles.attempt}>Lần gọi {attempt}/2</Text>

            {/* BUTTONS */}
            <View style={styles.btnRow}>
                <Button
                    mode="contained"
                    icon="phone-hangup"
                    buttonColor="#EF4444"
                    style={styles.btn}
                    labelStyle={styles.btnLabel}
                    onPress={reject}
                >
                    Từ chối
                </Button>

                <Button
                    mode="contained"
                    icon="phone"
                    buttonColor="#22C55E"
                    style={styles.btn}
                    labelStyle={styles.btnLabel}
                    onPress={accept}
                >
                    Bắt máy
                </Button>
            </View>

        </View>
    );
};

export default IncomingCallScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1a1a2e',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    iconWrap: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#22C55E22',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 32,
    },
    icon: {
        fontSize: 56,
    },
    title: {
        fontSize: 18,
        color: '#aaa',
        marginBottom: 8,
    },
    doctorName: {
        fontSize: 28,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 8,
        textAlign: 'center',
    },
    attempt: {
        fontSize: 14,
        color: '#F59E0B',
        marginBottom: 60,
    },
    btnRow: {
        flexDirection: 'row',
        gap: 24,
    },
    btn: {
        borderRadius: 50,
        width: 130,
    },
    btnLabel: {
        fontSize: 14,
        fontWeight: '700',
    },
});