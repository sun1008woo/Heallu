CREATE TABLE `customExercises` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`exerciseId` varchar(255) NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`muscleGroup` varchar(100),
	`difficulty` enum('beginner','intermediate','advanced'),
	`youtubeVideoId` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `customExercises_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `exerciseGoals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`exerciseId` varchar(255) NOT NULL,
	`exerciseName` varchar(255) NOT NULL,
	`goalType` enum('reps','weight','duration','frequency') NOT NULL,
	`targetValue` int NOT NULL,
	`currentValue` int NOT NULL DEFAULT 0,
	`unit` varchar(50) NOT NULL,
	`period` enum('weekly','monthly','yearly') NOT NULL,
	`status` enum('active','completed','abandoned') NOT NULL DEFAULT 'active',
	`startDate` varchar(10) NOT NULL,
	`endDate` varchar(10),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `exerciseGoals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `exerciseRecords` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`exerciseId` varchar(255) NOT NULL,
	`exerciseName` varchar(255) NOT NULL,
	`sets` int NOT NULL,
	`reps` int NOT NULL,
	`weight` int,
	`duration` int,
	`notes` text,
	`recordedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `exerciseRecords_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `personalRecords` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`exerciseId` varchar(255) NOT NULL,
	`exerciseName` varchar(255) NOT NULL,
	`maxReps` int NOT NULL DEFAULT 0,
	`maxWeight` int DEFAULT 0,
	`recordType` enum('reps','weight','both') NOT NULL,
	`achievedAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `personalRecords_id` PRIMARY KEY(`id`)
);
