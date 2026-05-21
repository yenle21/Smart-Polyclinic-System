import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Image,
} from 'react-native';

import {
    Card,
    Button,
    ActivityIndicator,
    Divider,
} from 'react-native-paper';

import {
    authApis,
    endpoints,
} from '../../configs/Apis';

const MedicalRecordDetailScreen = ({ route, navigation }) => {

    const params = route.params || {};

    const [record,      setRecord]      = useState(null);
    const [testResults, setTestResults] = useState([]);
    const [loading,     setLoading]     = useState(true);

    useEffect(() => {

        const fetchData = async () => {

            try {
                setLoading(true);

                const api = await authApis();

                let recordData = null;

                // FETCH THEO RECORD ID
                if (params.record?.id) {

                    const res = await api.get(
                        endpoints['medical-detail'](params.record.id)
                    );

                    recordData = res.data;
                }

                // FETCH THEO APPOINTMENT ID
                else if (params.appointmentId) {

                    const res = await api.get(
                        endpoints['medical-records'],
                        {
                            params: {
                                appointment_id: params.appointmentId,
                            },
                        }
                    );

                    const data = Array.isArray(res.data)
                        ? res.data
                        : res.data.results || [];

                    if (data.length > 0)
                        recordData = data[0];
                }

                // FETCH THEO RECORD ID
                else if (params.recordId) {

                    const res = await api.get(
                        endpoints['medical-detail'](params.recordId)
                    );

                    recordData = res.data;
                }

                if (recordData) {

                    setRecord(recordData);

                    // FETCH TEST RESULTS
                    try {

                        const testRes = await api.get(
                            endpoints['test-results'](recordData.id)
                        );

                        const testData = Array.isArray(testRes.data)
                            ? testRes.data
                            : testRes.data.results || [];

                        setTestResults(testData);

                    } catch (e) {

                        console.log(
                            'FETCH TEST RESULTS ERROR:',
                            e.response?.data || e
                        );
                    }
                }

            } catch (err) {

                console.log(
                    'FETCH RECORD ERROR:',
                    err.response?.data || err
                );

            } finally {
                setLoading(false);
            }
        };

        fetchData();

    }, []);

    // LOADING
    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" />
                <Text style={{ marginTop: 10 }}>
                    Đang tải hồ sơ...
                </Text>
            </View>
        );
    }

    // KHÔNG TÌM THẤY
    if (!record) {
        return (
            <View style={styles.center}>
                <Text style={styles.errorText}>
                    ⚠️ Không tìm thấy hồ sơ bệnh án{'\n'}
                    Params: {JSON.stringify(params)}
                </Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>

            <Card style={styles.card}>

                <Card.Title
                    title="📋 Thông tin hồ sơ"
                    titleStyle={{ fontWeight: '700' }}
                />

                <Card.Content>

                    {/* PATIENT */}
                    {record.patient_name && (
                        <>
                            <Text style={styles.label}>
                                Bệnh nhân
                            </Text>

                            <Text style={styles.value}>
                                {record.patient_name}
                            </Text>

                            <Divider style={styles.divider} />
                        </>
                    )}

                    {/* DOCTOR */}
                    {record.doctor_name && (
                        <>
                            <Text style={styles.label}>
                                Bác sĩ
                            </Text>

                            <Text style={styles.value}>
                                {record.doctor_name}
                            </Text>

                            <Divider style={styles.divider} />
                        </>
                    )}

                    {/* WORK DATE */}
                    {record.work_date && (
                        <>
                            <Text style={styles.label}>
                                Ngày khám
                            </Text>

                            <Text style={styles.value}>
                                {record.work_date}
                            </Text>

                            <Divider style={styles.divider} />
                        </>
                    )}

                    {/* BỆNH ÁN */}
                    <Text style={styles.sectionTitle}>
                        🩺 Thông tin bệnh án
                    </Text>

                    <Text style={styles.label}>
                        Triệu chứng
                    </Text>

                    <Text style={styles.value}>
                        {record.symptoms || '—'}
                    </Text>

                    <Text style={styles.label}>
                        Chẩn đoán
                    </Text>

                    <Text style={styles.value}>
                        {record.diagnosis || '—'}
                    </Text>

                    <Text style={styles.label}>
                        Điều trị
                    </Text>

                    <Text style={styles.value}>
                        {record.treatment || '—'}
                    </Text>

                    {record.notes ? (
                        <>
                            <Text style={styles.label}>
                                Ghi chú
                            </Text>

                            <Text style={styles.value}>
                                {record.notes}
                            </Text>
                        </>
                    ) : null}

                    {/* KẾT QUẢ KHÁM */}
                    <Divider style={styles.sectionDivider} />

                    <Text style={styles.sectionTitle}>
                        📋 Kết quả khám
                    </Text>

                    <View style={styles.row}>

                        <View style={styles.halfBox}>
                            <Text style={styles.label}>
                                Huyết áp
                            </Text>

                            <Text style={styles.value}>
                                {record.blood_pressure || '—'}
                            </Text>
                        </View>

                        <View style={styles.halfBox}>
                            <Text style={styles.label}>
                                Nhiệt độ
                            </Text>

                            <Text style={styles.value}>
                                {record.temperature || '—'}
                            </Text>
                        </View>

                    </View>

                    <View style={styles.row}>

                        <View style={styles.halfBox}>
                            <Text style={styles.label}>
                                Chiều cao
                            </Text>

                            <Text style={styles.value}>
                                {record.height || '—'}
                            </Text>
                        </View>

                        <View style={styles.halfBox}>
                            <Text style={styles.label}>
                                Cân nặng
                            </Text>

                            <Text style={styles.value}>
                                {record.weight || '—'}
                            </Text>
                        </View>

                    </View>

                    {/* TEST RESULTS */}
                    {testResults.length > 0 && (
                        <>

                            <Divider style={styles.sectionDivider} />

                            <Text style={styles.sectionTitle}>
                                🔬 Kết quả xét nghiệm
                            </Text>

                            {testResults.map((test, i) => (

                                <View
                                    key={test.id || i}
                                    style={styles.testCard}
                                >

                                    {/* TÊN */}
                                    <Text style={styles.testName}>
                                        {test.name}
                                    </Text>

                                    {/* TYPE */}
                                    {test.type ? (
                                        <Text style={styles.testType}>
                                            Loại: {test.type}
                                        </Text>
                                    ) : null}

                                    {/* RESULT */}
                                    <Text style={styles.label}>
                                        Kết quả
                                    </Text>

                                    <Text style={styles.value}>
                                        {test.result}
                                    </Text>

                                    {/* IMAGE */}
                                    {test.file && (
                                        <View style={styles.imageContainer}>

                                            <Text style={styles.label}>
                                                Hình ảnh xét nghiệm
                                            </Text>

                                            <Image
                                                source={{ uri: test.file }}
                                                style={styles.testImage}
                                                resizeMode="cover"
                                            />

                                        </View>
                                    )}

                                    {/* DATE */}
                                    {test.tested_at ? (
                                        <Text style={styles.testDate}>
                                            🕐 {
                                                new Date(test.tested_at)
                                                    .toLocaleDateString('vi-VN')
                                            }
                                        </Text>
                                    ) : null}

                                </View>
                            ))}

                        </>
                    )}

                    {/* BUTTONS */}
                    <Divider style={styles.sectionDivider} />

                    <Button
                        mode="outlined"
                        icon="pill"
                        style={styles.button}
                        onPress={() =>
                            navigation.navigate(
                                'PrescriptionDetail',
                                { recordId: record.id }
                            )
                        }
                    >
                        Xem đơn thuốc
                    </Button>

                    <Button
                        mode="text"
                        icon="arrow-left"
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        Trở về
                    </Button>

                </Card.Content>

            </Card>

        </ScrollView>
    );
};

