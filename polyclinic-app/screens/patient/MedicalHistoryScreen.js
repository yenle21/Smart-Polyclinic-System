import React, { useEffect, useState } from 'react';

import {
    View,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    Alert,
} from 'react-native';

import {
    Text,
    Card,
    ActivityIndicator,
    Chip,
} from 'react-native-paper';

import { useNavigation } from '@react-navigation/native';

import { authApis, endpoints } from '../../configs/Apis';

const MedicalHistoryScreen = () => {

    const navigation = useNavigation();

    // =========================
    // STATES
    // =========================
    const [records, setRecords] = useState([]);

    const [loading, setLoading] = useState(false);

    // =========================
    // LOAD MEDICAL RECORDS
    // =========================
    const loadMedicalRecords = async () => {

        try {

            setLoading(true);

            const api = await authApis();

            const res = await api.get(
                endpoints['medical-records']
            );

            setRecords(res.data);

        } catch (ex) {

            console.log(
                'LOAD MEDICAL RECORDS ERROR:',
                ex.response?.data
            );

            Alert.alert(
                'Lỗi',
                'Không thể tải lịch sử khám bệnh!'
            );

        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadMedicalRecords();
    }, []);

    // =========================
    // FORMAT DATE
    // =========================
    const formatDate = (dateStr) => {

        if (!dateStr)
            return '';

        const [y, m, d] = dateStr.split('-');

        return `${d}/${m}/${y}`;
    };

    // =========================
    // LOADING
    // =========================
    if (loading) {

        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    // =========================
    // EMPTY
    // =========================
    if (records.length === 0) {

        return (
            <View style={styles.emptyContainer}>
                <Text variant="titleMedium">
                    Chưa có lịch sử khám bệnh
                </Text>
            </View>
        );
    }

    // =========================
    // UI
    // =========================
    return (
        <ScrollView style={styles.container}>

            {
                records.map(record => (

                    <TouchableOpacity
                        key={record.id}
                        activeOpacity={0.8}
                        onPress={() =>
                            navigation.navigate(
                                'MedicalHistoryDetail',
                                { recordId: record.id }
                            )
                        }
                    >

                        <Card style={styles.card}>

                            <Card.Content>

                                {/* HEADER */}
                                <View style={styles.headerRow}>

                                    <Text
                                        variant="titleMedium"
                                        style={styles.doctor}
                                    >
                                        👨‍⚕️ {record.doctor_name}
                                    </Text>

                                    <Chip icon="calendar">
                                        {
                                            formatDate(
                                                record.appointment_date
                                            )
                                        }
                                    </Chip>

                                </View>

                                {/* SPECIALTY */}
                                <Text style={styles.specialty}>
                                    🏥 {record.specialty}
                                </Text>

                                {/* DIAGNOSIS */}
                                <Text style={styles.label}>
                                    Chẩn đoán
                                </Text>

                                <Text style={styles.value}>
                                    {record.diagnosis || '---'}
                                </Text>

                                {/* TREATMENT */}
                                <Text style={styles.label}>
                                    Hướng điều trị
                                </Text>

                                <Text style={styles.value}>
                                    {record.treatment || '---'}
                                </Text>

                                {/* FOLLOW UP */}
                                {
                                    record.follow_up && (
                                        <>
                                            <Text style={styles.label}>
                                                Ngày tái khám
                                            </Text>

                                            <Text style={styles.value}>
                                                📅 {
                                                    formatDate(
                                                        record.follow_up
                                                    )
                                                }
                                            </Text>
                                        </>
                                    )
                                }

                                {/* DETAIL BUTTON */}
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailText}>
                                        Xem chi tiết →
                                    </Text>
                                </View>

                            </Card.Content>

                        </Card>

                    </TouchableOpacity>
                ))
            }

        </ScrollView>
    );
};

export default MedicalHistoryScreen;

const styles = StyleSheet.create({

    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        padding: 16,
    },

    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },

    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },

    card: {
        marginBottom: 16,
        borderRadius: 14,
    },

    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },

    doctor: {
        fontWeight: '700',
        flex: 1,
        marginRight: 10,
    },

    specialty: {
        marginBottom: 12,
        color: '#666',
    },

    label: {
        marginTop: 10,
        marginBottom: 4,
        fontWeight: '700',
        color: '#333',
    },

    value: {
        color: '#555',
        lineHeight: 20,
    },

    detailRow: {
        marginTop: 16,
        alignItems: 'flex-end',
    },

    detailText: {
        color: '#2196F3',
        fontWeight: '700',
    },
});