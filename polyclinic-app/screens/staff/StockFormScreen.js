import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, TextInput, Button, Card } from 'react-native-paper';
import { Picker } from '@react-native-picker/picker';
import { authApis, endpoints } from '../../configs/Apis';
import COLORS from '../../styles/colors';

const TYPE_CHOICES = [
    { label: 'Nhập thêm',   value: 'import' },
    { label: 'Điều chỉnh', value: 'adjust' },
];

export default function StockFormScreen({ navigation }) {
    const [medicines, setMedicines] = useState([]);
    const [loading,   setLoading]   = useState(false);
    const [stockInfo, setStockInfo] = useState(null);
    const [form,      setForm]      = useState({
        medicine:         '',
        transaction_type: 'import',
        quantity:         '',
        note:             '',
    });

    useEffect(() => {
        const fetchMedicines = async () => {
            try {
                const api = await authApis();
                const res = await api.get(endpoints['medicines']);
                setMedicines(res.data.results || res.data);
            } catch (err) {
                console.error(err);
            }
        };
        fetchMedicines();
    }, []);

    const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

    const handleSelectMedicine = (medicineId) => {
        update('medicine', medicineId);
        setStockInfo(null);
        if (!medicineId) return;

        const selected = medicines.find(m => m.id === medicineId);
        if (selected) {
            setStockInfo({
                quantity:     selected.stock_quantity ?? 0,
                min_quantity: selected.min_quantity   ?? 0,
                expiry_date:  selected.expiry_date    ?? '—',
                is_low_stock: selected.is_low_stock   ?? false,
                is_expired:   selected.is_expired     ?? false,
            });
        }
    };

    const stockColor = () => {
        if (!stockInfo) return COLORS.gray;
        if (stockInfo.is_expired)  return '#EF4444';
        if (stockInfo.is_low_stock) return '#F59E0B';
        return '#10B981';
    };

    const handleSubmit = async () => {
        if (!form.medicine || !form.quantity) {
            Alert.alert('Lỗi', 'Vui lòng chọn thuốc và nhập số lượng!');
            return;
        }
        try {
            setLoading(true);
            const api = await authApis();
            await api.post(endpoints['stock-transactions'], {
                medicine:         form.medicine,
                transaction_type: form.transaction_type,
                quantity:         parseInt(form.quantity),
                note:             form.note || (form.transaction_type === 'import'
                                    ? 'Nhập thêm hàng' : 'Điều chỉnh tồn kho'),
            });
            Alert.alert('Thành công', 'Đã cập nhật kho!');
            navigation.goBack();
        } catch (err) {
            console.error('StockForm:', err.response?.data);
            Alert.alert('Lỗi', JSON.stringify(err.response?.data || 'Có lỗi xảy ra'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.form}>
                <Text style={styles.sectionTitle}>Nhập kho thuốc</Text>

                <Text style={styles.label}>Loại giao dịch *</Text>
                <View style={styles.pickerBox}>
                    <Picker selectedValue={form.transaction_type}
                            onValueChange={(v) => update('transaction_type', v)}>
                        {TYPE_CHOICES.map(t => (
                            <Picker.Item key={t.value} label={t.label} value={t.value} />
                        ))}
                    </Picker>
                </View>

                <Text style={styles.label}>Thuốc *</Text>
                <View style={styles.pickerBox}>
                    <Picker selectedValue={form.medicine}
                            onValueChange={handleSelectMedicine}>
                        <Picker.Item label="-- Chọn thuốc --" value="" />
                        {medicines.map(m => (
                            <Picker.Item key={m.id} label={`${m.name} (tồn: ${m.stock_quantity ?? '?'})`}
                                         value={m.id} />
                        ))}
                    </Picker>
                </View>

                {/* Thông tin tồn kho hiện tại */}
                {stockInfo && (
                    <Card style={[styles.stockCard, { borderLeftColor: stockColor() }]}>
                        <Card.Content>
                            <Text style={styles.stockTitle}>Tồn kho hiện tại</Text>
                            <View style={styles.stockRow}>
                                <View style={styles.stockItem}>
                                    <Text style={styles.stockLabel}>Số lượng</Text>
                                    <Text style={[styles.stockValue, { color: stockColor() }]}>
                                        {stockInfo.quantity}
                                    </Text>
                                </View>
                                <View style={styles.stockItem}>
                                    <Text style={styles.stockLabel}>Tối thiểu</Text>
                                    <Text style={styles.stockValue}>{stockInfo.min_quantity}</Text>
                                </View>
                                <View style={styles.stockItem}>
                                    <Text style={styles.stockLabel}>Hạn dùng</Text>
                                    <Text style={[styles.stockValue, { fontSize: 12 }]}>
                                        {stockInfo.expiry_date}
                                    </Text>
                                </View>
                                <View style={styles.stockItem}>
                                    <Text style={styles.stockLabel}>Trạng thái</Text>
                                    <Text style={[styles.stockValue, { color: stockColor(), fontSize: 12 }]}>
                                        {stockInfo.is_expired   ? '⛔ Hết hạn'  :
                                         stockInfo.is_low_stock ? '⚠️ Sắp hết' : '✅ Còn hàng'}
                                    </Text>
                                </View>
                            </View>
                        </Card.Content>
                    </Card>
                )}

                <TextInput
                    label={form.transaction_type === 'adjust'
                        ? 'Số lượng tồn kho mới *'
                        : 'Số lượng nhập thêm *'}
                    value={form.quantity}
                    onChangeText={(v) => update('quantity', v)}
                    style={styles.input} mode="outlined"
                    keyboardType="numeric" />

                {/* Preview sau khi nhập */}
                {stockInfo && form.quantity ? (
                    <Text style={styles.preview}>
                        {form.transaction_type === 'import'
                            ? `Tồn sau nhập: ${stockInfo.quantity + parseInt(form.quantity || 0)}`
                            : `Tồn sẽ được điều chỉnh về: ${form.quantity}`}
                    </Text>
                ) : null}

                <TextInput label="Ghi chú" value={form.note}
                           onChangeText={(v) => update('note', v)}
                           style={styles.input} mode="outlined"
                           multiline numberOfLines={2} />

                <Button mode="contained" onPress={handleSubmit}
                        loading={loading} disabled={loading}
                        style={styles.btn} buttonColor={COLORS.primary}>
                    Xác nhận
                </Button>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container:   { flex: 1, backgroundColor: COLORS.background },
    form:        { padding: 16 },
    sectionTitle:{ fontWeight: 'bold', fontSize: 16, color: COLORS.text, marginBottom: 12 },
    label:       { color: COLORS.gray, fontSize: 13, marginBottom: 4 },
    pickerBox:   { borderWidth: 1, borderColor: COLORS.border, borderRadius: 8,
                   marginBottom: 12, backgroundColor: '#fff' },
    input:       { marginBottom: 8, backgroundColor: '#fff' },
    btn:         { marginTop: 12, borderRadius: 8, paddingVertical: 4 },
    stockCard:   { marginBottom: 12, borderLeftWidth: 4, borderRadius: 8 },
    stockTitle:  { fontWeight: 'bold', fontSize: 13, color: COLORS.text, marginBottom: 8 },
    stockRow:    { flexDirection: 'row', justifyContent: 'space-between' },
    stockItem:   { alignItems: 'center', flex: 1 },
    stockLabel:  { fontSize: 11, color: COLORS.gray, marginBottom: 2 },
    stockValue:  { fontWeight: 'bold', fontSize: 14, color: COLORS.text },
    preview:     { color: COLORS.primary, fontWeight: 'bold', fontSize: 14,
                   marginBottom: 12, textAlign: 'center' },
});