import React, { useEffect, useState } from 'react';
import {
    View, StyleSheet, Alert, ScrollView, Text,
    TouchableOpacity, Modal, FlatList, Platform,
} from 'react-native';
import { TextInput, Button, ActivityIndicator, Card } from 'react-native-paper';
import { authApis, endpoints } from '../../configs/Apis';

const emptyItem = () => ({
    _key:          Date.now() + Math.random(),
    medicine:      null,
    medicineName:  '',   // lưu tên để hiển thị
    quantity:      '',
    dosage:        '',
    duration_days: '',
    notes:         '',
});

// ─── Component chọn thuốc thay thế Picker ────────────────────────────────────
const MedicineSelector = ({ medicines, selectedId, selectedName, onSelect }) => {
    const [visible, setVisible] = useState(false);
    const [search,  setSearch]  = useState('');

    const filtered = medicines.filter(m =>
        m.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <>
            {/* Nút bấm để mở modal */}
            <TouchableOpacity
                style={styles.selectorBtn}
                onPress={() => setVisible(true)}
            >
                <Text style={selectedId ? styles.selectorText : styles.selectorPlaceholder}>
                    {selectedName || '-- Chọn thuốc --'}
                </Text>
                <Text style={styles.selectorArrow}>▼</Text>
            </TouchableOpacity>

            {/* Modal danh sách thuốc */}
            <Modal visible={visible} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>

                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Chọn thuốc</Text>
                            <TouchableOpacity onPress={() => { setVisible(false); setSearch(''); }}>
                                <Text style={styles.modalClose}>✕ Đóng</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Ô tìm kiếm */}
                        <TextInput
                            placeholder="Tìm tên thuốc..."
                            mode="outlined"
                            value={search}
                            onChangeText={setSearch}
                            style={styles.searchInput}
                            left={<TextInput.Icon icon="magnify" />}
                        />

                        {filtered.length === 0 ? (
                            <Text style={styles.emptyText}>Không tìm thấy thuốc</Text>
                        ) : (
                            <FlatList
                                data={filtered}
                                keyExtractor={item => String(item.id)}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        style={[
                                            styles.medicineItem,
                                            selectedId === item.id && styles.medicineItemSelected
                                        ]}
                                        onPress={() => {
                                            onSelect(item.id, item.name);
                                            setVisible(false);
                                            setSearch('');
                                        }}
                                    >
                                        <Text style={[
                                            styles.medicineItemText,
                                            selectedId === item.id && styles.medicineItemTextSelected
                                        ]}>
                                            {item.name}
                                        </Text>
                                        {selectedId === item.id && (
                                            <Text style={styles.checkmark}>✓</Text>
                                        )}
                                    </TouchableOpacity>
                                )}
                                ItemSeparatorComponent={() => <View style={styles.separator} />}
                            />
                        )}
                    </View>
                </View>
            </Modal>
        </>
    );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────
const PrescriptionScreen = ({ route, navigation }) => {

    const params   = route.params || {};
    const recordId =
        params.recordId   ||
        params.record_id  ||
        params.id         ||
        params.record?.id ||
        null;

    const [medicines,        setMedicines]        = useState([]);
    const [loadingMedicines, setLoadingMedicines] = useState(true);
    const [loading,          setLoading]          = useState(false);
    const [instructions,     setInstructions]     = useState('');
    const [items,            setItems]            = useState([emptyItem()]);

    useEffect(() => {
        const loadMedicines = async () => {
            try {
                const api = await authApis();
                const res = await api.get(endpoints['medicines']);
                const data = Array.isArray(res.data) ? res.data : res.data.results || [];
                setMedicines(data);
            } catch (err) {
                console.log('LOAD MEDICINES ERROR:', err.response?.data || err);
                Alert.alert('Lỗi', 'Không tải được danh sách thuốc');
            } finally {
                setLoadingMedicines(false);
            }
        };
        loadMedicines();
    }, []);

    const updateItem = (index, field, value) => {
        setItems(prev => {
            const next = [...prev];
            next[index] = { ...next[index], [field]: value };
            return next;
        });
    };

    const addItem    = () => setItems(prev => [...prev, emptyItem()]);
    const removeItem = (index) => {
        if (items.length === 1) {
            Alert.alert('Thông báo', 'Đơn thuốc phải có ít nhất 1 loại thuốc');
            return;
        }
        setItems(prev => prev.filter((_, i) => i !== index));
    };

    const savePrescription = async () => {
        if (!recordId) {
            Alert.alert('Lỗi', 'Không tìm thấy mã hồ sơ bệnh án.');
            return;
        }
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (!item.medicine) {
                Alert.alert('Thông báo', `Thuốc #${i + 1}: Vui lòng chọn thuốc`);
                return;
            }
            if (!item.quantity) {
                Alert.alert('Thông báo', `Thuốc #${i + 1}: Vui lòng nhập số lượng`);
                return;
            }
            if (!item.dosage) {
                Alert.alert('Thông báo', `Thuốc #${i + 1}: Vui lòng nhập liều dùng`);
                return;
            }
        }

        const payload = {
            medical_record: parseInt(recordId),
            instructions:   instructions || '',
            items: items.map(item => ({
                medicine:      item.medicine,
                quantity:      parseInt(item.quantity),
                dosage:        item.dosage,
                duration_days: item.duration_days ? parseInt(item.duration_days) : null,
                notes:         item.notes || '',
            })),
        };

        try {
            setLoading(true);
            const api = await authApis();
            await api.post(endpoints['prescriptions'], payload);
            Alert.alert('Thành công', `Đã kê đơn ${items.length} loại thuốc`);
            navigation.goBack();
        } catch (err) {
            console.log('SAVE PRESCRIPTION ERROR:', err.response?.data || err);
            Alert.alert('Lỗi', 'Không thể lưu đơn thuốc:\n' + JSON.stringify(err.response?.data));
        } finally {
            setLoading(false);
        }
    };

    if (loadingMedicines) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" />
                <Text style={{ marginTop: 10 }}>Đang tải danh sách thuốc...</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
            <Card style={styles.card}>
                <Card.Title title="💊 Kê đơn thuốc" titleStyle={{ fontWeight: '700' }} />
                <Card.Content>

                    {items.map((item, index) => (
                        <View key={item._key} style={styles.itemCard}>

                            <View style={styles.itemHeader}>
                                <Text style={styles.itemTitle}>🧪 Thuốc #{index + 1}</Text>
                                <TouchableOpacity onPress={() => removeItem(index)} style={styles.removeBtn}>
                                    <Text style={styles.removeBtnText}>✕ Xóa</Text>
                                </TouchableOpacity>
                            </View>

                            <Text style={styles.label}>Chọn thuốc *</Text>
                            <MedicineSelector
                                medicines={medicines}
                                selectedId={item.medicine}
                                selectedName={item.medicineName}
                                onSelect={(id, name) => {
                                    updateItem(index, 'medicine', id);
                                    updateItem(index, 'medicineName', name);
                                }}
                            />

                            <TextInput label="Số lượng *" mode="outlined" keyboardType="numeric"
                                value={item.quantity} onChangeText={v => updateItem(index, 'quantity', v)}
                                style={styles.input} />

                            <TextInput label="Liều dùng * (VD: 2 viên/lần, 3 lần/ngày)" mode="outlined"
                                value={item.dosage} onChangeText={v => updateItem(index, 'dosage', v)}
                                style={styles.input} />

                            <TextInput label="Số ngày dùng (optional)" mode="outlined" keyboardType="numeric"
                                value={item.duration_days} onChangeText={v => updateItem(index, 'duration_days', v)}
                                style={styles.input} />

                            <TextInput label="Ghi chú thuốc (optional)" mode="outlined" multiline numberOfLines={2}
                                value={item.notes} onChangeText={v => updateItem(index, 'notes', v)}
                                style={styles.input} />
                        </View>
                    ))}

                    <TouchableOpacity onPress={addItem} style={styles.addBtn}>
                        <Text style={styles.addBtnText}>＋ Thêm thuốc</Text>
                    </TouchableOpacity>

                    <TextInput label="Hướng dẫn chung (optional)" mode="outlined" multiline numberOfLines={2}
                        value={instructions} onChangeText={setInstructions}
                        style={[styles.input, { marginTop: 16 }]} />

                    <Button mode="contained" icon="content-save" loading={loading}
                        disabled={loading} onPress={savePrescription} style={styles.button}>
                        Lưu đơn thuốc ({items.length} loại)
                    </Button>

                </Card.Content>
            </Card>
        </ScrollView>
    );
};

