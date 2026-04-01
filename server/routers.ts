import { z } from "zod";
import { COOKIE_NAME, ONE_YEAR_MS } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import { sdk } from "./_core/sdk";
import * as db from "./db";

function buildFallbackUser(profile: {
  id?: string;
  name?: string | null;
  email?: string | null;
  loginMethod?: string | null;
  openId: string;
  lastSignedIn: Date;
}) {
  return {
    id: 0,
    openId: profile.openId,
    name: profile.name ?? null,
    email: profile.email ?? null,
    loginMethod: profile.loginMethod ?? "google",
    lastSignedIn: profile.lastSignedIn.toISOString(),
  };
}

function getPersonaPrompt(input?: {
  aiPersona?: string;
  customPersonaPrompt?: string;
  gender?: string;
}) {
  if (input?.aiPersona === "data_analyst") {
    return `
- Tone: analytical and precise.
- Lead with the key conclusion, then give 2-4 evidence-based reasons.
- Use simple metrics, ranges, and tradeoffs when helpful.
- Keep the tone calm and clear, not cold.
`;
  }

  if (input?.aiPersona === "gigachad") {
    const allowed = input.gender === "male";
    return allowed
      ? `
- Tone: intense, confident, high-accountability coach.
- Use short punchy Korean with light English emphasis like "focus", "discipline", "action".
- Push the user firmly, but never demean or insult them.
- End with warm, practical encouragement and a concrete next step.
`
      : `
- Tone: confident, challenging coach.
- Use firm motivation and direct action language.
- Do not use male-only framing.
- Never demean or insult the user.
`;
  }

  if (input?.aiPersona === "custom" && input.customPersonaPrompt?.trim()) {
    return `
- Follow this custom persona guidance as long as it remains respectful and safe:
${input.customPersonaPrompt.trim()}
`;
  }

  return `
- Tone: kind, warm, encouraging mentor.
- Be supportive, practical, and easy to follow.
- Balance empathy with clear next actions.
`;
}

function buildUserProfileContext(input?: {
  name?: string;
  goal?: string;
  fitnessLevel?: string;
  age?: number;
  weight?: number;
  height?: number;
  gender?: string;
  weightUnit?: string;
  weeklyWorkoutFrequency?: number;
  workoutPreference?: string;
}) {
  if (!input) return "";

  const weightKg =
    typeof input.weight === "number" ? `${input.weight}kg` : "unknown";
  const weightOriginal =
    typeof input.weight === "number" && input.weightUnit === "lb"
      ? `${Math.round(input.weight * 2.20462)}lb entered`
      : input.weightUnit === "kg"
        ? "entered in kg"
        : "unit unknown";

  return `
User profile:
- name: ${input.name ?? "unknown"}
- goal: ${input.goal ?? "general fitness"}
- fitness level: ${input.fitnessLevel ?? "beginner"}
- age: ${input.age ?? "unknown"}
- weight: ${weightKg} (${weightOriginal})
- height: ${input.height ?? "unknown"}cm
- gender: ${input.gender ?? "unknown"}
- weekly workout frequency: ${input.weeklyWorkoutFrequency ?? "unknown"}
- preferred training style: ${input.workoutPreference ?? "mixed"}
`;
}

const AI_SYSTEM_PROMPT = `당신은 전문 AI 피트니스 트레이너입니다. 사용자의 운동, 영양, 건강에 관한 질문에 친절하고 전문적으로 답변해주세요.

답변 지침:
- 한국어로 답변하세요
- 구체적이고 실용적인 조언을 제공하세요
- 안전을 최우선으로 생각하고, 부상 위험이 있는 경우 경고하세요
- 개인의 체력 수준과 목표를 고려하세요
- 필요한 경우 의사나 전문가 상담을 권유하세요
- 답변은 간결하고 명확하게 작성하세요 (200자 이내로 핵심만)
- 마크다운 형식을 사용해도 됩니다`;

const ROUTINE_GENERATION_PROMPT = `당신은 전문 피트니스 코치입니다. 사용자의 신체 정보와 목표에 맞는 운동 루틴을 JSON 형식으로 생성해주세요.

반드시 다음 JSON 형식으로 응답하세요:
{
  "name": "루틴 이름",
  "description": "루틴 설명",
  "goal": "운동 목표",
  "difficulty": "난이도 (초급/중급/고급)",
  "durationWeeks": 4,
  "daysPerWeek": 3,
  "dailyWorkouts": [
    {
      "day": "월요일",
      "exercises": [
        {
          "name": "운동명",
          "sets": 3,
          "reps": 10,
          "restTime": 60,
          "notes": "설명"
        }
      ],
      "totalDuration": 45,
      "totalCalories": 300
    }
  ],
  "totalCaloriesBurn": 1200,
  "notes": "추가 조언"
}

사용자 정보를 고려하여 현실적이고 달성 가능한 루틴을 만드세요.`;

