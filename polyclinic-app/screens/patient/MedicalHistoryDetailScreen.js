import React, { useEffect, useState } from 'react';

import {
    View,
    ScrollView,
    StyleSheet,
    Alert,
    Linking,
} from 'react-native';

import {
    Text,
    Card,
    ActivityIndicator,
    Divider,
    Chip,
    Button,
} from 'react-native-paper';

import { authApis, endpoints } from '../../configs/Apis';

const MedicalHistoryDetailScreen = ({ route }) => {

    const { recordId } = route.params;

    // =========================
    // STATES
    // =========================
    const [record, setRecord] = useState(null);

    const [loading, setLoading] = useState(false);

    // =========================
    // LOAD DETAIL
    // =========================
    const loadDetail = async () => {

        try {

            setLoading(true);

            const api = await authApis();

          const res = await api.get(
                endpoints['medical-detail'](recordId)
            );
            setRecord(res.data);

        } catch (ex) {

            console.log(
                'LOAD MEDICAL DETAIL ERROR:',
                ex.response?.data
            );

            Alert.alert(
                'Lỗi',
                'Không thể tải chi tiết bệnh án!'
            );

        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDetail();
    }, []);

    // =========================
    // FORMAT DATE
    // =========================
    const formatDate = (dateStr) => {

        if (!dateStr)
            return '---';

        const [y, m, d] = dateStr.split('-');

        return `${d}/${m}/${y}`;
    };

    // =========================
    // LOADING
    // =========================
    if (loading || !record) {

        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    // =========================
    // UI
    // =========================
    return (
        <ScrollView style={styles.container}>

            {/* HEADER */}
            <Card style={styles.card}>

                <Card.Content>

                    <Text
                        variant="titleLarge"
                        style={styles.title}
                    >
                        🩺 Hồ sơ bệnh án
                    </Text>

                    <View style={styles.row}>
                        <Text style={styles.label}>
                            Bác sĩ:
                        </Text>

                        <Text style={styles.value}>
                            {record.doctor_name || '---'}
                        </Text>
                    </View>

                    <View style={styles.row}>
                        <Text style={styles.label}>
                            Chuyên khoa:
                        </Text>

                        <Text style={styles.value}>
                            {record.specialty || '---'}
                        </Text>
                    </View>

                    <View style={styles.row}>
                        <Text style={styles.label}>
                            Ngày khám:
                        </Text>

                        <Chip icon="calendar">
                            {
                                formatDate(
                                    record.work_date
                                )
                            }   
                        </Chip>
                    </View>

                </Card.Content>

            </Card>

            {/* DIAGNOSIS */}
            <Card style={styles.card}>

                <Card.Content>

                    <Text style={styles.sectionTitle}>
                        📋 Chẩn đoán
                    </Text>

                    <Divider style={styles.divider} />

                    <Text style={styles.content}>
                        {record.diagnosis || '---'}
                    </Text>

                </Card.Content>

            </Card>

            {/* TREATMENT */}
            <Card style={styles.card}>

                <Card.Content>

                    <Text style={styles.sectionTitle}>
                        💊 Hướng điều trị
                    </Text>

                    <Divider style={styles.divider} />

                    <Text style={styles.content}>
                        {record.treatment || '---'}
                    </Text>

                </Card.Content>

            </Card>

            {/* NOTES */}
            <Card style={styles.card}>

                <Card.Content>

                    <Text style={styles.sectionTitle}>
                        📝 Ghi chú bác sĩ
                    </Text>

                    <Divider style={styles.divider} />

                    <Text style={styles.content}>
                        {record.notes || '---'}
                    </Text>

                </Card.Content>

            </Card>

            {/* FOLLOW UP */}
            {
                record.follow_up && (

                    <Card style={styles.card}>

                        <Card.Content>

                            <Text style={styles.sectionTitle}>
                                📅 Ngày tái khám
                            </Text>

                            <Divider style={styles.divider} />

                            <Text style={styles.content}>
                                {
                                    formatDate(
                                        record.follow_up
                                    )
                                }
                            </Text>

                        </Card.Content>

                    </Card>
                )
            }

            {/* TEST RESULTS */}
            {
                record.test_results?.length > 0 && (

                    <Card style={styles.card}>

                        <Card.Content>

                            <Text style={styles.sectionTitle}>
                                🧪 Kết quả xét nghiệm
                            </Text>

                            <Divider style={styles.divider} />

                            {
                                record.test_results.map(test => (

                                    <View
                                        key={test.id}
                                        style={styles.testItem}
                                    >

                                        <Text style={styles.testName}>
                                            {test.name}
                                        </Text>

                                        <Text style={styles.content}>
                                            {test.result || '---'}
                                        </Text>

                                        {
                                            test.file && (
                                                <Button
                                                    mode="outlined"
                                                    icon="file"
                                                    style={{
                                                        marginTop: 10
                                                    }}
                                                    onPress={() =>
                                                        Linking.openURL(
                                                            test.file
                                                        )
                                                    }
                                                >
                                                    Xem file kết quả
                                                </Button>
                                            )
                                        }

                                    </View>
                                ))
                            }

                        </Card.Content>

                    </Card>
                )
            }

        </ScrollView>
    );
};

export default MedicalHistoryDetailScreen;

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

    card: {
        marginBottom: 16,
        borderRadius: 14,
    },

    title: {
        fontWeight: '700',
        marginBottom: 20,
    },

    row: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },

    label: {
        width: 100,
        fontWeight: '700',
        color: '#333',
    },

    value: {
        flex: 1,
        color: '#555',
    },

    sectionTitle: {
        fontWeight: '700',
        fontSize: 16,
    },

    divider: {
        marginVertical: 12,
    },

    content: {
        color: '#555',
        lineHeight: 22,
    },

    testItem: {
        marginBottom: 18,
    },

    testName: {
        fontWeight: '700',
        marginBottom: 8,
        color: '#222',
    },

});