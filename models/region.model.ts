import { WhatsappGroup } from './whatsapp-group.model';
export interface Region {
  id: string;
  name: string;
  description?: string;
  location: {
    latitude: number;
    longitude: number;
  };
  whatsappGroups: WhatsappGroup[];
  templeWebsite?: string;
  templeAddress?: string;
  templePhone?: string;
}