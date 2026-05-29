// AppointmentDetailScreenDoctor.js

import React, { useState } from 'react';
import {
    ScrollView,
    Text,
    StyleSheet,
    Alert,
    View,
    TouchableOpacity,
    Image,
    Modal,
    FlatList,
} from 'react-native';

import {
    Card,
    Divider,
    Button,
    TextInput,
} from 'react-native-paper';

import * as ImagePicker from 'expo-image-picker';

import {
    authApis,
    endpoints,
} from '../../configs/Apis';


const TEST_TYPES = [
    { label: 'Xét nghiệm máu',        value: 'blood',        price: 150000 },
    { label: 'Xét nghiệm nước tiểu',  value: 'urine',        price: 100000 },
    { label: 'Xét nghiệm vi sinh',     value: 'microbiology', price: 200000 },
    { label: 'Siêu âm',               value: 'ultrasound',   price: 300000 },
    { label: 'X-quang',               value: 'xray',         price: 250000 },
    { label: 'CT Scan',               value: 'ct_scan',      price: 800000 },
    { label: 'MRI',                   value: 'mri',          price: 1200000 },
    { label: 'Nội soi',               value: 'endoscopy',    price: 500000 },
    { label: 'Điện tâm đồ (ECG)',     value: 'ecg',          price: 180000 },
    { label: 'Xét nghiệm sinh hóa',   value: 'biochemistry', price: 220000 },
    { label: 'Xét nghiệm miễn dịch',  value: 'immunology',   price: 350000 },
    { label: 'Khác',                  value: 'other',        price: 0 },
];


const TestTypeSelector = ({ value, onSelect }) => {

    const [visible, setVisible] = useState(false);

    const selectedLabel =
        TEST_TYPES.find(t => t.value === value)?.label || '';

    return (
        <>
            <TouchableOpacity
                style={styles.selectorBtn}
                onPress={() => setVisible(true)}
            >
                <Text
                    style={
                        value
                            ? styles.selectorText
                            : styles.selectorPlaceholder
                    }
                >
                    {selectedLabel || '-- Chọn loại xét nghiệm --'}
                </Text>

                <Text style={styles.selectorArrow}>▼</Text>
            </TouchableOpacity>

            <Modal
                visible={visible}
                animationType="slide"
                transparent
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>

                        <View style={styles.modalHeader}>

                            <Text style={styles.modalTitle}>
                                Loại xét nghiệm
                            </Text>

                            <TouchableOpacity
                                onPress={() => setVisible(false)}
                            >
                                <Text style={styles.modalClose}>
                                    ✕ Đóng
                                </Text>
                            </TouchableOpacity>

                        </View>

                        <FlatList
                            data={TEST_TYPES}
                            keyExtractor={(item) => item.value}
                            renderItem={({ item }) => {
                                const isSelected = value === item.value;
                                return (
                                    <TouchableOpacity
                                        style={[styles.typeItem, isSelected && styles.typeItemSelected]}
                                        onPress={() => { onSelect(item.value); setVisible(false); }}
                                    >
                                        <Text style={[styles.typeItemText, isSelected && styles.typeItemTextSelected]}>
                                            {item.label}
                                        </Text>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                            <Text style={styles.priceText}>
                                                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price)}
                                            </Text>
                                            {isSelected && <Text style={styles.checkmark}>✓</Text>}
                                        </View>
                                    </TouchableOpacity>
                                );
                            }}
                            ItemSeparatorComponent={() => (
                                <View style={styles.separator} />
                            )}
                        />

                    </View>
                </View>
            </Modal>
        </>
    );
};


