import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Exercise Goals table - 사용자의 운동 목표
 */
export const exerciseGoals = mysqlTable("exerciseGoals", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  exerciseId: varchar("exerciseId", { length: 255 }).notNull(),
  exerciseName: varchar("exerciseName", { length: 255 }).notNull(),
  goalType: mysqlEnum("goalType", ["reps", "weight", "duration", "frequency"]).notNull(),
  targetValue: int("targetValue").notNull(),
  currentValue: int("currentValue").default(0).notNull(),
  unit: varchar("unit", { length: 50 }).notNull(),
  period: mysqlEnum("period", ["weekly", "monthly", "yearly"]).notNull(),
  status: mysqlEnum("status", ["active", "completed", "abandoned"]).default("active").notNull(),
  startDate: varchar("startDate", { length: 10 }).notNull(),
  endDate: varchar("endDate", { length: 10 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ExerciseGoal = typeof exerciseGoals.$inferSelect;
export type InsertExerciseGoal = typeof exerciseGoals.$inferInsert;

/**
 * Exercise Records table - 사용자의 운동 수행 기록
 */
export const exerciseRecords = mysqlTable("exerciseRecords", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  exerciseId: varchar("exerciseId", { length: 255 }).notNull(),
  exerciseName: varchar("exerciseName", { length: 255 }).notNull(),
  sets: int("sets").notNull(),
  reps: int("reps").notNull(),
  weight: int("weight"),
  duration: int("duration"),
  notes: text("notes"),
  recordedAt: timestamp("recordedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ExerciseRecord = typeof exerciseRecords.$inferSelect;
export type InsertExerciseRecord = typeof exerciseRecords.$inferInsert;

/**
 * Personal Records (PR) table - 사용자의 개인 최고 기록
 */
export const personalRecords = mysqlTable("personalRecords", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  exerciseId: varchar("exerciseId", { length: 255 }).notNull(),
  exerciseName: varchar("exerciseName", { length: 255 }).notNull(),
  maxReps: int("maxReps").default(0).notNull(),
  maxWeight: int("maxWeight").default(0),
  recordType: mysqlEnum("recordType", ["reps", "weight", "both"]).notNull(),
  achievedAt: timestamp("achievedAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PersonalRecord = typeof personalRecords.$inferSelect;
export type InsertPersonalRecord = typeof personalRecords.$inferInsert;

/**
 * Custom Exercises table - 사용자가 추가한 커스텀 운동
 */
export const customExercises = mysqlTable("customExercises", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  exerciseId: varchar("exerciseId", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  muscleGroup: varchar("muscleGroup", { length: 100 }),
  difficulty: mysqlEnum("difficulty", ["beginner", "intermediate", "advanced"]),
  youtubeVideoId: varchar("youtubeVideoId", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CustomExercise = typeof customExercises.$inferSelect;
export type InsertCustomExercise = typeof customExercises.$inferInsert;