export default PrescriptionScreen;

const styles = StyleSheet.create({
    container:      { flex: 1, backgroundColor: '#F5F6FA', padding: 14 },
    card:           { borderRadius: 18, backgroundColor: '#FFF', marginBottom: 20 },
    itemCard:       { borderWidth: 1, borderColor: '#E0E7FF', borderRadius: 12, padding: 12, marginBottom: 12, backgroundColor: '#F8F9FF' },
    itemHeader:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    itemTitle:      { fontSize: 15, fontWeight: '700', color: '#3949AB' },
    removeBtn:      { paddingHorizontal: 10, paddingVertical: 4, backgroundColor: '#FFEBEE', borderRadius: 8 },
    removeBtnText:  { color: '#C62828', fontSize: 13, fontWeight: '600' },
    addBtn:         { borderWidth: 1.5, borderColor: '#3949AB', borderStyle: 'dashed', borderRadius: 10, paddingVertical: 12, alignItems: 'center', marginBottom: 4 },
    addBtnText:     { color: '#3949AB', fontWeight: '700', fontSize: 15 },
    label:          { marginBottom: 6, marginTop: 6, fontSize: 14, fontWeight: '600', color: '#333' },
    input:          { marginTop: 6, marginBottom: 6, backgroundColor: '#FFF' },
    button:         { marginTop: 12, borderRadius: 10, paddingVertical: 5 },
    center:         { flex: 1, justifyContent: 'center', alignItems: 'center' },

    // ── MedicineSelector ──
    selectorBtn:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#DDD', borderRadius: 10, backgroundColor: '#FFF', paddingHorizontal: 14, paddingVertical: 14, marginBottom: 8 },
    selectorText:        { fontSize: 15, color: '#111', flex: 1 },
    selectorPlaceholder: { fontSize: 15, color: '#999', flex: 1 },
    selectorArrow:       { fontSize: 12, color: '#666' },

    // ── Modal ──
    modalOverlay:        { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
    modalContainer:      { backgroundColor: '#FFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 16, maxHeight: '75%' },
    modalHeader:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    modalTitle:          { fontSize: 18, fontWeight: '700', color: '#111' },
    modalClose:          { fontSize: 14, color: '#E53935', fontWeight: '600' },
    searchInput:         { marginBottom: 10, backgroundColor: '#FFF' },
    medicineItem:        { paddingVertical: 14, paddingHorizontal: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    medicineItemSelected:{ backgroundColor: '#E8EAF6', borderRadius: 8 },
    medicineItemText:    { fontSize: 15, color: '#111' },
    medicineItemTextSelected: { color: '#3949AB', fontWeight: '600' },
    checkmark:           { color: '#3949AB', fontSize: 16, fontWeight: '700' },
    separator:           { height: 1, backgroundColor: '#F0F0F0' },
    emptyText:           { textAlign: 'center', color: '#999', paddingVertical: 30 },
});