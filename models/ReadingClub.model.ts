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
  currentBookId?: string; // Changed from currentBook to currentBookId (Book ID)
  regionId: string;
  groupIds: string; // Changed from group to groupIds (WhatsApp Group IDs array)
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