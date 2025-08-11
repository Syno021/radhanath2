//src/app/shared/core/models/user.model.ts
export interface User {
  uid: string;
  email: string;
  displayName: string;
  phoneNumber: string;
  photoURL?: string;
  region: string;
  registrationDate: Date;
  lastActive: Date;
  pushToken?: string;
  bookInterests?: string[];
  joinedGroups?: string[];
  joinedReadingClubs?: string[];
  role: 'user' | 'admin' | 'facilitator';
}