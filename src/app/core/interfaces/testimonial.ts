export interface Testimonial {
  id: number;
  name: string;
  role: string;
  quote: string;
  avatar: string | null;
  videoUrl?: string | null;
  stars: number;
  displayOrder?: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}
