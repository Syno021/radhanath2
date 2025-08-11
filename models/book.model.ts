//src/app/shared/core/models/book.model.ts
export interface Book {
  id: string;                       // Unique identifier
  title: string;                    // Book title
  author: string;                   // Author's name
  image?: string;                   // Cover image URL (optional)
  description?: string;             // Short book description
  pages?: number;                   // Total page count
  publishYear?: number;            // Year of publication
  vedabaseLink?: string;           // Link to Vedabase
  rating?: number;                 // Average rating (e.g., 4.5)
  tags?: string[];                 // Relevant tags like "Bhagavad-gita", "Philosophy"
  category?: string;               // Category such as "Scripture", "Commentary"
  isFavorite?: boolean;            // Whether the book is marked as a favorite
  addedDate?: Date;                // Date the book was added to the library
  updatedDate?: Date;              // Last update date

  // Optional enhancement fields
  language?: string;               // Language (e.g., English, Hindi)
  translations?: string[];         // List of available translations
  fileSizeMB?: number;             // If downloadable, file size in MB
  format?: 'PDF' | 'EPUB' | 'HTML' | 'Scan'; // Format of the book
  audioAvailable?: boolean;        // If there's an audiobook version
  viewCount?: number;              // Times viewed/read
  downloadCount?: number;          // Times downloaded
  bookmarkedPage?: number;         // Last bookmarked page for the user
  commentsEnabled?: boolean;       // Whether comments are enabled for this book
}
