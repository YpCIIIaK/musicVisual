# AI Development Rules

This document outlines the technical stack and development conventions for this project. Adhering to these rules ensures consistency and maintainability.

## Tech Stack

This is a web-based audio visualizer built with the following technologies:

-   **Framework**: React 18 with hooks.
-   **Language**: TypeScript for type safety.
-   **Build Tool**: Vite for fast development and optimized builds.
-   **Styling**: Tailwind CSS for all UI styling, loaded via a CDN.
-   **State Management**: React Context API (`SettingsContext`) for global state and `useState`/`useRef` for local state.
-   **AI Integration**: Google Gemini API (`@google/genai`) for generative features like color palette creation.
-   **Audio Processing**: Native Web Audio API for audio analysis and visualization data.
-   **Internationalization (i18n)**: A custom `useTranslation` hook for multi-language support (English and Russian).
-   **Icons**: Custom, self-contained SVG components located in `constants.tsx`.

## Library and Component Usage Rules

### 1. Styling

-   **Always use Tailwind CSS classes** for styling. Do not write custom CSS files or use inline `style` attributes unless absolutely necessary (e.g., for dynamic values that cannot be represented by Tailwind classes, like `transform: rotate(...)`).
-   The application is designed with a dark theme. All new components should respect this aesthetic.

### 2. State Management

-   For global settings that affect the entire application (e.g., volume, language, visualization type), use the existing `SettingsContext`.
-   For component-specific state, use `useState` and `useRef`. Do not introduce new state management libraries like Redux or Zustand.

### 3. Icons

-   Use the existing SVG icon components from `constants.tsx`.
-   If a new icon is needed, create it as a new React component within `constants.tsx`, following the existing pattern. Do not install third-party icon libraries.

### 4. AI Features

-   All AI-powered features must use the `@google/genai` package.
-   API key management is handled via Vite's environment variables (`process.env.GEMINI_API_KEY`). Do not expose API keys in the client-side code.

### 5. Components and File Structure

-   **Reusable Components**: Place in `src/components/`.
-   **Custom Hooks**: Place in `src/hooks/`.
-   **Contexts**: Place in `src/contexts/`.
-   **Types**: Define all shared types in `types.ts`.
-   **Constants**: Store constants and static data (like palettes and icon components) in `constants.tsx`.
-   Create new files for new components. Do not add multiple components to a single file.

### 6. Audio Visualization

-   All visualization logic should be encapsulated within the `useAudioVisualizer` hook.
-   New visualization types should be added to the `VisualizationType` enum in `types.ts` and implemented as a new drawing function within the `useAudioVisualizer` hook.