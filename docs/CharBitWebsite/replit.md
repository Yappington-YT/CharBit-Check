# CharBit - Character Creation Platform

## Overview

CharBit is a full-stack web application designed for creating and discovering original characters (OCs). Built as a modern social platform, it allows users to create detailed character profiles, discover content from other creators, and interact with a vibrant community of artists and storytellers.

The application follows a clean separation between client and server, using React for the frontend and Express.js for the backend, with PostgreSQL as the primary database through Drizzle ORM.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: TanStack Query (React Query) for server state
- **Routing**: Wouter for client-side routing
- **Build Tool**: Vite for fast development and optimized builds
- **Component Library**: Radix UI primitives with custom shadcn/ui styling

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Replit Auth with OpenID Connect
- **Session Management**: Express sessions with PostgreSQL store
- **API Design**: RESTful endpoints with proper error handling

### Database Architecture
- **ORM**: Drizzle with PostgreSQL dialect
- **Schema**: Type-safe schema definitions in shared directory
- **Migrations**: Drizzle Kit for database migrations
- **Connection**: Neon serverless PostgreSQL with connection pooling

## Key Components

### Authentication System
- Replit Auth integration for seamless user authentication
- Session-based authentication with PostgreSQL session store
- User profile management with social media verification support
- Protected routes and API endpoints
- Separate creator application system for verified creator status
- Profile privacy settings for user profiles (Public/Private/Restricted)

### Character Management
- Full CRUD operations for character creation and editing
- Rich character profiles with customizable fields (name, personality, about, tags)
- Image support for character avatars
- Visibility controls (public/private/restricted)
- Tag-based categorization and discovery with 20 predefined tags
- OC (Original Character) tag available but not mandatory

### Social Features
- User following and friendship systems
- Character likes and favorites
- Recently viewed character tracking
- Social media platform verification (YouTube, Instagram, X, TikTok, Facebook)
- Private messaging system (planned)

### Content Discovery
- Featured characters and creators
- Tag-based exploration
- Trending content algorithms
- Search functionality
- Following feed for personalized content

### Theme System
- Multiple theme options (black, white, midnight, neon, pinky, bob)
- User preference persistence
- CSS custom properties for dynamic theming
- Responsive design across all themes

## Data Flow

### Authentication Flow
1. User initiates login through Replit Auth
2. OpenID Connect handles authentication
3. User profile created/updated in PostgreSQL
4. Session established and stored in database
5. Frontend receives authenticated user state

### Character Creation Flow
1. User submits character form through React form
2. Frontend validates data using Zod schemas
3. API endpoint processes creation request
4. Character stored in PostgreSQL with creator relationship
5. Cache invalidation triggers UI updates
6. User redirected to character profile

### Content Discovery Flow
1. Frontend requests content based on user preferences
2. Backend queries database with appropriate filters
3. Results include creator information and interaction counts
4. Recently viewed tracking updated
5. Content rendered with social interaction buttons

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL connection for serverless environments
- **drizzle-orm**: Type-safe database operations
- **@tanstack/react-query**: Server state management
- **@radix-ui/***: Accessible UI component primitives
- **express**: Web framework for API server
- **passport**: Authentication middleware

### Development Tools
- **tsx**: TypeScript execution for development
- **esbuild**: Fast JavaScript bundler for production
- **tailwindcss**: Utility-first CSS framework
- **vite**: Fast build tool and development server

### Social Integration
- **react-icons**: Social media platform icons
- **connect-pg-simple**: PostgreSQL session store
- **openid-client**: OpenID Connect authentication

## Deployment Strategy

### Development Environment
- Replit-optimized with hot reloading
- Vite development server with Express API proxy
- PostgreSQL database provisioning through Replit
- Environment variable management for sensitive data

### Production Build
- Vite builds optimized client bundle
- esbuild compiles server for Node.js execution
- Static assets served from Express server
- Database migrations applied through Drizzle Kit

### Scaling Considerations
- Neon serverless PostgreSQL for automatic scaling
- Connection pooling for database efficiency
- Session store optimization for high traffic
- CDN integration for static asset delivery

## Recent Changes
- June 22, 2025: Implemented 20 predefined tags system including OC tag (not mandatory)
- June 22, 2025: Built separate creator application process for users to become verified creators
- June 22, 2025: Added profile privacy settings (Public, Private, Restricted) for user profiles and characters
- June 22, 2025: Created Creator Application page with status tracking and benefits overview
- June 22, 2025: Added Settings page for profile privacy controls
- June 22, 2025: Updated sidebar navigation with Creator Application link and Star icon

## Changelog
- June 22, 2025. Initial setup
- June 22, 2025. Added tags system, creator applications, and profile privacy features

## User Preferences

Preferred communication style: Simple, everyday language.