const ROUTINE_RECOMMENDATION_PROMPT = `당신은 전문 피트니스 코치입니다. 사용자의 운동 목표, 체력 수준, 가능한 운동 빈도에 맞는 최고의 루틴을 추천해주세요.

반드시 다음 JSON 형식으로 응답하세요:
{
  "id": "추천ID",
  "name": "루틴 이름",
  "description": "왜 이 루틴이 사용자에게 맞는지 설명",
  "goal": "운동 목표",
  "difficulty": "난이도",
  "durationWeeks": 4,
  "daysPerWeek": 3,
  "dailyWorkouts": [
    {
      "day": "월요일",
      "exercises": [
        {
          "name": "운동명",
          "sets": 3,
          "reps": 10,
          "restTime": 60
        }
      ]
    }
  ],
  "totalCaloriesBurn": 1200,
  "tips": ["팁1", "팁2"],
  "estimatedResults": {
    "weightChange": "2-3kg 감량",
    "muscleGain": "근력 20% 증가",
    "timeframe": "4주"
  }
}

사용자의 목표와 체력 수준을 고려하여 현실적이고 효과적인 루틴을 추천하세요.`;

const DIET_GENERATION_PROMPT = `당신은 전문 영양사입니다. 사용자의 신체 정보와 목표에 맞는 식단을 JSON 형식으로 생성해주세요.

반드시 다음 JSON 형식으로 응답하세요:
{
  "name": "식단 계획명",
  "description": "식단 설명",
  "goal": "식단 목표",
  "durationDays": 7,
  "dailyCalories": 2000,
  "macros": {
    "protein": 150,
    "carbs": 200,
    "fat": 65
  },
  "meals": [
    {
      "name": "아침",
      "time": "07:00",
      "foods": [
        {
          "name": "음식명",
          "quantity": "1인분",
          "calories": 300,
          "protein": 20,
          "carbs": 40,
          "fat": 10
        }
      ],
      "totalCalories": 300,
      "totalProtein": 20,
      "totalCarbs": 40,
      "totalFat": 10
    }
  ],
  "notes": "추가 조언"
}

사용자의 목표(체중 감량/근육 증가)와 신체 정보를 고려하여 현실적인 식단을 만드세요.`;

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
    loginWithGoogle: publicProcedure
      .input(z.object({
        accessToken: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        try {
          const allowedClientIds = [
            process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
            process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
            process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
            process.env.GOOGLE_CLIENT_ID,
          ].filter((value): value is string => Boolean(value));

          if (allowedClientIds.length === 0) {
            return { success: false, error: 'Google client ID not configured' };
          }

          const tokenInfoResponse = await fetch(
            "https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=" + input.accessToken
          );
          const tokenInfo = await tokenInfoResponse.json();
          if (!tokenInfoResponse.ok || tokenInfo.error) {
            return { success: false, error: 'Invalid token' };
          }
          const tokenAudience = tokenInfo.issued_to || tokenInfo.audience;
          if (!tokenAudience || !allowedClientIds.includes(tokenAudience)) {
            return { success: false, error: 'Token not issued for this app' };
          }

          const profileResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
            headers: {
              Authorization: `Bearer ${input.accessToken}`,
            },
          });
          const profile = await profileResponse.json();

          if (!profileResponse.ok || !profile.id || !profile.email) {
            return { success: false, error: "Failed to fetch Google profile" };
          }

          const openId = `google:${profile.id}`;
          const lastSignedIn = new Date();

          await db.upsertUser({
            openId,
            name: profile.name || null,
            email: profile.email || null,
            loginMethod: "google",
            lastSignedIn,
          });

          const user = await db.getUserByOpenId(openId);
          const resolvedUser =
            user ??
            buildFallbackUser({
              openId,
              name: profile.name || null,
              email: profile.email || null,
              loginMethod: "google",
              lastSignedIn,
            });

          const sessionToken = await sdk.createSessionToken(openId, {
            name: profile.name || "",
            expiresInMs: ONE_YEAR_MS,
          });

          const cookieOptions = getSessionCookieOptions(ctx.req);
          ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

          return {
            success: true,
            sessionToken,
            user: {
              id: resolvedUser.id,
              openId: resolvedUser.openId,
              name: resolvedUser.name,
              email: resolvedUser.email,
              loginMethod: resolvedUser.loginMethod,
              lastSignedIn:
                typeof resolvedUser.lastSignedIn === "string"
                  ? resolvedUser.lastSignedIn
                  : resolvedUser.lastSignedIn.toISOString(),
            },
          };
        } catch (error) {
          console.error("Google login failed:", error);
          return {
            success: false,
            error: error instanceof Error ? error.message : "Google login failed",
          };
        }
      }),
  }),

  aiTrainer: router({
    chat: publicProcedure
      .input(
        z.object({
          messages: z.array(
            z.object({
              role: z.enum(["user", "assistant"]),
              content: z.string(),
            })
          ),
          userProfile: z
            .object({
              name: z.string().optional(),
              goal: z.string().optional(),
              fitnessLevel: z.string().optional(),
              age: z.number().optional(),
              weight: z.number().optional(),
              height: z.number().optional(),
              gender: z.string().optional(),
              weightUnit: z.string().optional(),
              weeklyWorkoutFrequency: z.number().optional(),
              workoutPreference: z.string().optional(),
              aiPersona: z.string().optional(),
              customPersonaPrompt: z.string().optional(),
            })
            .optional(),
        })
      )
      .mutation(async ({ input }) => {
        const profileContext = input.userProfile
          ? `\n사용자 정보: 이름=${input.userProfile.name ?? "미설정"}, 목표=${input.userProfile.goal ?? "일반"}, 체력수준=${input.userProfile.fitnessLevel ?? "초급"}, 나이=${input.userProfile.age ?? "미설정"}, 몸무게=${input.userProfile.weight ?? "미설정"}kg, 키=${input.userProfile.height ?? "미설정"}cm`
          : "";

        const personaPrompt = getPersonaPrompt(input.userProfile);


        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: AI_SYSTEM_PROMPT + personaPrompt + profileContext,
            },
            ...input.messages.map((m) => ({
              role: m.role as "user" | "assistant",
              content: m.content,
            })),
          ],
        });

        const content = response.choices?.[0]?.message?.content ?? "죄송합니다, 응답을 생성할 수 없었습니다.";
        return { content };
      }),
  }),

  personalization: router({
    generateRoutine: publicProcedure
      .input(
        z.object({
          age: z.number(),
          weight: z.number(),
          height: z.number(),
          goal: z.string(),
          fitnessLevel: z.string(),
          daysPerWeek: z.number().min(1).max(7),
          preferredExercises: z.array(z.string()).optional(),
        })
      )
      .mutation(async ({ input }) => {
        const bmi = input.weight / Math.pow(input.height / 100, 2);
        const userContext = `
사용자 프로필:
- 나이: ${input.age}세
- 체중: ${input.weight}kg
- 키: ${input.height}cm
- BMI: ${bmi.toFixed(1)}
- 목표: ${input.goal}
- 체력 수준: ${input.fitnessLevel}
- 주당 운동 가능 일수: ${input.daysPerWeek}일
${input.preferredExercises ? `- 선호 운동: ${input.preferredExercises.join(", ")}` : ""}
`;


        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: ROUTINE_GENERATION_PROMPT,
            },
            {
              role: "user",
              content: userContext,
            },
          ],
          response_format: { type: "json_object" },
        });

        const content = String(response.choices?.[0]?.message?.content ?? "{}");
        const routine = JSON.parse(content);
        return routine;
      }),

    generateDiet: publicProcedure
      .input(
        z.object({
          age: z.number(),
          weight: z.number(),
          height: z.number(),
          goal: z.string(),
          activityLevel: z.enum(["sedentary", "light", "moderate", "active", "veryActive"]),
          dietaryRestrictions: z.array(z.string()).optional(),
        })
      )
      .mutation(async ({ input }) => {
        // Calculate TDEE (Total Daily Energy Expenditure)
        const bmi = input.weight / Math.pow(input.height / 100, 2);
        const activityMultipliers: Record<string, number> = {
          sedentary: 1.2,
          light: 1.375,
          moderate: 1.55,
          active: 1.725,
          veryActive: 1.9,
        };
        const bmr = input.weight < 60 ? 655 + 9.6 * input.weight + 1.8 * input.height - 4.7 * input.age : 88 + 13.4 * input.weight + 4.8 * input.height - 5.7 * input.age;
        const tdee = bmr * activityMultipliers[input.activityLevel];

        const userContext = `
사용자 프로필:
- 나이: ${input.age}세
- 체중: ${input.weight}kg
- 키: ${input.height}cm
- BMI: ${bmi.toFixed(1)}
- 목표: ${input.goal}
- 활동 수준: ${input.activityLevel}
- 추정 일일 칼로리 소비: ${Math.round(tdee)}kcal
${input.dietaryRestrictions ? `- 식이 제한: ${input.dietaryRestrictions.join(", ")}` : ""}
`;

        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: DIET_GENERATION_PROMPT,
            },
            {
              role: "user",
              content: userContext,
            },
          ],
          response_format: { type: "json_object" },
        });

        const content = String(response.choices?.[0]?.message?.content ?? "{}");
        const diet = JSON.parse(content);
        return diet;
      }),
    recommendRoutine: publicProcedure
      .input(
        z.object({
          age: z.number(),
          weight: z.number(),
          height: z.number(),
          goal: z.string(),
          fitnessLevel: z.string(),
          daysPerWeek: z.number().min(1).max(7),
          durationWeeks: z.number().min(1).max(12).optional(),
          equipment: z.enum(["gym", "home", "both"]).optional(),
          gender: z.string().optional(),
          weightUnit: z.string().optional(),
          weeklyWorkoutFrequency: z.number().min(0).max(7).optional(),
          workoutPreference: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const bmi = input.weight / Math.pow(input.height / 100, 2);
        const userContext = `
사용자 프로필:
- 나이: ${input.age}세
- 체중: ${input.weight}kg
- 키: ${input.height}cm
- BMI: ${bmi.toFixed(1)}
- 운동 목표: ${input.goal}
- 체력 수준: ${input.fitnessLevel}
- 주당 운동 빈도: ${input.daysPerWeek}일
- 선호 운동 기간: ${input.durationWeeks ?? 4}주
- 사용 가능 장비: ${input.equipment ?? "all"}
`;

        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: ROUTINE_RECOMMENDATION_PROMPT,
            },
            {
              role: "user",
              content:
                userContext +
                `\nAdditional onboarding context:` +
                `\n- weight detail: ${
                  input.weightUnit === "lb"
                    ? `${input.weight}kg (originally entered in pounds)`
                    : `${input.weight}kg`
                }` +
                `\n- gender: ${input.gender ?? "unknown"}` +
                `\n- usual weekly frequency: ${input.weeklyWorkoutFrequency ?? input.daysPerWeek}` +
                `\n- preferred workout style: ${input.workoutPreference ?? "mixed"}` +
                `\nMake the recommendation strongly reflect the preferred style and realistic frequency.`,
            },
          ],
          response_format: { type: "json_object" },
        });

        const content = String(response.choices?.[0]?.message?.content ?? "{}");
        const recommendation = JSON.parse(content);
        return recommendation;
      }),
  }),
  
  // Cloud Sync APIs
  sync: router({
    // Get all user data for sync
    getAllUserData: protectedProcedure.query(async ({ ctx }) => {
      const goals = await db.getUserExerciseGoals(ctx.user.id);
      const records = await db.getUserExerciseRecords(ctx.user.id);
      const personalRecords = await db.getUserPersonalRecords(ctx.user.id);
      const customExercises = await db.getUserCustomExercises(ctx.user.id);
      
      return {
        goals,
        records,
        personalRecords,
        customExercises,
      };
    }),
    
    // Sync exercise goals
    syncExerciseGoals: protectedProcedure
      .input(z.array(z.object({
        exerciseId: z.string(),
        exerciseName: z.string(),
        goalType: z.enum(["reps", "weight", "duration", "frequency"]),
        targetValue: z.number(),
        currentValue: z.number(),
        unit: z.string(),
        period: z.enum(["weekly", "monthly", "yearly"]),
        status: z.enum(["active", "completed", "abandoned"]),
        startDate: z.string(),
        endDate: z.string().optional(),
      })))
      .mutation(async ({ ctx, input }) => {
        // Clear existing goals and insert new ones
        const existingGoals = await db.getUserExerciseGoals(ctx.user.id);
        for (const goal of existingGoals) {
          await db.deleteExerciseGoal(goal.id);
        }
        
        for (const goal of input) {
          await db.createExerciseGoal({
            userId: ctx.user.id,
            ...goal,
          });
        }
        
        return { success: true };
      }),
    
    // Sync exercise records
    syncExerciseRecords: protectedProcedure
      .input(z.array(z.object({
        exerciseId: z.string(),
        exerciseName: z.string(),
        sets: z.number(),
        reps: z.number(),
        weight: z.number().optional(),
        duration: z.number().optional(),
        notes: z.string().optional(),
        recordedAt: z.date(),
      })))
      .mutation(async ({ ctx, input }) => {
        for (const record of input) {
          await db.createExerciseRecord({
            userId: ctx.user.id,
            ...record,
          });
        }
        
        return { success: true };
      }),
    
    // Sync custom exercises
    syncCustomExercises: protectedProcedure
      .input(z.array(z.object({
        exerciseId: z.string(),
        name: z.string(),
        description: z.string().optional(),
        muscleGroup: z.string().optional(),
        difficulty: z.enum(["beginner", "intermediate", "advanced"]).optional(),
        youtubeVideoId: z.string().optional(),
      })))
      .mutation(async ({ ctx, input }) => {
        // Clear existing custom exercises and insert new ones
        const existingExercises = await db.getUserCustomExercises(ctx.user.id);
        for (const exercise of existingExercises) {
          await db.deleteCustomExercise(exercise.id);
        }
        
        for (const exercise of input) {
          await db.createCustomExercise({
            userId: ctx.user.id,
            ...exercise,
          });
        }
        
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