// ─────────────────────────────────────────────────────────────
// MAIN SCREEN
// ─────────────────────────────────────────────────────────────
const AppointmentDetailScreenDoctor = ({
    route,
    navigation,
}) => {

    const { appointment } = route.params;

    const [loading, setLoading] = useState(false);
    const [loadingPrescription, setLoadingPrescription] = useState(false);

    const [symptoms, setSymptoms] = useState('');
    const [diagnosis, setDiagnosis] = useState('');
    const [treatment, setTreatment] = useState('');
    const [notes, setNotes] = useState('');

    const [bloodPressure, setBloodPressure] = useState('');
    const [temperature, setTemperature] = useState('');
    const [height, setHeight] = useState('');
    const [weight, setWeight] = useState('');

    const [testResults, setTestResults] = useState([
        {
            type: '',
            name: '',
            result: '',
            imageUri: null,
        }
    ]);

    // ─────────────────────────────────────────
    // STATUS
    // ─────────────────────────────────────────
    const statusColor =
        appointment.status === 'confirmed'
            ? '#22C55E'
            : appointment.status === 'cancelled'
                ? '#EF4444'
                : appointment.status === 'completed'
                    ? '#3B82F6'
                    : '#F59E0B';

    const statusLabel =
        appointment.status === 'confirmed'
            ? 'Đã xác nhận'
            : appointment.status === 'cancelled'
                ? 'Đã huỷ'
                : appointment.status === 'completed'
                    ? 'Đã khám xong'
                    : 'Chờ xác nhận';

    // ─────────────────────────────────────────
    // UPDATE TEST
    // ─────────────────────────────────────────
    const updateTestResult = (index, field, value) => {

        setTestResults(prev => {

            const next = [...prev];

            next[index] = {
                ...next[index],
                [field]: value,
            };

            return next;
        });
    };

    const addTestResult = () => {
        setTestResults(prev => [
            ...prev,
            {
                type: '',
                name: '',
                result: '',
                imageUri: null,
            }
        ]);
    };

    const removeTestResult = (index) => {

        if (testResults.length === 1)
            return;

        setTestResults(prev =>
            prev.filter((_, i) => i !== index)
        );
    };

    // ─────────────────────────────────────────
    // PICK IMAGE
    // ─────────────────────────────────────────
    const pickImage = async (index) => {

        Alert.alert(
            'Chọn ảnh',
            'Bạn muốn chọn ảnh bằng cách nào?',
            [
                {
                    text: '📷 Camera',
                    onPress: async () => {

                        const permission =
                            await ImagePicker.requestCameraPermissionsAsync();

                        if (!permission.granted) {
                            Alert.alert(
                                'Lỗi',
                                'Cần cấp quyền camera'
                            );
                            return;
                        }

                        const result =
                            await ImagePicker.launchCameraAsync({
                                mediaTypes:
                                    ImagePicker.MediaTypeOptions.Images,
                                quality: 0.8,
                            });

                        if (!result.canceled) {
                            updateTestResult(
                                index,
                                'imageUri',
                                result.assets[0].uri
                            );
                        }
                    }
                },
                {
                    text: '🖼️ Thư viện',
                    onPress: async () => {

                        const permission =
                            await ImagePicker.requestMediaLibraryPermissionsAsync();

                        if (!permission.granted) {
                            Alert.alert(
                                'Lỗi',
                                'Cần cấp quyền thư viện'
                            );
                            return;
                        }

                        const result =
                            await ImagePicker.launchImageLibraryAsync({
                                mediaTypes:
                                    ImagePicker.MediaTypeOptions.Images,
                                quality: 0.8,
                            });

                        if (!result.canceled) {
                            updateTestResult(
                                index,
                                'imageUri',
                                result.assets[0].uri
                            );
                        }
                    }
                },
                {
                    text: 'Huỷ',
                    style: 'cancel',
                }
            ]
        );
    };

    // ─────────────────────────────────────────
    // GET OR CREATE RECORD
    // ─────────────────────────────────────────
    const getOrCreateMedicalRecord = async (api) => {

        const payload = {
            symptoms,
            diagnosis,
            treatment,
            notes,
            blood_pressure: bloodPressure,
            temperature,
            height,
            weight,
        };

        try {

            const existingRes = await api.get(
                endpoints['medical-records'],
                {
                    params: {
                        appointment_id: appointment.id
                    }
                }
            );

            const existingData =
                Array.isArray(existingRes.data)
                    ? existingRes.data
                    : existingRes.data.results || [];

            if (existingData.length > 0) {

                const recordId =
                    existingData[0].id;

                await api.patch(
                    endpoints['update-medical-record'](recordId),
                    payload
                );

                return recordId;
            }

        } catch (err) {

            console.log(
                'GET medical record error:',
                err.response?.data || err
            );
        }

        const createRes = await api.post(
            '/medical-records/create-record/',
            {
                appointment: appointment.id,
                ...payload,
            }
        );

        return createRes.data.id;
    };

    // ─────────────────────────────────────────
    // GO PRESCRIPTION
    // ─────────────────────────────────────────
    const goToPrescription = async () => {

        try {

            setLoadingPrescription(true);

            const api = await authApis();

            const recordId =
                await getOrCreateMedicalRecord(api);

            navigation.navigate(
                'Prescription',
                { recordId }
            );

        } catch (err) {

            Alert.alert(
                'Lỗi',
                'Không thể mở màn hình kê đơn'
            );

        } finally {
            setLoadingPrescription(false);
        }
    };

    // ─────────────────────────────────────────
    // COMPLETE APPOINTMENT
    // ─────────────────────────────────────────
    const completeAppointment = async () => {

        try {

            setLoading(true);

            const api =
                await authApis();

            const recordId =
                await getOrCreateMedicalRecord(api);

            const validTests = testResults.filter(t => t.type !== '');
            const service_fee = validTests.reduce((sum, t) => {
                const found = TEST_TYPES.find(tt => tt.value === t.type);
                return sum + (found?.price || 0);
            }, 0);

            console.log('validTests:', validTests.length);
            console.log('service_fee:', service_fee);

            for (const test of validTests) {

                if (test.imageUri) {

                    const formData =
                        new FormData();

                    formData.append(
                        'name',
                         test.name
                    );

                    formData.append(
                        'result',
                        test.result
                    );

                    formData.append(
                        'type',
                        test.type
                    );

                    const filename =
                        test.imageUri
                            .split('/')
                            .pop();

                    formData.append(
                        'file',
                        {
                            uri: test.imageUri,
                            name: filename,
                            type: 'image/jpeg',
                        }
                    );

                    await api.post(
                        endpoints['test-results'](recordId),
                        formData,
                        {
                            headers: {
                                'Content-Type':
                                    'multipart/form-data'
                            }
                        }
                    );

                } else {

                    await api.post(
                        endpoints['test-results'](recordId),
                        {
                            name: test.name,
                            result: test.result,
                            type: test.type,
                        }
                    );
                }
            }

            await api.patch(
                endpoints['complete-appointment'](
                    appointment.id
                )
            );

            // Tạo hoặc cập nhật invoice với service_fee
            try {
                const invoiceRes = await api.get(endpoints['invoices'], {
                    params: { appointment_id: appointment.id }
                });
                const invoices = invoiceRes.data.results || invoiceRes.data;
                console.log('invoices found:', invoices.length, 'service_fee:', service_fee);
                
                if (invoices.length > 0) {
                    // Cập nhật invoice đã có
                    await api.patch(endpoints['invoice-detail'](invoices[0].id), { service_fee });
                } else {
                    // Tạo invoice mới
                    await api.post(endpoints['invoices'], {
                        appointment: appointment.id,
                        patient:     appointment.patient_id,
                        service_fee,
                    });
                    console.log('patch response:', patchRes.data);
                }
            } catch (e) {
                console.log('invoice error:', e.response?.status, e.response?.data);
            }


            Alert.alert(
                'Thành công',
                'Đã hoàn tất khám'
            );

            navigation.goBack();

        } catch (err) {

            console.log(
                err.response?.data || err
            );

            Alert.alert(
                'Lỗi',
                'Không thể hoàn tất khám'
            );

        } finally {
            setLoading(false);
        }
    };

    // ─────────────────────────────────────────
    // VIEW RECORD
    // ─────────────────────────────────────────
    const viewMedicalRecord = async () => {

        try {

            setLoading(true);

            const api = await authApis();

            const res = await api.get(
                endpoints['medical-records'],
                {
                    params: {
                        appointment_id:
                            appointment.id
                    }
                }
            );

            const data =
                Array.isArray(res.data)
                    ? res.data
                    : res.data.results || [];

            if (data.length > 0) {

                navigation.navigate(
                    'MedicalTab',
                    {
                        screen:
                            'MedicalRecordDetailTab',
                        params: {
                            record: data[0]
                        }
                    }
                );

            } else {

                Alert.alert(
                    'Thông báo',
                    'Không tìm thấy hồ sơ'
                );
            }

        } catch (err) {

            Alert.alert(
                'Lỗi',
                'Không thể tải hồ sơ'
            );

        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView style={styles.container}>

            <Card style={styles.card}>

                <Card.Title title="Chi tiết lịch khám" />

                <Card.Content>

                    {/* PATIENT INFO */}

                    <Text style={styles.label}>
                        Bệnh nhân
                    </Text>

                    <Text style={styles.value}>
                        {appointment.patient_name}
                    </Text>

                    <Divider style={styles.divider} />

                    <Text style={styles.label}>
                        Bác sĩ
                    </Text>

                    <Text style={styles.value}>
                        {appointment.doctor_name}
                    </Text>

                    <Divider style={styles.divider} />

                    <Text style={styles.label}>
                        Chuyên khoa
                    </Text>

                    <Text style={styles.value}>
                        {appointment.specialty_name}
                    </Text>

                    <Divider style={styles.divider} />

                    <Text style={styles.label}>
                        Ngày khám
                    </Text>

                    <Text style={styles.value}>
                        {appointment.work_date}
                    </Text>

                    <Divider style={styles.divider} />

                    <Text style={styles.label}>
                        Giờ khám
                    </Text>

                    <Text style={styles.value}>
                        {appointment.appointment_time}
                    </Text>

                    <Divider style={styles.divider} />

                    <Text style={styles.label}>
                        Trạng thái
                    </Text>

                    <Text
                        style={[
                            styles.value,
                            {
                                color: statusColor,
                                fontWeight: '700',
                            }
                        ]}
                    >
                        {statusLabel}
                    </Text>

                    {/* CONFIRMED */}

                    {appointment.status === 'confirmed' && (
                        <>

                            <Divider
                                style={
                                    styles.sectionDivider
                                }
                            />

                            <Text
                                style={
                                    styles.sectionTitle
                                }
                            >
                                🩺 Thông tin bệnh án
                            </Text>

                            <TextInput
                                label="Triệu chứng"
                                mode="outlined"
                                multiline
                                value={symptoms}
                                onChangeText={setSymptoms}
                                style={styles.input}
                            />

                            <TextInput
                                label="Chẩn đoán"
                                mode="outlined"
                                multiline
                                value={diagnosis}
                                onChangeText={setDiagnosis}
                                style={styles.input}
                            />

                            <TextInput
                                label="Điều trị"
                                mode="outlined"
                                multiline
                                value={treatment}
                                onChangeText={setTreatment}
                                style={styles.input}
                            />

                            <TextInput
                                label="Ghi chú"
                                mode="outlined"
                                multiline
                                value={notes}
                                onChangeText={setNotes}
                                style={styles.input}
                            />

                            {/* RESULT */}

                            <Text
                                style={
                                    styles.sectionTitle
                                }
                            >
                                📋 Kết quả khám
                            </Text>

                            <View style={styles.row}>

                                <TextInput
                                    label="Huyết áp"
                                    mode="outlined"
                                    value={bloodPressure}
                                    onChangeText={
                                        setBloodPressure
                                    }
                                    style={[
                                        styles.input,
                                        styles.halfInput,
                                    ]}
                                />

                                <TextInput
                                    label="Nhiệt độ"
                                    mode="outlined"
                                    value={temperature}
                                    onChangeText={
                                        setTemperature
                                    }
                                    style={[
                                        styles.input,
                                        styles.halfInput,
                                    ]}
                                />

                            </View>

                            <View style={styles.row}>

                                <TextInput
                                    label="Chiều cao"
                                    mode="outlined"
                                    value={height}
                                    onChangeText={setHeight}
                                    style={[
                                        styles.input,
                                        styles.halfInput,
                                    ]}
                                />

                                <TextInput
                                    label="Cân nặng"
                                    mode="outlined"
                                    value={weight}
                                    onChangeText={setWeight}
                                    style={[
                                        styles.input,
                                        styles.halfInput,
                                    ]}
                                />

                            </View>

                            {/* TEST */}

                            <Text
                                style={
                                    styles.sectionTitle
                                }
                            >
                                🔬 Kết quả xét nghiệm
                            </Text>

                            {testResults.map(
                                (test, index) => (

                                    <View
                                        key={index}
                                        style={
                                            styles.testCard
                                        }
                                    >

                                        <View
                                            style={
                                                styles.itemHeader
                                            }
                                        >

                                            <Text
                                                style={
                                                    styles.itemTitle
                                                }
                                            >
                                                Xét nghiệm #{index + 1}
                                            </Text>

                                            {testResults.length > 1 && (
                                                <TouchableOpacity
                                                    style={
                                                        styles.removeBtn
                                                    }
                                                    onPress={() =>
                                                        removeTestResult(index)
                                                    }
                                                >
                                                    <Text
                                                        style={
                                                            styles.removeBtnText
                                                        }
                                                    >
                                                        ✕ Xoá
                                                    </Text>
                                                </TouchableOpacity>
                                            )}
                                        </View>

                                        <Text
                                            style={
                                                styles.fieldLabel
                                            }
                                        >
                                            Loại xét nghiệm
                                        </Text>

                                        <TestTypeSelector
                                            value={test.type}
                                            onSelect={(v) =>
                                                updateTestResult(
                                                    index,
                                                    'type',
                                                    v
                                                )
                                            }
                                        />

                                        <TextInput
                                            label="Tên xét nghiệm"
                                            mode="outlined"
                                            value={test.name}
                                            onChangeText={(v) =>
                                                updateTestResult(
                                                    index,
                                                    'name',
                                                    v
                                                )
                                            }
                                            style={styles.input}
                                        />

                                        <TextInput
                                            label="Kết quả"
                                            mode="outlined"
                                            multiline
                                            value={test.result}
                                            onChangeText={(v) =>
                                                updateTestResult(
                                                    index,
                                                    'result',
                                                    v
                                                )
                                            }
                                            style={styles.input}
                                        />

                                        <TouchableOpacity
                                            style={
                                                styles.imagePickerBtn
                                            }
                                            onPress={() =>
                                                pickImage(index)
                                            }
                                        >
                                            <Text
                                                style={
                                                    styles.imagePickerText
                                                }
                                            >
                                                {test.imageUri
                                                    ? '✏️ Đổi ảnh'
                                                    : '📎 Đính kèm ảnh'}
                                            </Text>
                                        </TouchableOpacity>

                                        {test.imageUri && (
                                            <Image
                                                source={{
                                                    uri:
                                                        test.imageUri
                                                }}
                                                style={
                                                    styles.imagePreview
                                                }
                                            />
                                        )}

                                    </View>
                                )
                            )}

                            <TouchableOpacity
                                style={styles.addBtn}
                                onPress={addTestResult}
                            >
                                <Text
                                    style={
                                        styles.addBtnText
                                    }
                                >
                                    ＋ Thêm xét nghiệm
                                </Text>
                            </TouchableOpacity>

                            {/* PRESCRIPTION */}

                            <Button
                                mode="outlined"
                                icon="pill"
                                style={
                                    styles.prescriptionBtn
                                }
                                loading={
                                    loadingPrescription
                                }
                                onPress={
                                    goToPrescription
                                }
                            >
                                Kê đơn thuốc
                            </Button>

                            <Button
                                mode="contained"
                                style={styles.button}
                                loading={loading}
                                onPress={
                                    completeAppointment
                                }
                            >
                                Hoàn tất khám
                            </Button>

                        </>
                    )}

                    {/* COMPLETED */}

                    {appointment.status === 'completed' && (
                        <Button
                            mode="contained"
                            style={styles.button}
                            onPress={viewMedicalRecord}
                        >
                            Xem hồ sơ bệnh án
                        </Button>
                    )}

                </Card.Content>
            </Card>
        </ScrollView>
    );
};

export default AppointmentDetailScreenDoctor;


// ─────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────
const styles = StyleSheet.create({

    container: {
        flex: 1,
        backgroundColor: '#F5F6FA',
        padding: 12,
    },

    card: {
        borderRadius: 16,
        paddingBottom: 12,
    },

    label: {
        fontSize: 13,
        color: '#666',
        marginTop: 8,
    },

    value: {
        fontSize: 15,
        color: '#111',
        marginTop: 2,
    },

    divider: {
        marginVertical: 6,
    },

    sectionDivider: {
        marginVertical: 20,
    },

    sectionTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: '#111',
        marginBottom: 14,
        marginTop: 6,
    },

    input: {
        marginBottom: 14,
        backgroundColor: '#fff',
    },

    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 10,
    },

    halfInput: {
        flex: 1,
    },

    prescriptionBtn: {
        marginBottom: 16,
        borderRadius: 10,
    },

    button: {
        marginTop: 4,
        borderRadius: 10,
        paddingVertical: 5,
    },

    testCard: {
        borderWidth: 1,
        borderColor: '#E0E7FF',
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
        backgroundColor: '#F8F9FF',
    },

    itemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },

    itemTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#3949AB',
    },

    removeBtn: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        backgroundColor: '#FFEBEE',
        borderRadius: 8,
    },

    removeBtnText: {
        color: '#C62828',
        fontSize: 13,
        fontWeight: '600',
    },

    addBtn: {
        borderWidth: 1.5,
        borderColor: '#3949AB',
        borderStyle: 'dashed',
        borderRadius: 10,
        paddingVertical: 12,
        alignItems: 'center',
        marginBottom: 16,
    },

    addBtnText: {
        color: '#3949AB',
        fontWeight: '700',
        fontSize: 15,
    },

    selectorBtn: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#DDD',
        borderRadius: 10,
        backgroundColor: '#FFF',
        paddingHorizontal: 14,
        paddingVertical: 14,
        marginBottom: 12,
    },

    selectorText: {
        fontSize: 15,
        color: '#111',
        flex: 1,
    },

    selectorPlaceholder: {
        fontSize: 15,
        color: '#999',
        flex: 1,
    },

    selectorArrow: {
        fontSize: 12,
        color: '#666',
    },

    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.45)',
        justifyContent: 'flex-end',
    },

    modalContainer: {
        backgroundColor: '#FFF',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 16,
        maxHeight: '70%',
    },

    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },

    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111',
    },

    modalClose: {
        fontSize: 14,
        color: '#E53935',
        fontWeight: '600',
    },

    typeItem: {
        paddingVertical: 14,
        paddingHorizontal: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },

    typeItemSelected: {
        backgroundColor: '#E8EAF6',
        borderRadius: 8,
    },

    typeItemText: {
        fontSize: 15,
        color: '#111',
    },

    typeItemTextSelected: {
        color: '#3949AB',
        fontWeight: '600',
    },

    checkmark: {
        color: '#3949AB',
        fontSize: 16,
        fontWeight: '700',
    },

    separator: {
        height: 1,
        backgroundColor: '#F0F0F0',
    },

    imagePickerBtn: {
        borderWidth: 1.5,
        borderColor: '#3949AB',
        borderRadius: 10,
        paddingVertical: 10,
        alignItems: 'center',
        marginBottom: 10,
    },

    imagePickerText: {
        color: '#3949AB',
        fontWeight: '600',
        fontSize: 14,
    },

    imagePreview: {
        width: '100%',
        height: 180,
        borderRadius: 10,
        marginTop: 8,
    },

    fieldLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#333',
        marginBottom: 6,
        marginTop: 6,
    },
    priceText: { 
        color: '#2196F3',
        fontSize: 13, 
        fontWeight: '600' },
});