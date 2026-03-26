import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, Image, Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams } from 'expo-router';
import { ChatInput } from '@/components/chat/chat-input';
import { MessageBubble } from '@/components/chat/message-bubble';
import { askGeminiChat } from '@/lib/gemini';
import { createNewSession, getChatSession, saveChatSession } from '@/lib/chat-storage';
import type { ChatMessage, ChatSession } from '@/types/chat';
import { useHeaderHeight } from '@react-navigation/elements';

type Attachment = { uri: string; mimeType: string };

function makeChatTitle(input: string) {
  const t = input.trim().replace(/\s+/g, ' ');
  if (!t) return 'New Chat';
  return t.length > 42 ? `${t.slice(0, 42)}...` : t;
}

export default function ChatScreen() {
  const { sid } = useLocalSearchParams<{ sid?: string }>();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const [session, setSession] = useState<ChatSession | null>(null);
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(false);
  const [longWait, setLongWait] = useState(false);
  const language = 'auto';

const params = useLocalSearchParams<{ sid?: string; t?: string }>();

  useEffect(() => {
    let cancelled = false;

    (async () => {
      // 1) new chat explicitly requested
      if (params.sid === 'new') {
        const fresh = await createNewSession();
        if (!cancelled) setSession(fresh);
        return;
      }

      // 2) open existing chat
      if (params.sid) {
        const found = await getChatSession(params.sid);
        if (!cancelled && found) {
          setSession(found);
          return;
        }
      }

      // 3) fallback: always ensure a session exists
      const fresh = await createNewSession();
      if (!cancelled) setSession(fresh);
    })();

    return () => {
      cancelled = true;
    };
  }, [params.sid, params.t]);

  const messages = useMemo(() => session?.messages ?? [], [session]);

const pick = async (camera: boolean) => {
  const res = camera
    ? await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.7,
        base64: true,
      })
    : await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.7,
        allowsMultipleSelection: true,
        selectionLimit: 6,
        base64: true,
      });

  if (!res.canceled) {
    const next = res.assets.map((a) => ({
      uri: a.uri,
      mimeType: a.mimeType || 'image/jpeg',
      base64: a.base64 ?? undefined,
    }));
    setAttachments((prev) => [...prev, ...next]);
  }
};

  const removeAttachment = (uri: string) => {
    setAttachments((prev) => prev.filter((a) => a.uri !== uri));
  };

 const onSend = async () => {
    if (!text.trim() && attachments.length === 0) return;

    // Ensure session exists even if loading race happens
    let currentSession = session;
    if (!currentSession) {
      currentSession = await createNewSession();
      setSession(currentSession);
    }

    const userText = text.trim() || 'Analyze these images.';

    const userMsg: ChatMessage = {
      id: `${Date.now()}_u`,
      role: 'user',
      text: userText,
      imageUri: attachments[0]?.uri,
      createdAt: new Date().toISOString(),
    };

    const draftTitle =
      !currentSession.messages.length || currentSession.title === 'New Chat'
        ? makeChatTitle(userText)
        : currentSession.title;

    const next: ChatSession = {
      ...currentSession,
      title: draftTitle,
      updatedAt: new Date().toISOString(),
      messages: [...currentSession.messages, userMsg],
    };

    // immediate UI updates
    setSession(next);
    setText('');
    const sendAttachments = attachments;
    setAttachments([]);
    setLoading(true);
    setLongWait(false);
    const timer = setTimeout(() => setLongWait(true), 6000);

    try {
      await saveChatSession(next);

      const payload = await askGeminiChat({
        messages: next.messages,
        userText: userMsg.text,
        language,
        images: sendAttachments,
      });

      const botMsg: ChatMessage = {
        id: `${Date.now()}_a`,
        role: 'assistant',
        text: `${payload.shortAnswer}\n\n${payload.detailedAnswer}`,
        createdAt: new Date().toISOString(),
        payload,
      };

      const saved: ChatSession = {
        ...next,
        updatedAt: new Date().toISOString(),
        messages: [...next.messages, botMsg],
      };

      setSession(saved);
      await saveChatSession(saved);
    } finally {
      clearTimeout(timer);
      setLoading(false);
      setLongWait(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={!keyboardVisible ? styles.flexGrow : styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={headerHeight}
      >
        <FlatList
          data={messages}
          keyExtractor={(i) => i.id}
          renderItem={({ item }) => <MessageBubble msg={item} />}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={<WelcomeHeader />}
        />

        {attachments.length > 0 && (
          <View style={styles.attachmentsWrap}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.attachmentsRow}
            >
              {attachments.map((a) => (
                <View key={a.uri} style={styles.attachmentItem}>
                  <Image source={{ uri: a.uri }} style={styles.attachmentImage} />
                  <Pressable style={styles.removeBtn} onPress={() => removeAttachment(a.uri)}>
                    <Text style={styles.removeBtnText}>×</Text>
                  </Pressable>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {loading && (
          <View style={styles.loaderBox}>
            <Text style={styles.loaderText}>
              {longWait
                ? 'Still analyzing... this may take longer than expected.'
                : 'Thinking...'}
            </Text>
          </View>
        )}

        <View style={{ paddingBottom: Math.max(insets.bottom, 6) }}>
          <ChatInput
            value={text}
            onChange={setText}
            onSend={onSend}
            onCamera={() => pick(true)}
            onGallery={() => pick(false)}
            disabled={loading}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function WelcomeHeader() {
  return (
    <View style={welcomeStyles.container}>
      <Text style={welcomeStyles.title}>HalalChat Bot</Text>
      <Text style={welcomeStyles.subtitle}>
        Islamic Food & Guidance Assistant
      </Text>
      <View style={welcomeStyles.features}>
        <Text style={welcomeStyles.featureText}>📸 Scan ingredients worldwide</Text>
        <Text style={welcomeStyles.featureText}>🕌 Islamic references & evidence</Text>
        <Text style={welcomeStyles.featureText}>💬 Ask anything with authentic answers</Text>
      </View>
    </View>
  );
}

const welcomeStyles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  features: {
    gap: 12,
    marginTop: 12,
  },
  featureText: {
    fontSize: 14,
    color: '#374151',
    textAlign: 'center',
  },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  flex: { flex: 1 },
  flexGrow: { flexGrow: 1 },
  list: { paddingVertical: 12 },
  pendingImageBox: { paddingHorizontal: 12, paddingBottom: 4 },
  pendingText: { fontSize: 12, color: '#374151' },
  loaderBox: { paddingHorizontal: 12, paddingBottom: 8 },
  loaderText: { color: '#6B7280', fontSize: 12 },
    attachmentsWrap: {
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  attachmentsRow: {
    gap: 8,
    paddingVertical: 16,
  },
  attachmentItem: {
    position: 'relative',
  },
  attachmentImage: {
    width: 72,
    height: 72,
    borderRadius: 10,
    backgroundColor: '#E5E7EB',
  },
  removeBtn: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeBtnText: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 16,
    fontWeight: '700',
  },
});