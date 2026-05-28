export interface ItineraryDetail {
  id: string;
  time: string;
  iconName: string; // Lucide icon name string
  text: string;
  sub?: string;
  isTransport?: boolean;
}

export interface DayPlan {
  id: number;
  date: string;
  day: string;
  location: string;
  title: string;
  details: ItineraryDetail[];
}

export type UserRole = 'admin' | 'editor' | 'viewer';

export interface Collaborator {
  id: string;
  name: string;
  avatar: string;
  role: UserRole;
  email: string;
}

export interface PackingItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface PackingCategory {
  id: string;
  name: string;
  items: PackingItem[];
}

export interface Trip {
  id: string;
  name: string;
  cover: string;
  status: string;
  itinerary: DayPlan[];
  collaborators: Collaborator[];
  packingList?: Record<string, PackingCategory[]>; // userId -> categories
  expenses?: any[];
}
