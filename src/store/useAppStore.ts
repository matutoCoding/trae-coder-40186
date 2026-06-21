import { create } from 'zustand';
import { Activity, Member, Roadbook, Checkpoint } from '@/types';
import { mockActivity, mockMembers, mockRoadbook, mockCheckpoints } from '@/data/mockData';
import { generateNodes } from '@/utils/timeCalculator';

interface AppState {
  activity: Activity;
  members: Member[];
  roadbook: Roadbook;
  setActivity: (activity: Activity) => void;
  updateActivity: (updates: Partial<Activity>) => void;
  addCheckpoint: (checkpoint: Checkpoint) => void;
  updateCheckpoint: (id: string, updates: Partial<Checkpoint>) => void;
  removeCheckpoint: (id: string) => void;
  regenerateNodes: () => void;
  addMember: (member: Member) => void;
  updateMember: (id: string, updates: Partial<Member>) => void;
  removeMember: (id: string) => void;
  updateRoadbook: (updates: Partial<Roadbook>) => void;
  publishRoadbook: () => void;
  assignCarNumbers: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  activity: {
    ...mockActivity,
    nodes: generateNodes(mockActivity),
  },
  members: mockMembers,
  roadbook: mockRoadbook,

  setActivity: (activity) => set({ activity }),

  updateActivity: (updates) => set((state) => {
    const newActivity = { ...state.activity, ...updates };
    newActivity.nodes = generateNodes(newActivity);
    return { activity: newActivity };
  }),

  addCheckpoint: (checkpoint) => set((state) => {
    const newCheckpoints = [...state.activity.checkpoints, checkpoint];
    const newActivity = { ...state.activity, checkpoints: newCheckpoints };
    newActivity.nodes = generateNodes(newActivity);
    return { activity: newActivity };
  }),

  updateCheckpoint: (id, updates) => set((state) => {
    const newCheckpoints = state.activity.checkpoints.map((cp) =>
      cp.id === id ? { ...cp, ...updates } : cp
    );
    const newActivity = { ...state.activity, checkpoints: newCheckpoints };
    newActivity.nodes = generateNodes(newActivity);
    return { activity: newActivity };
  }),

  removeCheckpoint: (id) => set((state) => {
    const newCheckpoints = state.activity.checkpoints.filter((cp) => cp.id !== id);
    const newActivity = { ...state.activity, checkpoints: newCheckpoints };
    newActivity.nodes = generateNodes(newActivity);
    return { activity: newActivity };
  }),

  regenerateNodes: () => set((state) => ({
    activity: {
      ...state.activity,
      nodes: generateNodes(state.activity),
    },
  })),

  addMember: (member) => set((state) => ({
    members: [...state.members, member],
  })),

  updateMember: (id, updates) => set((state) => ({
    members: state.members.map((m) =>
      m.id === id ? { ...m, ...updates } : m
    ),
  })),

  removeMember: (id) => set((state) => ({
    members: state.members.filter((m) => m.id !== id),
  })),

  updateRoadbook: (updates) => set((state) => ({
    roadbook: { ...state.roadbook, ...updates },
  })),

  publishRoadbook: () => set((state) => ({
    roadbook: {
      ...state.roadbook,
      published: true,
      publishedAt: new Date().toISOString(),
      shareCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
    },
  })),

  assignCarNumbers: () => set((state) => {
    const confirmedMembers = state.members
      .filter((m) => m.status === 'confirmed')
      .sort((a, b) => {
        if (a.drivingExperience === 'expert' && b.drivingExperience !== 'expert') return -1;
        if (a.drivingExperience !== 'expert' && b.drivingExperience === 'expert') return 1;
        if (a.willingTail && !b.willingTail) return 1;
        if (!a.willingTail && b.willingTail) return -1;
        return 0;
      });

    const updatedMembers = state.members.map((m) => {
      const index = confirmedMembers.findIndex((cm) => cm.id === m.id);
      if (index >= 0) {
        return {
          ...m,
          carNumber: index + 1,
          radioChannel: `CH${Math.floor(index / 3) + 1}`,
        };
      }
      return m;
    });

    const convoyOrder = confirmedMembers.map((m) => m.id);

    return {
      members: updatedMembers,
      roadbook: {
        ...state.roadbook,
        convoyOrder,
      },
    };
  }),
}));
