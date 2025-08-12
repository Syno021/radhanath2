import { WhatsappGroup } from './whatsappGroup.model';
export interface Region {
  id: string;
  name: string;
  description?: string;
  location: {
    latitude: number;
    longitude: number;
  };
  whatsappGroups: WhatsappGroup[];
  ReadingClubs?: string[]; // Array of Reading Club IDs 
  numberoftemples?: number;
}