export interface Profile {
  id: string;
  name: string;
  age: number;
  photos: any[];
  prompts: { question: string; answer: string }[];
  hometown: string;
  job: string;
  company: string;
  school: string;
  neighborhood: string;
  height: string;
  religion: string;
  ethnicity: string;
  gender?: 'male' | 'female';
  isReferred?: boolean;
  referredBy?: string;
  verified?: boolean;
}

export interface ChatThread {
  id: string;
  type: 'dm' | 'group';
  participants: string[];
  participantNames: string[];
  participantPhotos: any[];
  lastMessage: string;
  lastMessageTime: string;
  unread: number;
  messages: ChatMessage[];
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
  type?: 'text' | 'referral';
  referredProfileId?: string;
  referredProfileName?: string;
}

export interface Connection {
  id: string;
  name: string;
  photo: any;
  tag: string;
}

export interface MissedConnection {
  id: string;
  name: string;
  age: number;
  photo: any;
  venue: string;
  mutuals: number;
  timeAgo: string;
}

export interface Venue {
  id: string;
  name: string;
  category: 'restaurant' | 'bar' | 'club' | 'activity' | 'coffee' | 'dessert' | 'other';
  latitude: number;
  longitude: number;
  rating: number;
  deal: string;
  dealValue: string;
  tags: string[];
  description: string;
  photo: string;
  address: string;
  addedBy?: string;
  notes?: string;
}

export interface Filters {
  distance: number;
  city: string;
  ethnicities: string[];
  religions: string[];
  ageRange: [number, number];
  heightRange: [number, number];
}

export interface Referral {
  profileId: string;
  friendId: string;
  friendName: string;
  timestamp: string;
}

export interface MessageRequest {
  id: string;
  fromProfileId: string;
  toProfileId: string;
  message: string;
  venueName?: string;
  timestamp: string;
  status: 'pending' | 'accepted' | 'declined';
}
