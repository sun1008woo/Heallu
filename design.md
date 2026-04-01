# AI Fitness Trainer — Design Plan

## Brand Identity

- **App Name**: AI Fitness Trainer
- **Tagline**: Your personal AI-powered coach
- **Color Palette**:
  - Primary: `#FF6B35` (Energetic Orange) — CTA buttons, active states
  - Background Light: `#FFFFFF`
  - Background Dark: `#0F0F0F`
  - Surface Light: `#F8F8F8`
  - Surface Dark: `#1A1A1A`
  - Accent: `#00D4AA` (Teal Green) — progress, success
  - Foreground Light: `#1A1A1A`
  - Foreground Dark: `#F5F5F5`
  - Muted Light: `#6B7280`
  - Muted Dark: `#9CA3AF`
  - Border Light: `#E5E7EB`
  - Border Dark: `#2D2D2D`

## Screen List

1. **Home** (`/`) — Dashboard with daily summary, streak, quick actions
2. **Workouts** (`/workouts`) — Browse workout categories and exercises
3. **Workout Detail** (`/workouts/[id]`) — Exercise instructions, sets/reps, timer
4. **AI Trainer** (`/ai-trainer`) — Chat interface with AI personal trainer
5. **Progress** (`/progress`) — Stats, charts, workout history
6. **Profile** (`/profile`) — User settings, goals, personal info

## Primary Content & Functionality

### Home Screen
- Greeting with user name and motivational message
- Today's workout card (quick start)
- Daily streak counter
- Weekly activity ring/bar chart
- Recent AI trainer suggestions
- Quick action buttons (Start Workout, Ask AI, Log Activity)

### Workouts Screen
- Category grid (Strength, Cardio, HIIT, Yoga, Stretching)
- Featured workout of the day
- Exercise library with search/filter
- Difficulty badges (Beginner / Intermediate / Advanced)

### Workout Detail Screen
- Exercise name, muscle groups targeted
- Animated instruction (illustration)
- Sets × Reps configuration
- Built-in rest timer
- Mark complete / log workout

### AI Trainer Screen
- Chat bubble interface (user + AI messages)
- Suggested prompt chips (e.g., "Create a plan", "What should I eat?")
- Typing indicator animation
- Message history persisted locally
- Voice-to-text input button

### Progress Screen
- Weekly/Monthly toggle
- Workout frequency bar chart
- Total workouts, calories burned, active minutes stats cards
- Personal records section
- Workout history list

### Profile Screen
- Avatar + name + fitness goal
- Body stats (weight, height, age)
- Goal selector (Weight Loss / Muscle Gain / Endurance / Flexibility)
- Notification preferences
- Dark/Light mode toggle
- App version info

## Key User Flows

### Flow 1: Start a Workout
Home → Tap "Start Workout" → Workouts screen → Select category → Select exercise → Workout Detail → Complete → Progress updated

### Flow 2: Ask AI Trainer
Home → Tap "Ask AI" → AI Trainer screen → Type or tap suggestion → Receive AI response → Follow advice

### Flow 3: Track Progress
Home → Tap Progress tab → View weekly stats → Check personal records → Review history

### Flow 4: Set Goals
Profile tab → Tap "Edit Goals" → Select fitness goal → Save → Home screen reflects new goal

## Navigation Structure

Bottom Tab Bar (4 tabs):
1. 🏠 Home
2. 💪 Workouts
3. 🤖 AI Trainer
4. 📊 Progress
5. 👤 Profile

## Typography

- **Headers**: Bold, 24-32px
- **Section titles**: SemiBold, 18-20px
- **Body**: Regular, 14-16px
- **Captions**: Regular, 12px, muted color

## Component Design Principles

- Cards with 16px border radius, subtle shadow
- Full-width primary buttons with 12px border radius
- Pill-shaped tags and badges
- Bottom sheet modals for quick actions
- Smooth fade/slide transitions between screens
