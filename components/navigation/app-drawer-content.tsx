import React, { useCallback, useEffect, useState } from 'react';
import { Text, Pressable, View, StyleSheet } from 'react-native';
import { DrawerContentScrollView, type DrawerContentComponentProps } from '@react-navigation/drawer';
import { useFocusEffect } from '@react-navigation/native';
import { getAllChatSessions } from '@/lib/chat-storage';
import type { ChatSession } from '@/types/chat';

export function AppDrawerContent(props: DrawerContentComponentProps) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);

const load = useCallback(async () => {
    const all = await getAllChatSessions();
    setSessions(all.slice(0, 20));
  }, []);

  // Use props.state as a dependency. 
  // It changes whenever the drawer opens or the route changes.
  useEffect(() => {
    load();
  }, [props.state, load]);

  return (
    <DrawerContentScrollView {...props}>
      <View style={styles.section}>
        <Pressable
          style={styles.newChatBtn}
          onPress={() =>
            props.navigation.navigate('index', {
              sid: 'new',
              t: Date.now().toString(),
            })
          }
        >
          <Text style={styles.newChatText}>+ New Chat</Text>
        </Pressable>

        <Text style={styles.heading}>Recent Chats</Text>

        {sessions.map((s) => (
          <Pressable
            key={s.id}
            style={styles.item}
            onPress={() => props.navigation.navigate('index', { sid: s.id })}
          >
            <Text numberOfLines={1} style={styles.title}>
              {s.title || 'New Chat'}
            </Text>
            <Text style={styles.time}>{new Date(s.updatedAt).toLocaleString()}</Text>
          </Pressable>
        ))}
      </View>
    </DrawerContentScrollView>
  );
}

const styles = StyleSheet.create({
  section: { paddingHorizontal: 14, paddingTop: 10, gap: 8 },
  newChatBtn: {
    backgroundColor: '#111827',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  newChatText: { color: '#fff', fontWeight: '700', fontSize: 14, textAlign: 'center' },
  heading: { fontSize: 13, color: '#6B7280', fontWeight: '600' },
  item: { backgroundColor: '#F3F4F6', borderRadius: 10, padding: 10 },
  title: { fontSize: 14, fontWeight: '600', color: '#111827' },
  time: { fontSize: 12, color: '#6B7280', marginTop: 2 },
});