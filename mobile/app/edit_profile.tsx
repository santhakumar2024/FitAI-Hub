// app/edit_profile.tsx
// Profile Modification — Mastery System

import React, { useState } from 'react';
import { 
  View, Text, ScrollView, TextInput, TouchableOpacity, 
  ActivityIndicator, Alert, StyleSheet
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { updateProfile } from '../store/slices/userSlice';
import { COLORS, FONTS, BORDER_RADIUS } from '../constants/theme';

export default function EditProfileScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const { profile, isLoading } = useSelector((s: RootState) => s.user);

  // Local state for form
  const [name, setName] = useState(profile?.name || '');
  const [age, setAge] = useState(String(profile?.age || ''));
  const [height, setHeight] = useState(String(profile?.height || ''));
  const [weight, setWeight] = useState(String(profile?.weight || ''));
  const [phone, setPhone] = useState(profile?.phone || '');
  const [goal, setGoal] = useState(profile?.goalType || 'weight_loss');
  const [timeline, setTimeline] = useState(profile?.timeline || '3_months');
  const [location, setLocation] = useState(profile?.workoutLocation || 'gym');
  const [jobNature, setJobNature] = useState(profile?.jobNature || 'sedentary');
  const [equipment, setEquipment] = useState<string[]>(
    Array.isArray(profile?.equipmentAccess) ? profile.equipmentAccess : []
  );

  const toggleEquipment = (item: string) => {
    if (equipment.includes(item)) {
      setEquipment(equipment.filter(e => e !== item));
    } else {
      setEquipment([...equipment, item]);
    }
  };

  const handleSave = async () => {
    if (!name || !age || !height || !weight) {
      Alert.alert('Incomplete', 'Please fill in all core physical metrics.');
      return;
    }

    try {
      const res = await dispatch(updateProfile({
        name,
        age: parseInt(age, 10),
        height: parseFloat(height),
        weight: parseFloat(weight),
        phone,
        goalType: goal,
        timeline,
        workoutLocation: location,
        jobNature,
        equipmentAccess: equipment
      }));

      if (updateProfile.fulfilled.match(res)) {
        Alert.alert('Success', 'Your Mastery profile has been updated.');
        router.back();
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to synchronize updates. Try again.');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>EDIT PROFILE</Text>
        <TouchableOpacity onPress={handleSave} disabled={isLoading}>
          {isLoading ? (
            <ActivityIndicator size="small" color={COLORS.primary} />
          ) : (
            <Text style={styles.saveBtn}>SAVE</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Avatar Section */}
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={40} color={COLORS.primary} />
          </View>
          <Text style={styles.changeText}>Update Mastery Photo</Text>
        </View>

        {/* Identity Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>BASIC IDENTITY</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput value={name} onChangeText={setName} style={styles.input} placeholder="Name" />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Mobile Number</Text>
            <TextInput value={phone} onChangeText={setPhone} style={styles.input} placeholder="+91..." keyboardType="phone-pad" />
          </View>
        </View>

        {/* Physical Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PHYSICAL METRICS</Text>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Age</Text>
              <TextInput value={age} onChangeText={setAge} style={styles.input} keyboardType="numeric" />
            </View>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Height (cm)</Text>
              <TextInput value={height} onChangeText={setHeight} style={styles.input} keyboardType="numeric" />
            </View>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Weight (kg)</Text>
              <TextInput value={weight} onChangeText={setWeight} style={styles.input} keyboardType="numeric" />
            </View>
          </View>
        </View>

        {/* Core Strategy Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>CORE STRATEGY</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Main Training Goal</Text>
            <View style={styles.chipRow}>
              {['weight_loss', 'muscle_gain', 'athletic_performance', 'general_health'].map((g) => (
                <TouchableOpacity key={g} onPress={() => setGoal(g)} style={[styles.chip, goal === g && styles.chipActive]}>
                  <Text style={[styles.chipText, goal === g && styles.chipTextActive]}>{g.replace(/_/g, ' ').toUpperCase()}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Target Timeline</Text>
            <View style={styles.chipRow}>
              {['1_month', '3_months', '6_months', '12_months'].map((t) => (
                <TouchableOpacity key={t} onPress={() => setTimeline(t)} style={[styles.chip, timeline === t && styles.chipActive]}>
                  <Text style={[styles.chipText, timeline === t && styles.chipTextActive]}>{t.replace(/_/g, ' ').toUpperCase()}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Training Location</Text>
            <View style={styles.chipRow}>
              {['home', 'gym', 'outdoors'].map((l) => (
                <TouchableOpacity key={l} onPress={() => setLocation(l)} style={[styles.chip, location === l && styles.chipActive]}>
                  <Text style={[styles.chipText, location === l && styles.chipTextActive]}>{l.toUpperCase()}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Lifestyle Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>LIFESTYLE & EQUIPMENT</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Job Nature</Text>
            <View style={styles.chipRow}>
              {['sedentary', 'active', 'physically_demanding'].map((j) => (
                <TouchableOpacity key={j} onPress={() => setJobNature(j)} style={[styles.chip, jobNature === j && styles.chipActive]}>
                  <Text style={[styles.chipText, jobNature === j && styles.chipTextActive]}>{j.replace(/_/g, ' ').toUpperCase()}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Equipment Access (Multi-select)</Text>
            <View style={styles.chipRow}>
              {['Dumbbells', 'Barbell', 'Resistance Bands', 'Kettlebell', 'Pull-up Bar', 'Bench', 'Full Gym'].map((e) => (
                <TouchableOpacity key={e} onPress={() => toggleEquipment(e)} style={[styles.chip, equipment.includes(e) && styles.chipActive]}>
                  <Text style={[styles.chipText, equipment.includes(e) && styles.chipTextActive]}>{e.toUpperCase()}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <TouchableOpacity onPress={handleSave} disabled={isLoading} style={styles.mainSaveBtn}>
          <Text style={styles.mainSaveText}>SAVE MASTERY UPDATES</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.textPrimary,
    letterSpacing: 1
  },
  saveBtn: {
    color: COLORS.primary,
    fontWeight: '900',
    fontSize: 14
  },
  container: {
    padding: 24,
    paddingBottom: 60
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 32
  },
  avatar: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.bg, alignItems: 'center', justifyContent: 'center', marginBottom: 12
  },
  changeText: {
    fontSize: 12, fontWeight: '800', color: COLORS.primary
  },
  section: {
    marginBottom: 32
  },
  sectionTitle: {
    fontSize: 12, fontWeight: '900', color: COLORS.textMuted, letterSpacing: 2, marginBottom: 16
  },
  inputGroup: {
    marginBottom: 24
  },
  label: {
    fontSize: 12, fontWeight: '800', color: COLORS.textSecondary, marginBottom: 12
  },
  input: {
    backgroundColor: COLORS.bg, borderRadius: 12, padding: 14, fontSize: 15, fontWeight: '700', color: COLORS.textPrimary, borderWidth: 1, borderColor: '#eee'
  },
  chipRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8
  },
  chip: {
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, backgroundColor: COLORS.bg, borderWidth: 1, borderColor: '#eee'
  },
  chipActive: {
    backgroundColor: COLORS.primary, borderColor: COLORS.primary
  },
  chipText: {
    fontSize: 10, fontWeight: '900', color: COLORS.textSecondary
  },
  chipTextActive: {
    color: 'white'
  },
  mainSaveBtn: {
    backgroundColor: COLORS.primary, padding: 20, borderRadius: 20, alignItems: 'center', marginTop: 10, shadowColor: COLORS.primary, shadowOpacity: 0.2, shadowRadius: 10, elevation: 8
  },
  mainSaveText: {
    color: 'white', fontWeight: '900', letterSpacing: 1
  }
});
