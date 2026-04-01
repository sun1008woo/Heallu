import AsyncStorage from "@react-native-async-storage/async-storage";
import { CommunityRoutine, CommunityLibraryFilter } from "./community-library-types";

const COMMUNITY_ROUTINES_KEY = "community_routines";

// 샘플 커뮤니티 루틴 데이터
const SAMPLE_COMMUNITY_ROUTINES: CommunityRoutine[] = [
  {
    id: "comm_1",
    routine: {
      id: "routine_1",
      name: "초급자 전신 운동",
      description: "초급자를 위한 기초 전신 운동 루틴입니다.",
      goal: "general",
      difficulty: "beginner",
      durationWeeks: 4,
      daysPerWeek: 3,
      dailyWorkouts: [
        {
          day: "월",
          exercises: [
            { exerciseId: "1", name: "Push-up", sets: 3, reps: 10, restTime: 60, notes: "" },
            { exerciseId: "2", name: "Bodyweight Squat", sets: 3, reps: 15, restTime: 60, notes: "" },
            { exerciseId: "3", name: "Plank", sets: 3, reps: 30, restTime: 45, notes: "" },
          ],
          totalDuration: 30,
          totalCalories: 150,
        },
        {
          day: "수",
          exercises: [
            { exerciseId: "4", name: "Lunge", sets: 3, reps: 12, restTime: 60, notes: "" },
            { exerciseId: "5", name: "Mountain Climber", sets: 3, reps: 20, restTime: 45, notes: "" },
            { exerciseId: "6", name: "Leg Raise", sets: 3, reps: 10, restTime: 60, notes: "" },
          ],
          totalDuration: 30,
          totalCalories: 160,
        },
        {
          day: "금",
          exercises: [
            { exerciseId: "1", name: "Push-up", sets: 3, reps: 10, restTime: 60, notes: "" },
            { exerciseId: "2", name: "Bodyweight Squat", sets: 3, reps: 15, restTime: 60, notes: "" },
            { exerciseId: "3", name: "Plank", sets: 3, reps: 30, restTime: 45, notes: "" },
          ],
          totalDuration: 30,
          totalCalories: 150,
        },
      ],
      totalCaloriesBurn: 460,
      notes: "초급자용 루틴",
    },
    authorId: "user_1",
    authorName: "피트니스 코치 A",
    description: "초급자를 위한 기초 전신 운동 루틴입니다.",
    downloads: 245,
    rating: 4.5,
    reviews: 32,
    sharedAt: "2026-03-25",
    tags: ["초급", "전신", "맨몸"],
  },
  {
    id: "comm_2",
    routine: {
      id: "routine_2",
      name: "가슴 집중 운동",
      description: "가슴 근육 발달을 위한 중급 루틴입니다.",
      goal: "muscle_gain",
      difficulty: "intermediate",
      durationWeeks: 4,
      daysPerWeek: 4,
      dailyWorkouts: [
        {
          day: "월",
          exercises: [
            { exerciseId: "10", name: "Bench Press", sets: 4, reps: 8, restTime: 90, notes: "" },
            { exerciseId: "11", name: "Dumbbell Fly", sets: 3, reps: 10, restTime: 75, notes: "" },
            { exerciseId: "1", name: "Push-up", sets: 3, reps: 12, restTime: 60, notes: "" },
          ],
          totalDuration: 45,
          totalCalories: 250,
        },
        {
          day: "화",
          exercises: [
            { exerciseId: "12", name: "Incline Bench Press", sets: 4, reps: 8, restTime: 90, notes: "" },
            { exerciseId: "13", name: "Chest Press", sets: 3, reps: 10, restTime: 75, notes: "" },
            { exerciseId: "14", name: "Dips", sets: 3, reps: 8, restTime: 90, notes: "" },
          ],
          totalDuration: 45,
          totalCalories: 260,
        },
        {
          day: "목",
          exercises: [
            { exerciseId: "15", name: "Barbell Row", sets: 4, reps: 8, restTime: 90, notes: "" },
            { exerciseId: "16", name: "Dumbbell Row", sets: 3, reps: 10, restTime: 75, notes: "" },
            { exerciseId: "17", name: "Seated Row", sets: 3, reps: 10, restTime: 75, notes: "" },
          ],
          totalDuration: 45,
          totalCalories: 240,
        },
        {
          day: "금",
          exercises: [
            { exerciseId: "18", name: "Pec Deck Fly", sets: 3, reps: 12, restTime: 60, notes: "" },
            { exerciseId: "19", name: "Dumbbell Press", sets: 3, reps: 10, restTime: 75, notes: "" },
            { exerciseId: "20", name: "Burpee", sets: 3, reps: 10, restTime: 60, notes: "" },
          ],
          totalDuration: 40,
          totalCalories: 220,
        },
      ],
      totalCaloriesBurn: 970,
      notes: "가슴 근육 발달용 루틴",
    },
    authorId: "user_2",
    authorName: "피트니스 코치 B",
    description: "가슴 근육 발달을 위한 중급 루틴입니다.",
    downloads: 189,
    rating: 4.7,
    reviews: 28,
    sharedAt: "2026-03-24",
    tags: ["중급", "가슴", "헬스장"],
  },
  {
    id: "comm_3",
    routine: {
      id: "routine_3",
      name: "HIIT 고강도 운동",
      description: "고강도 인터벌 트레이닝으로 빠른 체중 감량을 원하는 분들을 위한 루틴입니다.",
      goal: "weight_loss",
      difficulty: "advanced",
      durationWeeks: 2,
      daysPerWeek: 4,
      dailyWorkouts: [
        {
          day: "월",
          exercises: [
            { exerciseId: "20", name: "Burpee", sets: 4, reps: 15, restTime: 30, notes: "" },
            { exerciseId: "21", name: "Jump Rope", sets: 4, reps: 30, restTime: 30, notes: "" },
            { exerciseId: "5", name: "Mountain Climber", sets: 4, reps: 20, restTime: 30, notes: "" },
          ],
          totalDuration: 20,
          totalCalories: 300,
        },
        {
          day: "화",
          exercises: [
            { exerciseId: "22", name: "Running", sets: 1, reps: 20, duration: 20, restTime: 0, notes: "" },
            { exerciseId: "23", name: "Cycling", sets: 1, reps: 20, duration: 20, restTime: 0, notes: "" },
            { exerciseId: "24", name: "HIIT", sets: 4, reps: 30, restTime: 30, notes: "" },
          ],
          totalDuration: 25,
          totalCalories: 350,
        },
        {
          day: "목",
          exercises: [
            { exerciseId: "20", name: "Burpee", sets: 4, reps: 15, restTime: 30, notes: "" },
            { exerciseId: "21", name: "Jump Rope", sets: 4, reps: 30, restTime: 30, notes: "" },
            { exerciseId: "25", name: "Rowing", sets: 1, reps: 20, duration: 20, restTime: 0, notes: "" },
          ],
          totalDuration: 25,
          totalCalories: 330,
        },
        {
          day: "금",
          exercises: [
            { exerciseId: "22", name: "Running", sets: 1, reps: 20, duration: 20, restTime: 0, notes: "" },
            { exerciseId: "24", name: "HIIT", sets: 4, reps: 30, restTime: 30, notes: "" },
            { exerciseId: "26", name: "Stair Climber", sets: 1, reps: 20, duration: 20, restTime: 0, notes: "" },
          ],
          totalDuration: 25,
          totalCalories: 340,
        },
      ],
      totalCaloriesBurn: 1320,
      notes: "고강도 유산소 루틴",
    },
    authorId: "user_3",
    authorName: "피트니스 코치 C",
    description: "고강도 인터벌 트레이닝으로 빠른 체중 감량을 원하는 분들을 위한 루틴입니다.",
    downloads: 156,
    rating: 4.6,
    reviews: 24,
    sharedAt: "2026-03-23",
    tags: ["고급", "유산소", "HIIT"],
  },
];