export default MedicalRecordDetailScreen;

const styles = StyleSheet.create({

    container: {
        flex: 1,
        backgroundColor: '#F5F6FA',
        padding: 12,
    },

    card: {
        borderRadius: 16,
        backgroundColor: '#FFF',
        marginBottom: 20,
    },

    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111',
        marginTop: 16,
        marginBottom: 10,
    },

    sectionDivider: {
        marginVertical: 16,
    },

    divider: {
        marginVertical: 8,
    },

    label: {
        fontSize: 12,
        color: '#888',
        fontWeight: '600',
        textTransform: 'uppercase',
        marginTop: 10,
    },

    value: {
        fontSize: 15,
        color: '#111',
        marginTop: 4,
        lineHeight: 22,
    },

    row: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 4,
    },

    halfBox: {
        flex: 1,
    },

    button: {
        marginTop: 8,
        borderRadius: 10,
    },

    backButton: {
        marginTop: 4,
        borderRadius: 10,
    },

    // TEST CARD
    testCard: {
        backgroundColor: '#F8F9FF',
        borderRadius: 12,
        padding: 14,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E0E7FF',
    },

    testName: {
        fontSize: 15,
        fontWeight: '700',
        color: '#3949AB',
    },

    testType: {
        fontSize: 13,
        color: '#666',
        marginTop: 4,
    },

    testDate: {
        fontSize: 12,
        color: '#999',
        marginTop: 10,
        textAlign: 'right',
    },

    // IMAGE
    imageContainer: {
        marginTop: 12,
    },

    testImage: {
        width: '100%',
        height: 220,
        borderRadius: 12,
        marginTop: 8,
        backgroundColor: '#EEE',
    },

    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },

    errorText: {
        textAlign: 'center',
        color: '#856404',
        backgroundColor: '#FFF3CD',
        padding: 16,
        borderRadius: 10,
        lineHeight: 22,
    },

});