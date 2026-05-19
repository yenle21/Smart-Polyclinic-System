import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({

    container: {
        flex: 1,
        backgroundColor: '#F0F4FF',
    },

    // ========================
    // HEADER
    // ========================
    header: {
        backgroundColor: '#1565C0',
        paddingTop: 50,
        paddingBottom: 24,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#fff',
    },
    headerSubtitle: {
        fontSize: 13,
        color: '#90CAF9',
        marginTop: 4,
    },

    // ========================
    // SEARCH CARD
    // ========================
    searchCard: {
        margin: 16,
        borderRadius: 16,
        elevation: 3,
        backgroundColor: '#fff',
    },
    searchInput: {
        marginBottom: 10,
        backgroundColor: '#fff',
    },
    filterRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 10,
    },
    filterInputLeft: {
        flex: 1,
        backgroundColor: '#fff',
    },
    filterInputRight: {
        flex: 1,
        backgroundColor: '#fff',
    },
    searchBtn: {
        borderRadius: 10,
        backgroundColor: '#1565C0',
        marginTop: 4,
    },
    searchBtnText: {
        fontWeight: '700',
        fontSize: 14,
    },

    // ========================
    // RESULT
    // ========================
    resultHeader: {
        paddingHorizontal: 16,
        paddingBottom: 8,
        fontSize: 14,
        color: '#5C6BC0',
        fontWeight: '600',
    },

    // ========================
    // SCHEDULE CARD
    // ========================
    scheduleCard: {
        marginHorizontal: 16,
        marginBottom: 12,
        borderRadius: 14,
        elevation: 3,
        backgroundColor: '#fff',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    scheduleCardSelected: {
        borderColor: '#1565C0',
        backgroundColor: '#E8F0FE',
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    doctorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        flex: 1,
    },
    avatar: {
        backgroundColor: '#BBDEFB',
    },
    doctorName: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1A237E',
    },
    specialty: {
        fontSize: 12,
        color: '#5C6BC0',
        marginTop: 2,
    },
    slotChip: {
        backgroundColor: '#E8F5E9',
    },
    infoBox: {
        backgroundColor: '#F5F7FF',
        borderRadius: 10,
        padding: 10,
        marginBottom: 12,
        gap: 4,
    },
    infoText: {
        fontSize: 13,
        color: '#37474F',
        marginBottom: 2,
    },
    selectBtn: {
        borderRadius: 10,
        backgroundColor: '#1565C0',
    },
    selectBtnText: {
        fontWeight: '700',
        fontSize: 14,
        color: '#e4e7e8',
    },

    // ========================
    // CONFIRM CARD
    // ========================
    confirmCard: {
        margin: 16,
        marginBottom: 32,
        borderRadius: 16,
        elevation: 4,
        backgroundColor: '#fff',
    },
    confirmTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1565C0',
        marginBottom: 14,
    },
    bookBtn: {
        borderRadius: 10,
        backgroundColor: '#1565C0',
    },
    bookBtnText: {
        fontWeight: '700',
        fontSize: 14,
    },
    cancelBtn: {
        borderRadius: 10,
        borderColor: '#1565C0',
        marginTop: 10,
    },

    // ========================
    // EMPTY / LOADING
    // ========================
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    emptyText: {
        fontSize: 14,
        color: '#9E9E9E',
        marginTop: 8,
    },
    loadingContainer: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    loadingText: {
        marginTop: 12,
        color: '#5C6BC0',
        fontSize: 13,
    },
});

export default styles;