export async function getCommunityRoutines(
  filter?: CommunityLibraryFilter
): Promise<CommunityRoutine[]> {
  try {
    const stored = await AsyncStorage.getItem(COMMUNITY_ROUTINES_KEY);
    let routines: CommunityRoutine[] = stored ? JSON.parse(stored) : SAMPLE_COMMUNITY_ROUTINES;

    if (!filter) return routines;

    // 검색 필터링
    if (filter.searchQuery) {
      const query = filter.searchQuery.toLowerCase();
      routines = routines.filter(
        (r) =>
          r.routine.name.toLowerCase().includes(query) ||
          r.description.toLowerCase().includes(query) ||
          r.authorName.toLowerCase().includes(query)
      );
    }

    // 난이도 필터링
    if (filter.difficulty) {
      routines = routines.filter((r) => r.routine.difficulty === filter.difficulty);
    }

    // 정렬
    if (filter.sortBy === "downloads") {
      routines.sort((a, b) => b.downloads - a.downloads);
    } else if (filter.sortBy === "rating") {
      routines.sort((a, b) => b.rating - a.rating);
    } else if (filter.sortBy === "recent") {
      routines.sort((a, b) => new Date(b.sharedAt).getTime() - new Date(a.sharedAt).getTime());
    }

    return routines;
  } catch (error) {
    console.error("Failed to get community routines:", error);
    return SAMPLE_COMMUNITY_ROUTINES;
  }
}

export async function downloadRoutine(routine: CommunityRoutine): Promise<void> {
  try {
    // 다운로드 수 증가
    const routines = await getCommunityRoutines();
    const updated = routines.map((r) =>
      r.id === routine.id ? { ...r, downloads: r.downloads + 1 } : r
    );
    await AsyncStorage.setItem(COMMUNITY_ROUTINES_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error("Failed to download routine:", error);
  }
}

export async function addCommunityRoutine(routine: CommunityRoutine): Promise<void> {
  try {
    const routines = await getCommunityRoutines();
    routines.push(routine);
    await AsyncStorage.setItem(COMMUNITY_ROUTINES_KEY, JSON.stringify(routines));
  } catch (error) {
    console.error("Failed to add community routine:", error);
  }
}
