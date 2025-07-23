# Chess Groq Coach - AI-Powered Chess Training

A comprehensive full-stack chess application that combines AI-powered training with modern web technologies. Features multiple game modes including classic gameplay, move feedback, scoring analysis, and interactive coaching.

## Features

- **Classic Mode**: Traditional chess gameplay against AI
- **Feedback Mode**: AI provides move analysis and suggestions
- **Scoring Mode**: Numerical evaluation of each move with explanations
- **Coach Mode**: Interactive training with chat functionality
- **Opening Learning Mode**: Practice specific chess openings with guided instruction

## Technology Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Node.js + Express + TypeScript
- **UI**: Tailwind CSS + shadcn/ui components
- **Chess Engine**: Chess.js
- **AI**: Groq API integration
- **Database**: PostgreSQL with Drizzle ORM
- **Real-time**: WebSocket support

## Setup Instructions

### Prerequisites

- Node.js 18+ installed
- PostgreSQL database (optional - uses in-memory storage by default)
- Groq API key for AI functionality

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd chess-groq-coach
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   Create a `.env` file in the root directory:
   ```env
   GROQ_API_KEY=your_groq_api_key_here
   DATABASE_URL=your_postgresql_database_url_here
   NODE_ENV=development
   PORT=5000
   ```

4. **Get Groq API Key**
   - Visit [https://console.groq.com/](https://console.groq.com/)
   - Create an account and generate an API key
   - Add the key to your `.env` file

5. **Database Setup (Optional)**
   - If using PostgreSQL, set up your database and add the connection URL to `.env`
   - Run database migrations: `npm run db:push`
   - The app will work with in-memory storage if no database is configured

### Running the Application

**Development Mode**
```bash
npm run dev
```
The application will be available at `http://localhost:5000`

**Production Build**
```bash
npm run build
npm start
```

**Type Checking**
```bash
npm run check
```

## Game Modes

### Classic Mode
Traditional chess gameplay against AI opponents with adjustable difficulty levels (1-5).

### Feedback Mode
Get detailed AI analysis and suggestions for each move to improve your gameplay.

### Scoring Mode
Receive numerical scores and explanations for your moves to understand position evaluation.

### Coach Mode
Interactive chat with an AI chess coach that can answer questions and provide personalized guidance.

### Opening Learning Mode
Practice specific chess openings including:
- King's Gambit
- Latvian Gambit
- Dragon Squirrel
- Blackmar-Diemer Gambit
- Bird's Opening

## AI Models

The application supports multiple AI models through Groq:
- **llama3-70b-8192**: Strategic gameplay and analysis
- **deepseek-r1-distill-llama-70b**: Deep analytical play
- **moonshotai/kimi-k2-instruct**: Educational coaching

## Difficulty Levels

1. **Beginner (1200-1400 ELO)**: Basic moves with occasional mistakes
2. **Intermediate (1400-1600 ELO)**: Solid play with tactical awareness
3. **Advanced (1600-1800 ELO)**: Strong tactical and positional understanding
4. **Expert (1800-2100 ELO)**: Master-level strategic play
5. **Grandmaster (2100+ ELO)**: Near-perfect play with deep calculation

## Architecture

- **Client**: React SPA with TypeScript
- **Server**: Express.js API with WebSocket support
- **Database**: PostgreSQL with Drizzle ORM
- **AI Integration**: Groq API for move generation and analysis
- **Build System**: Vite for fast development and optimized production builds

## Deployment

The application is designed to run on any Node.js hosting platform. For production:

1. Set environment variables on your hosting platform
2. Ensure PostgreSQL database is accessible
3. Run `npm run build` to create production assets
4. Start with `npm start`

## Troubleshooting

**AI not working**
- Verify your Groq API key is correct in the `.env` file
- Check that the API key has sufficient credits
- Ensure the API service is available

**Database connection issues**
- Verify PostgreSQL connection string
- Ensure database exists and is accessible
- The app will fallback to in-memory storage if database is unavailable

**Build or dependency issues**
- Delete `node_modules` and `package-lock.json`
- Run `npm install` again
- Ensure you're using Node.js 18 or higher

## License

MIT License - see LICENSE file for details.