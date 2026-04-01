import { WorkoutRoutine } from "./routine-diet-types";

export interface CommunityRoutine {
  id: string;
  routine: WorkoutRoutine;
  authorId: string;
  authorName: string;
  description: string;
  downloads: number;
  rating: number;
  reviews: number;
  sharedAt: string;
  tags: string[];
}

export interface CommunityLibraryFilter {
  difficulty?: "beginner" | "intermediate" | "advanced";
  bodyPart?: string;
  searchQuery?: string;
  sortBy?: "downloads" | "rating" | "recent";
}
