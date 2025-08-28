import { http, HttpResponse } from 'msw';

const API_BASE = process.env.EXPO_PUBLIC_BACKEND_URL || 'https://duo-fitness.preview.emergentagent.com';

// Mock data
const mockUsers = {
  alex: {
    id: '1',
    email: 'alex@example.com',
    name: 'Alex Johnson',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  sam: {
    id: '2', 
    email: 'sam@example.com',
    name: 'Sam Wilson',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
};

const mockTokens = {
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
  token_type: 'bearer',
};

const mockWorkoutTemplates = [
  {
    id: '1',
    name: 'Push Day',
    description: 'Chest, shoulders, triceps',
    exercises: [
      { name: 'Bench Press', sets: 3, reps: 10, weight: 135 },
      { name: 'Shoulder Press', sets: 3, reps: 12, weight: 65 },
    ],
    is_system: false,
    created_by: '1',
    created_at: '2024-01-01T00:00:00Z',
  },
];

const mockHabits = [
  {
    id: '1',
    name: 'Drink Water',
    description: 'Drink 8 glasses of water daily',
    cadence: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
    reminder_time: '09:00',
    created_by: '1',
    created_at: '2024-01-01T00:00:00Z',
  },
];

export const handlers = [
  // Auth endpoints
  http.post(`${API_BASE}/api/auth/login`, async ({ request }) => {
    const body = await request.json() as { email: string; password: string };
    
    if (body.email === 'alex@example.com' && body.password === 'password123') {
      return HttpResponse.json({
        ...mockTokens,
        user: mockUsers.alex,
      });
    }
    
    if (body.email === 'sam@example.com' && body.password === 'password123') {
      return HttpResponse.json({
        ...mockTokens,
        user: mockUsers.sam,
      });
    }
    
    return HttpResponse.json(
      { detail: 'Invalid credentials' },
      { status: 401 }
    );
  }),

  http.post(`${API_BASE}/api/auth/register`, async ({ request }) => {
    const body = await request.json() as { email: string; password: string; name: string };
    
    return HttpResponse.json({
      ...mockTokens,
      user: {
        id: '3',
        email: body.email,
        name: body.name,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    });
  }),

  http.post(`${API_BASE}/api/auth/refresh`, () => {
    return HttpResponse.json(mockTokens);
  }),

  http.get(`${API_BASE}/api/users/me`, () => {
    return HttpResponse.json(mockUsers.alex);
  }),

  // Workout endpoints
  http.get(`${API_BASE}/api/workout-templates`, () => {
    return HttpResponse.json(mockWorkoutTemplates);
  }),

  http.post(`${API_BASE}/api/workout-templates`, async ({ request }) => {
    const body = await request.json() as any;
    
    const newTemplate = {
      id: Date.now().toString(),
      ...body,
      is_system: false,
      created_by: '1',
      created_at: new Date().toISOString(),
    };
    
    return HttpResponse.json(newTemplate);
  }),

  http.post(`${API_BASE}/api/workout-sessions`, async ({ request }) => {
    const body = await request.json() as any;
    
    const newSession = {
      id: Date.now().toString(),
      ...body,
      start_time: new Date().toISOString(),
      end_time: null,
      exercises: [],
      created_by: '1',
      created_at: new Date().toISOString(),
    };
    
    return HttpResponse.json(newSession);
  }),

  http.get(`${API_BASE}/api/workout-stats/weekly`, () => {
    return HttpResponse.json({
      weekly: {
        sessions_count: 3,
        total_duration: 180,
        total_volume: 5000,
        avg_session_duration: 60,
      },
    });
  }),

  // Habit endpoints
  http.get(`${API_BASE}/api/habits`, () => {
    return HttpResponse.json(mockHabits);
  }),

  http.post(`${API_BASE}/api/habits`, async ({ request }) => {
    const body = await request.json() as any;
    
    const newHabit = {
      id: Date.now().toString(),
      ...body,
      created_by: '1',
      created_at: new Date().toISOString(),
    };
    
    return HttpResponse.json(newHabit);
  }),

  http.post(`${API_BASE}/api/habits/:id/logs`, async ({ params, request }) => {
    const body = await request.json() as any;
    
    const newLog = {
      id: Date.now().toString(),
      habit_id: params.id,
      ...body,
      created_by: '1',
      created_at: new Date().toISOString(),
    };
    
    return HttpResponse.json(newLog);
  }),

  // Couple endpoints
  http.get(`${API_BASE}/api/couples`, () => {
    return HttpResponse.json([]);
  }),

  http.post(`${API_BASE}/api/couples`, async ({ request }) => {
    const body = await request.json() as any;
    
    const newCouple = {
      id: Date.now().toString(),
      ...body,
      created_by: '1',
      created_at: new Date().toISOString(),
    };
    
    return HttpResponse.json(newCouple);
  }),

  // Health check
  http.get(`${API_BASE}/api/health`, () => {
    return HttpResponse.json({ status: 'healthy' });
  }),
];