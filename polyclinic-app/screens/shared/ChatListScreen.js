import React, { useEffect, useState, useContext } from 'react';
import { View, FlatList, StyleSheet, Pressable } from 'react-native';
import { Text, Avatar, Badge, FAB } from 'react-native-paper';
import { db } from '../../configs/firebase';
import { ref, onValue, set } from 'firebase/database';
import { MyUserContext } from '../../configs/Contexts';
import COLORS from '../../styles/colors';

export default function ChatListScreen({ navigation }) {
    const [user]    = useContext(MyUserContext);
    const [chats,   setChats]   = useState([]);
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        console.log('user role:', user?.role, '| user id:', user?.id);
        const chatsRef = ref(db, 'chats');
        const unsub = onValue(chatsRef, (snapshot) => {
            const data = snapshot.val();
            console.log('firebase chats:', JSON.stringify(data));
            if (!data) { setChats([]); return; }

            const list = Object.entries(data)
                .map(([id, chat]) => ({ id, ...chat }))
                .filter(chat => {
                    if (user?.role === 'patient') {
                        // Patient chỉ thấy chat của mình
                        return chat.patient_id === user?.id;
                    } else {
                        // Staff thấy tất cả chat (kể cả chưa có staff)
                        return true;
                    }
                })
                .sort((a, b) => (b.last_time || 0) - (a.last_time || 0));

            setChats(list);
        });

        return () => unsub();
    }, [user]);

    const createNewChat = async () => {
        if (user?.role !== 'patient') return;
        try {
            setCreating(true);
            const chatId  = `chat_${user.id}_${Date.now()}`;
            await set(ref(db, `chats/${chatId}`), {
                patient_id:     user.id,
                patient_name:   `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Bệnh nhân',
                staff_id:       null,
                staff_name:     'Nhân viên y tế',
                last_message:   '',
                last_time:      Date.now(),
                unread_patient: 0,
                unread_staff:   0,
                created_at:     Date.now(),
            });
            navigation.navigate('Chat', { chatId, name: 'Nhân viên y tế' });
        } catch (err) {
            console.error(err);
        } finally {
            setCreating(false);
        }
    };

    const renderItem = ({ item }) => {
        const isPatient  = user?.role === 'patient';
        const name       = isPatient
            ? (item.staff_name || 'Nhân viên y tế')
            : (item.patient_name || 'Bệnh nhân');
        const unread     = isPatient ? item.unread_patient : item.unread_staff;

        return (
            <Pressable style={styles.item}
                       onPress={() => navigation.navigate('Chat', { chatId: item.id, name })}>
                <Avatar.Icon size={48} icon="account" style={styles.avatar} />
                <View style={styles.info}>
                    <Text style={styles.name}>{name}</Text>
                    <Text style={styles.last} numberOfLines={1}>
                        {item.last_message || 'Bắt đầu cuộc trò chuyện...'}
                    </Text>
                </View>
                {unread > 0 && (
                    <Badge style={styles.badge}>{unread}</Badge>
                )}
            </Pressable>
        );
    };

    return (
        <View style={styles.container}>
            <FlatList
                data={chats}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                contentContainerStyle={styles.list}
                ListEmptyComponent={
                    <Text style={styles.empty}>
                        {user?.role === 'patient'
                            ? 'Nhấn + để bắt đầu trò chuyện với nhân viên'
                            : 'Chưa có tin nhắn nào'}
                    </Text>
                }
            />
            {user?.role === 'patient' && (
                <FAB icon="plus" style={styles.fab}
                     loading={creating}
                     onPress={createNewChat} />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    list:      { paddingBottom: 80 },
    item:      { flexDirection: 'row', alignItems: 'center',
                 padding: 12, backgroundColor: '#fff',
                 borderBottomWidth: 1, borderBottomColor: COLORS.border },
    avatar:    { backgroundColor: COLORS.primary },
    info:      { flex: 1, marginLeft: 12 },
    name:      { fontWeight: 'bold', color: COLORS.text, fontSize: 15 },
    last:      { color: COLORS.gray, fontSize: 13, marginTop: 2 },
    badge:     { backgroundColor: COLORS.primary },
    empty:     { textAlign: 'center', color: COLORS.gray, marginTop: 40, paddingHorizontal: 24 },
    fab:       { position: 'absolute', right: 16, bottom: 16, backgroundColor: COLORS.primary },
});