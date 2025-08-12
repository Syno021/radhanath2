export interface ReadingClub {
  id: string;
  name: string;
  description: string;
  meetingType: 'online' | 'in-person' | 'hybrid';
  location?: {
    address: string;
    latitude: number;
    longitude: number;
  };
  schedule: {
    day: string;
    time: string;
    frequency: 'weekly' | 'biweekly' | 'monthly';
  };
  currentBook?: string;
  regionId: string;
  facilitator: {
    name: string;
    contact: string;
  };
  members: string[]; // User IDs
  joinRequests?: string[]; // User IDs
  ratings?: {
    userId: string;
    rating: number; // 1 to 5 stars 
  }[];
  createdAt?: Date;
  updatedAt?: Date;
}