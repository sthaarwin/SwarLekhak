import React, { useEffect, useState } from 'react';
import { StyleSheet, ScrollView, Alert } from 'react-native';
import {
  ActivityIndicator,
  Button,
  Card,
  Divider,
  Surface,
  Text,
  TextInput,
  useTheme,
} from 'react-native-paper';
import { spacing } from '../theme';
import { supabase } from '../services/supabaseClient';

export default function ProfileScreen({ navigation }: any) {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  async function fetchProfile() {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user found');

      setEmail(user.email || '');

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setFullName(data.full_name || '');
      }
    } catch (err: any) {
      Alert.alert('त्रुटि', 'प्रोफाइल ल्याउन सकिएन: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    try {
      setSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user found');

      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          full_name: fullName,
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });

      if (error) throw error;

      Alert.alert('सफल', 'प्रोफाइल अद्यावधिक गरियो');
    } catch (err: any) {
      Alert.alert('त्रुटि', 'प्रोफाइल अद्यावधिक गर्न सकिएन: ' + err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleSignOut() {
    try {
      await supabase.auth.signOut();
    } catch (err: any) {
      Alert.alert('Error', 'Could not sign out: ' + err.message);
    }
  }

  if (loading) {
    return (
      <Surface style={styles.centered} elevation={0}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text variant="bodyLarge" style={{ marginTop: 12 }}>प्रोफाइल लोड हुँदैछ...</Text>
      </Surface>
    );
  }

  return (
    <Surface style={styles.container} elevation={0}>
      <ScrollView contentContainerStyle={styles.content}>
        <Card mode="elevated" elevation={1}>
          <Card.Content style={styles.form}>
            <TextInput
              label="इमेल"
              value={email}
              editable={false}
              mode="outlined"
              left={<TextInput.Icon icon="email-outline" />}
            />
            <TextInput
              label="पूरा नाम"
              value={fullName}
              onChangeText={setFullName}
              mode="outlined"
              left={<TextInput.Icon icon="account-outline" />}
            />
            <Button
              mode="contained"
              icon="content-save"
              onPress={handleSave}
              loading={saving}
              style={styles.saveButton}
            >
              प्रोफाइल सेभ गर्नुहोस्
            </Button>
          </Card.Content>
        </Card>

        <Divider style={styles.divider} />

        <Button
          mode="text"
          icon="logout"
          onPress={handleSignOut}
          textColor={theme.colors.error}
          style={styles.signOutButton}
        >
          साइन आउट
        </Button>
      </ScrollView>
    </Surface>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: spacing.containerMargin,
    paddingTop: spacing.md,
  },
  form: {
    gap: 16,
  },
  saveButton: {
    marginTop: 8,
  },
  divider: {
    marginVertical: spacing.lg,
  },
  signOutButton: {
    alignSelf: 'center',
  },
});
