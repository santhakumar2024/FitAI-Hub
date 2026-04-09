import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

async function test() {
  try {
    // 1. Login to get token
    console.log('Logging in...');
    const loginRes = await api.post('/auth/login', {
      email: 'santhakumarstorage0401@gmail.com',
      password: 'Santha02@',
    });
    const token = loginRes.data.data.token;
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    console.log('Token received.');

    // 2. Try generate plan
    console.log('Requesting generation...');
    const res = await api.post('/ai/generate-plan', {
      age: 24,
      gender: 'male',
      height: 178,
      weight: 90,
      activityLevel: 'moderately_active',
      medicalConditions: [],
      goals: [],
      preferences: [],
      durationDays: 7,
    });
    console.log('Success!', JSON.stringify(res.data, null, 2));
  } catch (err: any) {
    console.error('Error:', err.response?.status, err.response?.data || err.message);
  }
}

test();
