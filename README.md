# Chess Groq Coach - AI-Powered Chess Training Platform

A comprehensive full-stack chess application that combines AI-powered training with modern web technologies. Experience multiple game modes, AI coaching, and interactive learning features powered by Groq AI and Stockfish 16.

## 🎯 Features

### Game Modes
- **Classic Mode**: Traditional chess gameplay against multiple AI models
- **Feedback Mode**: Receive real-time AI analysis and move suggestions  
- **Scoring Mode**: Get numerical evaluations with detailed explanations
- **Coach Mode**: Interactive training with AI-powered chat assistance
- **Opening Learning**: Master chess openings with guided practice

### AI Integration
- **Stockfish 16**: World's strongest chess engine with 5 difficulty levels
- **Groq LLM Models**: Human-like gameplay with strategic reasoning
  - Llama 3 70B for strategic gameplay
  - DeepSeek R1 for analytical play  
  - Kimi K2 for educational coaching
- **Adaptive Difficulty**: AI strength adjusts from beginner to expert level

### Advanced Features
- **Move Analysis**: Deep position evaluation with centipawn scores
- **Game Navigation**: Review and replay any position in game history
- **PGN Export**: Professional-grade game notation with analysis
- **Multi-language Support**: English, Kurdish, French, Spanish, German, Turkish
- **Dark/Light Themes**: Responsive design with system preference detection
- **Real-time Chat**: Interactive coaching conversations with AI

## 🚀 Technology Stack

### Frontend
- **React 18** with TypeScript for type-safe development
- **Vite** for lightning-fast development and optimized builds
- **Tailwind CSS + shadcn/ui** for modern, accessible UI components
- **Chess.js** for game logic and move validation
- **TanStack React Query** for efficient server state management
- **Wouter** for lightweight client-side routing

### Backend
- **Node.js + Express** with TypeScript ES modules
- **WebSocket** integration for real-time game updates
- **Stockfish Engine** integration for strongest chess analysis
- **Groq AI API** for LLM-powered gameplay and coaching
- **Drizzle ORM** with PostgreSQL support for data persistence

### Development Tools
- **TypeScript** for full-stack type safety
- **ESBuild** for production compilation
- **Hot Module Replacement** for rapid development
- **LSP Diagnostics** for code quality assurance

## 🏗️ Architecture

### Client-Server Separation
- Frontend focuses on UI/UX with minimal business logic
- Backend handles AI integration, game logic, and data persistence
- WebSocket connections for real-time gameplay experience
- RESTful APIs for game management and statistics

### AI Engine Integration
- **Stockfish 16**: Advanced position evaluation and move generation
- **Groq AI**: Strategic reasoning and educational feedback
- **Hybrid Approach**: Combines engine strength with human-like play
- **Difficulty Scaling**: Adjustable AI strength for all skill levels

### Data Flow
1. User selects game mode and AI preferences
2. Real-time move validation and synchronization
3. AI analysis triggered based on selected game mode
4. Results displayed through appropriate UI components
5. Game state persisted with move history and analysis

## 🎮 Game Modes Explained

### Classic Mode
Pure chess gameplay against AI opponents. Choose from multiple AI models with adjustable difficulty levels. Perfect for players wanting traditional chess matches.

### Feedback Mode  
Receive instant AI analysis after each move. Learn why moves are good or bad with detailed explanations and alternative suggestions.

### Scoring Mode
Get numerical evaluation of positions and moves. Understand the centipawn value of each move with quality ratings (excellent, good, inaccuracy, mistake, blunder).

### Coach Mode
Interactive learning experience with AI chat support. Ask questions about positions, strategies, and receive personalized coaching based on your play style.

### Opening Learning
Master chess openings through guided practice. Learn move sequences, understand opening principles, and build your repertoire systematically.

## 🔧 Setup & Development

