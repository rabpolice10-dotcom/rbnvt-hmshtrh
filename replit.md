# Overview

This is a full-stack web application for a Police Rabbinate system (רבנות המשטרה) built with React, Express, and PostgreSQL. The application serves as a platform for police officers to ask religious questions to rabbis, access synagogue information, view religious videos, and stay updated with news. The system includes user registration with approval workflow and admin functionality.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **UI Components**: Radix UI primitives with shadcn/ui component library
- **Styling**: Tailwind CSS with custom police theme colors
- **Build Tool**: Vite for development and bundling

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Database**: PostgreSQL (configured for Neon serverless)
- **Session Management**: Built-in device-based authentication using localStorage
- **API Design**: RESTful API with JSON responses

### Mobile-First Design
- Responsive design optimized for mobile devices
- Bottom navigation pattern for mobile UX
- Hebrew language interface (RTL support)
- Police-themed color scheme with blue accent colors

## Key Components

### Authentication System
- Device-based authentication using unique device IDs
- User registration requires approval by admin
- Three user states: pending, approved, rejected
- No traditional password-based authentication

### Question & Answer System
- Users can submit religious questions to rabbis
- Questions are categorized and can be marked as urgent
- Admin interface for managing and answering questions
- Question status tracking (pending, answered, closed)

### Content Management
- News system for announcements and updates
- Synagogue directory with location information
- Video library with YouTube integration
- Daily Halacha (religious law) content

### Admin Panel
- User approval/rejection workflow
- Question management and answering
- Content creation and management

## Data Flow

1. **User Registration**: Device ID generated → Registration form → Admin approval → User activated
2. **Question Submission**: Authenticated user → Question form → Database → Admin notification
3. **Content Consumption**: User requests → API endpoints → Database queries → JSON response
4. **Admin Operations**: Admin login → Management interface → Database updates → User notifications

## External Dependencies

### Database
- **Neon PostgreSQL**: Serverless PostgreSQL database
- **Connection**: WebSocket-based connection using `@neondatabase/serverless`

### UI Libraries
- **Radix UI**: Accessible component primitives
- **Lucide React**: Icon library
- **Tailwind CSS**: Utility-first CSS framework

### Development Tools
- **TypeScript**: Type safety across frontend and backend
- **Drizzle Kit**: Database migration and schema management
- **ESBuild**: Fast JavaScript bundler for production

## Deployment Strategy

### Development
- Vite dev server for frontend with HMR
- Express server with TypeScript compilation via tsx
- Shared schema between frontend and backend

### Production Build
- Frontend: Vite build to static assets
- Backend: ESBuild bundling to single JavaScript file
- Environment variables for database connection
- Static file serving from Express

### File Structure
- `/client`: Frontend React application
- `/server`: Backend Express application  
- `/shared`: Shared TypeScript schemas and types
- `/migrations`: Database migration files

The application follows a monorepo structure with clear separation between frontend, backend, and shared code, enabling type safety across the full stack while maintaining modularity.