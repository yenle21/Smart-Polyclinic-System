import { StyleSheet } from 'react-native';
import colors from './colors';

export default StyleSheet.create({
    // Layout
    container:      { flex: 1, backgroundColor: colors.background },
    centered:       { flex: 1, justifyContent: 'center', alignItems: 'center' },
    row:            { flexDirection: 'row', alignItems: 'center' },
    rowBetween:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },

    // Spacing
    p12:            { padding: 12 },
    p16:            { padding: 16 },
    ph12:           { paddingHorizontal: 12 },
    pv8:            { paddingVertical: 8 },
    mb8:            { marginBottom: 8 },
    mb12:           { marginBottom: 12 },
    mb16:           { marginBottom: 16 },

    // Text
    title:          { fontSize: 18, fontWeight: 'bold', color: colors.text },
    subtitle:       { fontSize: 14, color: colors.textLight },
    label:          { fontSize: 12, color: colors.textLight },
    price:          { fontSize: 14, fontWeight: '600', color: colors.primary },

    // Card
    card:           { backgroundColor: colors.white, borderRadius: 12,
                      marginBottom: 10, elevation: 2,
                      shadowColor: '#000', shadowOpacity: 0.05,
                      shadowOffset: { width: 0, height: 2 } },

    // Input
    input:          { backgroundColor: colors.white, borderRadius: 8,
                      borderWidth: 1, borderColor: colors.border,
                      padding: 12, fontSize: 14, marginBottom: 12 },

    // Button
    btnPrimary:     { backgroundColor: colors.primary, borderRadius: 10,
                      padding: 14, alignItems: 'center' },
    btnText:        { color: colors.white, fontWeight: '600', fontSize: 15 },

    // Header
    headerStyle:    { backgroundColor: colors.primary },
    headerTintColor: colors.white,
});