# Chess Groq Coach - AI-Powered Chess Training

## Overview

This is a comprehensive full-stack chess application that combines AI-powered training with modern web technologies. The application offers multiple game modes including classic gameplay, move feedback, scoring analysis, and interactive coaching features. Built with React, Express, and real-time WebSocket communication.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

**Comprehensive Migration Complete (2025-01-23):**
- ✅ Successfully migrated from Replit Agent to full Replit environment
- ✅ **Stockfish 16 Integration**: World's strongest chess engine with 5-level difficulty scaling
- ✅ **AI Model Selection**: Multiple AI opponents (Stockfish, Llama 3, DeepSeek, Kimi)
- ✅ **Enhanced Controls**: Streamlined Reset Game/Level/Download PGN buttons
- ✅ **Professional PGN Export**: Complete metadata, analysis scores, timestamps
- ✅ **Fixed Opening Learning**: Progress tracking, move validation, hint system
- ✅ **Move Navigation**: Position replay, auto-play, game analysis review
- ✅ **Comprehensive Documentation**: Full README with setup and feature guides  
- ✅ **TypeScript Resolution**: All LSP errors fixed, type-safe architecture
- ✅ **Modern UI Components**: Improved chess controls, AI model selector
- ✅ All game modes fully functional: Classic, Feedback, Scoring, Coach, Opening Learning
- ✅ Real-time WebSocket communication stable and responsive
- ✅ Multi-language support with 6 languages
- ✅ Dark/light theme system with user preferences
- ✅ Production-ready deployment configuration

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **UI Framework**: Tailwind CSS with shadcn/ui components for a polished interface
- **Chess Integration**: Chess.js library for game logic and Chessboard.js for interactive board rendering
- **State Management**: Custom React hooks with TanStack React Query for server state
- **Routing**: Wouter for lightweight client-side routing
- **Real-time Communication**: WebSocket integration for live game updates

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Real-time**: WebSocket server for chess moves and chat functionality
- **Storage**: In-memory storage with interface for future database integration
- **API Design**: RESTful endpoints with WebSocket support for real-time features

### Chess Engine Integration
- **Game Logic**: Chess.js for move validation and game state management
- **AI Integration**: Designed to integrate with Groq AI and Stockfish (configuration ready)
- **Move Analysis**: Support for multiple analysis modes (feedback, scoring, coaching)

## Key Components

### Game Modes
1. **Classic Mode**: Traditional chess gameplay against AI
2. **Feedback Mode**: AI provides move analysis and suggestions
3. **Scoring Mode**: Numerical evaluation of each move with explanations
4. **Coach Mode**: Interactive training with chat functionality

### UI Components
- **Chess Board**: Interactive chessboard with drag-and-drop functionality
- **Move History**: Complete game notation with move navigation
- **AI Feedback**: Dynamic analysis display based on game mode
- **Coach Chat**: Real-time messaging with AI coach
- **Game Controls**: Mode selection, game reset, and PGN export

### Internationalization
- **Multi-language Support**: English, Kurdish, French, Spanish, German, Turkish
- **Theme System**: Light/dark mode with system preference detection
- **Responsive Design**: Mobile-first approach with adaptive layouts

## Data Flow

### Game Session Flow
1. User selects game mode and language preferences
2. WebSocket connection established for real-time communication
3. Chess moves validated client-side and synchronized via WebSocket
4. AI analysis requested based on selected game mode
5. Results displayed through appropriate UI components

### State Management
- **Local State**: React hooks for UI state and temporary data
- **Server State**: TanStack Query for API data caching and synchronization
- **Real-time State**: WebSocket messages for live game updates
- **Persistent State**: Theme and language preferences stored in localStorage

### Database Schema
- **Users**: Profile information, ratings, and game statistics
- **Games**: Game sessions with mode, status, and AI memory
- **Moves**: Individual chess moves with analysis and scoring
- **Chat Messages**: Coach mode conversation history

## External Dependencies

### Core Dependencies
- **React Ecosystem**: React 18, React Query, React Hook Form
- **UI Framework**: Radix UI primitives with shadcn/ui styling
- **Chess Libraries**: Chess.js for logic, external chessboard library for UI
- **Styling**: Tailwind CSS with CSS variables for theming
- **Database**: Drizzle ORM configured for PostgreSQL (Neon Database ready)

### Development Tools
- **TypeScript**: Full type safety across frontend and backend
- **Vite**: Development server with HMR and build optimization
- **ESBuild**: Production build compilation
- **Drizzle Kit**: Database migrations and schema management

### Planned Integrations
- **Groq AI**: LLM integration for move analysis and coaching
- **Stockfish**: Chess engine for position evaluation
- **PostgreSQL**: Production database via Neon Database

## Deployment Strategy

### Development Environment
- **Local Development**: Vite dev server with Express backend
- **Hot Reload**: Automatic code reloading for rapid development
- **WebSocket**: Development-ready real-time communication

### Production Build
- **Frontend**: Static assets built with Vite and served by Express
- **Backend**: Compiled TypeScript running on Node.js
- **Database**: PostgreSQL with connection pooling
- **Environment**: Configuration via environment variables

### Infrastructure Considerations
- **WebSocket Support**: Server must support persistent connections
- **Database**: PostgreSQL instance with proper indexing for chess data
- **Static Assets**: Optimized delivery of chess piece images and fonts
- **API Rate Limiting**: Protection against abuse of AI services

### Scaling Approach
- **Horizontal Scaling**: Stateless backend design enables multiple instances
- **Database Optimization**: Indexed queries for game history and user data
- **Caching Strategy**: Query caching for frequently accessed data
- **CDN Integration**: Static asset delivery optimization