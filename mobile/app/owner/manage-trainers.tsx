// app/owner/manage-trainers.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { api } from '../../utils/api';

export default function ManageTrainersScreen() {
  const { colors } = useTheme();
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [trainerEmail, setTrainerEmail] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetchTrainers();
  }, []);

  const fetchTrainers = async () => {
    try {
      const res = await api.get('/gym/trainers');
      setTrainers(res.data.data);
    } catch (error) {
       console.error('Failed to fetch trainers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTrainer = async () => {
    if (!trainerEmail.trim()) return;
    setAdding(true);
    try {
      await api.post('/gym/trainers', { trainerEmail });
      Alert.alert('Success', 'Trainer added to gym successfully!');
      setTrainerEmail('');
      fetchTrainers();
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Failed to add trainer';
      Alert.alert('Error', msg);
    } finally {
      setAdding(false);
    }
  };

  const removeTrainer = async (id: string) => {
    Alert.alert(
      'Remove Trainer',
      'Are you sure you want to remove this trainer from your gym?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/gym/trainers/${id}`);
              fetchTrainers();
            } catch (error) {
              Alert.alert('Error', 'Failed to remove trainer');
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ padding: 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 15 }}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={{ fontSize: 24, fontWeight: '900', color: colors.textPrimary }}>Gym Trainers</Text>
        </View>

        {/* Add Trainer Form */}
        <View style={{ marginBottom: 30 }}>
            <Text style={{ fontSize: 13, fontWeight: '800', color: colors.textSecondary, marginBottom: 10 }}>ADD NEW TRAINER BY EMAIL</Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
                <TextInput 
                    value={trainerEmail}
                    onChangeText={setTrainerEmail}
                    placeholder="trainer@example.com"
                    placeholderTextColor={colors.textMuted}
                    style={{ flex: 1, backgroundColor: colors.bgSurface, padding: 15, borderRadius: 15, color: colors.textPrimary, borderWidth: 1, borderColor: colors.border }}
                    autoCapitalize="none"
                    keyboardType="email-address"
                />
                <TouchableOpacity 
                    onPress={handleAddTrainer}
                    disabled={adding}
                    style={{ width: 55, height: 55, borderRadius: 15, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}
                >
                    {adding ? <ActivityIndicator color="white" /> : <Ionicons name="add" size={28} color="white" />}
                </TouchableOpacity>
            </View>
        </View>

        {loading ? (
          <ActivityIndicator color={colors.primary} size="large" style={{ marginTop: 50 }} />
        ) : (
          <FlatList
            data={trainers}
            keyExtractor={(item: any) => item.id}
            renderItem={({ item }) => (
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bgSurface, padding: 15, borderRadius: 20, marginBottom: 12, borderWidth: 1, borderColor: colors.border }}>
                <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                    <Ionicons name="fitness" size={20} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: colors.textPrimary }}>{item.name}</Text>
                  <Text style={{ fontSize: 12, color: colors.textSecondary }}>{item.clientCount} Assigned Clients</Text>
                </View>
                <TouchableOpacity onPress={() => removeTrainer(item.id)}>
                   <Ionicons name="trash-outline" size={20} color="#FF6B6B" />
                </TouchableOpacity>
              </View>
            )}
            ListEmptyComponent={
                <View style={{ alignItems: 'center', marginTop: 40 }}>
                    <Ionicons name="sad-outline" size={48} color={colors.textMuted} />
                    <Text style={{ color: colors.textMuted, marginTop: 10 }}>No trainers added yet.</Text>
                </View>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}
