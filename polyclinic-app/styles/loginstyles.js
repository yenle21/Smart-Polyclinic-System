import { StyleSheet } from 'react-native';

const loginstyles = StyleSheet.create({
    container: {
        flexGrow: 1,
        backgroundColor: '#F5F7FA',
        justifyContent: 'center',
        paddingHorizontal: 24,
        paddingVertical: 40,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 20,
        elevation: 5,
    },
    cardTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1A237E',
        marginBottom: 4,
        textAlign: 'center',
    },
    cardSub: {
        fontSize: 13,
        color: '#90A4AE',
        marginBottom: 20,
        textAlign: 'center',
    },
    label: {
        fontSize: 13,
        fontWeight: '600',
        color: '#546E7A',
        marginBottom: 8,
    },

    // ── Dropdown ───────────────────────────────────
    dropdownBtn: {
        borderRadius: 8,
        borderColor: '#CFD8DC',
        borderWidth: 1,
        backgroundColor: '#F5F7FA',
        marginBottom: 16,
        justifyContent: 'flex-start',
    },
    dropdownContent: {
        flexDirection: 'row-reverse',  // icon chevron bên phải
        justifyContent: 'space-between',
        height: 48,
    },
    dropdownLabel: {
        fontSize: 14,
        color: '#90A4AE',             // màu placeholder
        fontWeight: '400',
        flex: 1,
        textAlign: 'left',
    },
    dropdownLabelSelected: {
        color: '#1A237E',             // màu khi đã chọn
        fontWeight: '600',
    },
    menuStyle: {
        marginTop: 55,
        width: '75%',
    },
    menuItem: {
        paddingHorizontal: 8,
    },
    menuItemActive: {
        backgroundColor: '#E8F0FE',
    },
    menuItemTitle: {
        fontSize: 14,
        color: '#010101',
    },
    menuItemTitleActive: {
        color: '#1565C0',
        fontWeight: '700',
    },

    // ── Input ──────────────────────────────────────
    input: {
        backgroundColor: '#F5F7FA',
        marginBottom: 12,
    },
    errorText: {
        marginBottom: 4,
    },

    // ── Button ─────────────────────────────────────
    loginBtn: {
        borderRadius: 20,
        paddingVertical: 4,
        backgroundColor: '#1565C0',
    },
    loginBtnLabel: {
        fontSize: 15,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    // ── Link đăng ký ───────────────────────────────
    registerRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
    },
    registerText: {
        fontSize: 13,
        color: '#90A4AE',
    },
    registerLink: {
        fontSize: 13,
        color: '#1565C0',
        fontWeight: '700',
    },
});

export default loginstyles;