import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const PaymentResultScreen = ({ route, navigation }) => {
    const { status, invoice_id, order_id, code } = route.params || {};

    const isSuccess = status === 'success';

    return (
        <View style={styles.container}>
            <MaterialCommunityIcons
                name={isSuccess ? 'check-circle' : 'close-circle'}
                size={80}
                color={isSuccess ? '#4CAF50' : '#F44336'}
            />

            <Text style={[styles.title, { color: isSuccess ? '#4CAF50' : '#F44336' }]}>
                {isSuccess ? 'Thanh toán thành công!' : 'Thanh toán thất bại'}
            </Text>

            {isSuccess && invoice_id && (
                <Text style={styles.info}>Mã hóa đơn: #{invoice_id}</Text>
            )}

            {!isSuccess && code && (
                <Text style={styles.info}>Mã lỗi: {code}</Text>
            )}

            <Button
                mode="contained"
                style={styles.button}
                onPress={() => navigation.navigate('MainTabs', { screen: 'Invoices' })}
            >
                Xem hóa đơn
            </Button>

            <Button
                mode="outlined"
                style={styles.button}
                onPress={() => navigation.navigate('MainTabs')}
            >
                Về trang chủ
            </Button>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
        gap: 16,
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    info: {
        fontSize: 16,
        color: '#555',
    },
    button: {
        width: '100%',
        borderRadius: 8,
    },
});

export default PaymentResultScreen;