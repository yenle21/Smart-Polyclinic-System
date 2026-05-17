import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PaperProvider } from 'react-native-paper';
import { theme } from './components/shared/theme';
import colors from './styles/colors';

// Test import các file dùng chung
import { Button, Card, Input } from './components/shared';
import globalStyles from './styles/globalStyles';

export default function App() {
    return (
        <PaperProvider theme={theme}>
            <View style={styles.container}>

                <Text style={styles.title}>🏥 Smart Polyclinic</Text>
                <Text style={styles.sub}>Kiểm tra components dùng chung</Text>

                {/* Test Card */}
                <Card style={styles.card}>
                    <Text style={globalStyles.label}>Test Card component</Text>
                    <Text style={[globalStyles.title, { fontSize: 14 }]}>
                        Card hoạt động ✓
                    </Text>
                </Card>

                {/* Test Input */}
                <Input
                    label="Test Input"
                    placeholder="Nhập gì đó..."
                />

                {/* Test Button variants */}
                <Button
                    title="Button Primary"
                    onPress={() => alert('Primary OK')}
                    style={{ marginBottom: 10 }}
                />
                <Button
                    title="Button Outline"
                    variant="outline"
                    onPress={() => alert('Outline OK')}
                    style={{ marginBottom: 10 }}
                />
                <Button
                    title="Button Danger"
                    variant="danger"
                    onPress={() => alert('Danger OK')}
                    style={{ marginBottom: 10 }}
                />
                <Button
                    title="Loading..."
                    loading={true}
                    style={{ marginBottom: 10 }}
                />

                {/* Test colors */}
                <View style={styles.colorRow}>
                    {Object.entries(colors).slice(0, 6).map(([key, val]) => (
                        <View key={key} style={styles.colorItem}>
                            <View style={[styles.colorBox, { backgroundColor: val }]} />
                            <Text style={styles.colorLabel}>{key}</Text>
                        </View>
                    ))}
                </View>

                <Text style={styles.ok}>✅ Tất cả OK — sẵn sàng code màn hình</Text>

            </View>
        </PaperProvider>
    );
}

const styles = StyleSheet.create({
    container: {
        flex:            1,
        backgroundColor: colors.background,
        paddingHorizontal: 20,
        paddingTop:      60,
    },
    title: {
        fontSize:    24,
        fontWeight:  'bold',
        color:       colors.primary,
        textAlign:   'center',
        marginBottom: 4,
    },
    sub: {
        fontSize:    13,
        color:       colors.textLight,
        textAlign:   'center',
        marginBottom: 24,
    },
    card: { marginBottom: 16 },
    colorRow: {
        flexDirection:  'row',
        flexWrap:       'wrap',
        gap:            8,
        marginTop:      16,
        marginBottom:   16,
    },
    colorItem:  { alignItems: 'center', width: 55 },
    colorBox:   { width: 40, height: 40, borderRadius: 8, marginBottom: 4 },
    colorLabel: { fontSize: 9, color: colors.textLight, textAlign: 'center' },
    ok: {
        textAlign:  'center',
        color:      colors.success,
        fontWeight: '600',
        fontSize:   13,
        marginTop:  8,
    },
});