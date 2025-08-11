export interface Feedback {
  id: string;
  userId: string;
  type: 'book-distributor' | 'temple-visit' | 'prasadam' | 'app' | 'general';
  rating: number; // 1-5
  comment: string;
  images?: string[]; // URLs to uploaded images
  submissionDate: Date;
  edited?: boolean;
  respondedTo?: boolean;
  response?: {
    adminId: string;
    text: string;
    date: Date;
  };
}