// app/owner/assign-clients.tsx
// Client Assignments screen — Updated for multi-gym support

import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { api } from '../../utils/api';

export default function AssignClientsScreen() {
  const { colors } = useTheme();
  const { gymId } = useLocalSearchParams(); // Path parameter from dashboard

  const [members, setMembers] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState<any>(null);

  useEffect(() => {
    if (gymId) {
      fetchData();
    } else {
      Alert.alert('Error', 'No gym selected');
      router.back();
    }
  }, [gymId]);

  const fetchData = async () => {
    try {
      const [membersRes, trainersRes] = await Promise.all([
        api.get(`/gym/${gymId}/members`),
        api.get(`/gym/${gymId}/trainers`)
      ]);
      setMembers(membersRes.data.data);
      setTrainers(trainersRes.data.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      Alert.alert('Error', 'Failed to load members or trainers');
    } finally {
      setLoading(false);
    }
  };

  const assignTrainer = async (trainerId: string) => {
    if (!selectedMember || !gymId) return;
    try {
      await api.post(`/gym/${gymId}/assign-client`, {
        clientId: selectedMember.clientId,
        trainerId
      });
      Alert.alert('Success', 'Client assigned to trainer!');
      setSelectedMember(null);
      fetchData();
    } catch (error) {
      Alert.alert('Error', 'Failed to assign trainer');
    }
  };

  if (loading) return <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" color={colors.primary} /></View>;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ padding: 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 15 }}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={{ fontSize: 24, fontWeight: '900', color: colors.textPrimary }}>Client Assignments</Text>
        </View>

        {!selectedMember ? (
          <FlatList
            data={members}
            keyExtractor={(item: any) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity 
                onPress={() => setSelectedMember(item)}
                style={{ backgroundColor: colors.bgSurface, padding: 16, borderRadius: 20, marginBottom: 12, borderWidth: 1, borderColor: colors.border }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View>
                    <Text style={{ fontSize: 16, fontWeight: '700', color: colors.textPrimary }}>{item.client.name}</Text>
                    <Text style={{ fontSize: 12, color: colors.textSecondary }}>Current Trainer: {item.trainer?.name || 'Unassigned'}</Text>
                  </View>
                  <Ionicons name="swap-horizontal" size={20} color={colors.primary} />
                </View>
              </TouchableOpacity>
            )}
            ListEmptyComponent={<Text style={{ textAlign: 'center', color: colors.textMuted, marginTop: 50 }}>No gym members found.</Text>}
          />
        ) : (
          <View>
            <View style={{ backgroundColor: `${colors.primary}10`, padding: 15, borderRadius: 15, marginBottom: 20 }}>
              <Text style={{ color: colors.primary, fontWeight: '800' }}>Select trainer for {selectedMember.client.name}:</Text>
            </View>
            <FlatList
              data={trainers}
              keyExtractor={(item: any) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  onPress={() => assignTrainer(item.id)}
                  style={{ backgroundColor: colors.bgSurface, padding: 15, borderRadius: 15, marginBottom: 10, borderWidth: 1, borderColor: colors.border }}
                >
                  <Text style={{ fontSize: 16, fontWeight: '700', color: colors.textPrimary }}>{item.name}</Text>
                  <Text style={{ fontSize: 12, color: colors.textSecondary }}>{item.clientCount} active clients</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity 
              onPress={() => setSelectedMember(null)}
              style={{ padding: 15, alignItems: 'center', marginTop: 10 }}
            >
              <Text style={{ color: colors.textMuted }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
