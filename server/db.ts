import { eq, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, exerciseGoals, exerciseRecords, personalRecords, customExercises, type InsertExerciseGoal, type InsertExerciseRecord, type InsertPersonalRecord, type InsertCustomExercise } from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Exercise Goals
export async function createExerciseGoal(data: InsertExerciseGoal) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(exerciseGoals).values(data);
  return true;
}

export async function getUserExerciseGoals(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(exerciseGoals).where(eq(exerciseGoals.userId, userId));
}

export async function updateExerciseGoal(id: number, data: Partial<InsertExerciseGoal>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(exerciseGoals).set(data).where(eq(exerciseGoals.id, id));
}

export async function deleteExerciseGoal(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(exerciseGoals).where(eq(exerciseGoals.id, id));
}

// Exercise Records
export async function createExerciseRecord(data: InsertExerciseRecord) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(exerciseRecords).values(data);
  return true;
}

export async function getUserExerciseRecords(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(exerciseRecords).where(eq(exerciseRecords.userId, userId));
}

export async function deleteExerciseRecord(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(exerciseRecords).where(eq(exerciseRecords.id, id));
}

// Personal Records
export async function createPersonalRecord(data: InsertPersonalRecord) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(personalRecords).values(data);
  return true;
}

export async function getUserPersonalRecords(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(personalRecords).where(eq(personalRecords.userId, userId));
}

// Custom Exercises
export async function createCustomExercise(data: InsertCustomExercise) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(customExercises).values(data);
  return true;
}

export async function getUserCustomExercises(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(customExercises).where(eq(customExercises.userId, userId));
}

export async function updateCustomExercise(id: number, data: Partial<InsertCustomExercise>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(customExercises).set(data).where(eq(customExercises.id, id));
}

export async function deleteCustomExercise(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(customExercises).where(eq(customExercises.id, id));
}