### Prerequisites
- Node.js 20+ with npm
- Modern web browser with WebSocket support
- Optional: PostgreSQL for data persistence

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd chess-groq-coach

# Install dependencies
npm install

# Start development server
npm run dev
```

### Environment Configuration
```bash
# Optional: Add Groq AI API key for enhanced features
GROQ_API_KEY=your_groq_api_key_here

# Optional: Database connection
DATABASE_URL=your_postgresql_connection_string
```

### Development Scripts
```bash
npm run dev      # Start development server
npm run build    # Build for production  
npm run start    # Start production server
npm run check    # TypeScript type checking
npm run db:push  # Push database schema changes
```

## 🎯 Game Controls

### Chess Board
- **Drag & Drop**: Move pieces naturally with mouse/touch
- **Click to Move**: Click source square, then destination
- **Visual Feedback**: Legal moves highlighted, check indicators
- **Board Flip**: Switch perspective between white and black

### Game Controls
- **Reset Game**: Start new game with current settings
- **Level +/-**: Adjust AI difficulty (1-5 scale)
- **Download PGN**: Export game with full analysis and metadata
- **AI Model**: Switch between Stockfish and Groq LLM models

### Navigation
- **Move History**: Click any move to review that position
- **Auto-play**: Watch games replay automatically
- **Position Analysis**: View evaluations for any game state

## 📊 AI Models & Difficulty

### Stockfish 16
- **Level 1**: Random moves, perfect for absolute beginners
- **Level 2**: Avoids obvious blunders, basic tactical awareness  
- **Level 3**: Good moves with tactical understanding
- **Level 4**: Strong positional play with deep calculation
- **Level 5**: Near-perfect play, challenging for masters

### Groq LLM Models
- **Llama 3 70B**: Strategic gameplay with human-like reasoning
- **DeepSeek R1**: Analytical approach with deep calculation
- **Kimi K2**: Educational focus, perfect for learning and coaching

## 🌍 Multi-language Support

The application supports multiple languages with complete UI localization:
- English (default)
- Kurdish (Kurmanji)
- French (Français)  
- Spanish (Español)
- German (Deutsch)
- Turkish (Türkçe)

## 📋 PGN Export Features

Professional-grade PGN files include:
- Complete game metadata (event, date, players, result)
- Move analysis with evaluation scores
- Opening identification and classification
- AI model and difficulty level used
- Timestamped game progression
- Result determination (win/loss/draw)

## 🔒 Security & Performance

### Security Features
- Client-server separation for data integrity
- Input validation on all user interactions
- Secure WebSocket connections
- Rate limiting for API endpoints
- Environment-based configuration

### Performance Optimizations
- Efficient state management with React Query
- Lazy loading of heavy components
- Optimized bundle sizes with code splitting
- WebSocket connection pooling
- Cached AI analysis results

## 🎨 UI/UX Features

### Modern Design
- Clean, professional interface
- Responsive design for all screen sizes
- Accessibility-compliant components
- Smooth animations and transitions
- Intuitive game controls

### Customization
- Light/dark theme switching
- Board orientation control
- Language preference persistence
- AI model preferences
- Difficulty level memory

## 📈 Statistics & Progress Tracking

- Games played and win/loss ratios
- ELO rating system integration
- Opening repertoire progress
- Move accuracy analysis
- Learning curve visualization
- Performance against different AI levels

## 🤝 Contributing

This project welcomes contributions for:
- Additional AI model integrations
- New game modes and features
- UI/UX improvements
- Language translations
- Chess engine optimizations
- Educational content expansion

## 📄 License

MIT License - see LICENSE file for details.

## 🙏 Acknowledgments

- **Stockfish Team** - For the world's strongest chess engine
- **Groq** - For powerful LLM inference capabilities  
- **Chess.js** - For reliable chess game logic
- **Replit** - For the development platform
- **shadcn/ui** - For beautiful UI components

---

**Built with ❤️ for chess enthusiasts and learners worldwide**