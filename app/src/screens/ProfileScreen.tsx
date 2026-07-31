import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { TextInput, Button, Text, Divider } from 'react-native-paper';
import { colors, spacing } from '../theme';
import { supabase } from '../services/supabaseClient';
import { UserProfile } from '../types';

export default function ProfileScreen({ navigation }: any) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    console.log('ProfileScreen mounted');
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

      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows found"
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
      <View style={styles.centered}>
        <Text>प्रोफाइल लोड हुँदैछ...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>प्रोफाइल</Text>

        <View style={styles.section}>
          <TextInput
            label="इमेल"
            value={email}
            editable={false}
            style={styles.input}
            mode="outlined"
          />
          <TextInput
            label="पूरा नाम"
            value={fullName}
            onChangeText={setFullName}
            style={styles.input}
            mode="outlined"
          />
        </View>

        <Button
          mode="contained"
          onPress={handleSave}
          loading={saving}
          style={styles.saveButton}
        >
          प्रोफाइल सेभ गर्नुहोस्
        </Button>

        <Divider style={styles.divider} />

        <Button
          mode="text"
          onPress={handleSignOut}
          textColor={colors.error}
          style={styles.signOutButton}
        >
          साइन आउट
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.containerMargin,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.govBlueDark,
    marginBottom: 24,
    textAlign: 'center',
  },
  section: {
    gap: 16,
    marginBottom: 24,
  },
  input: {
    backgroundColor: colors.surface,
  },
  saveButton: {
    marginTop: 8,
    paddingVertical: 4,
  },
  divider: {
    marginVertical: 32,
  },
  signOutButton: {
    alignSelf: 'center',
  },
});
