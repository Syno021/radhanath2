export interface WhatsappGroup {
  id: string;
  name: string;
  description: string;
  inviteLink: string;
  regionId: string;
  memberCount?: number;
  groupType: 'general' | 'book-study' | 'events' | 'seva';
}