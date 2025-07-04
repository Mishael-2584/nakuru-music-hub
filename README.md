# Damon Music Academy

A comprehensive music academy web application built with modern web technologies, featuring student and teacher portals, course management, event coordination, and an integrated shop system.

## 🎵 Project Overview

Damon Music Academy is a full-featured web platform that provides:

- **Student Portal**: Course registration, progress tracking, and resource access
- **Teacher Portal**: Class management, student progress monitoring, and scheduling
- **Admin Panel**: User management, course administration, and system oversight
- **Event Management**: Event creation, registration, and management
- **News System**: Academy updates and announcements
- **Shop Integration**: Digital tracks, instruments, accessories, and merchandise
- **Professional Services**: Live sound, recording, photography, and more

## 🚀 Quick Start

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd nakuru-music-hub
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory with your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:8081` (or the port shown in your terminal)

## 🛠️ Development

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

### Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # shadcn/ui components
│   └── auth/           # Authentication components
├── pages/              # Page components
├── hooks/              # Custom React hooks
├── lib/                # Utility functions
├── integrations/       # External service integrations
│   └── supabase/       # Supabase client and types
└── main.tsx           # Application entry point
```

### Key Features

#### 🎓 Educational Platform
- **Course Management**: Comprehensive course catalog with detailed descriptions
- **Student Dashboard**: Progress tracking, course enrollment, and resource access
- **Teacher Dashboard**: Class management, student monitoring, and scheduling tools
- **Exam Preparation**: ABRSM and other examination body support

#### 🛒 Shop System (Phase 1)
- **Digital Products**: Performance tracks and custom music production services
- **Physical Products**: Musical instruments and accessories (Kenya only)
- **Merchandise**: Branded academy merchandise
- **PC-Responsive Design**: Optimized for desktop viewing

#### 🎤 Professional Services
- **Live Sound & Lighting**: Event audio and lighting solutions
- **Recording Services**: Studio recording and production
- **Event Coverage**: Photography and videography services
- **Music Production**: Custom arrangements and compositions

#### 🔐 Authentication & Security
- **Role-Based Access**: Student, Teacher, and Admin roles
- **Secure Authentication**: Supabase Auth integration
- **Session Management**: Automatic session handling
- **Teacher Approval System**: Admin-controlled teacher registration

## 🎨 Technology Stack

- **Frontend**: React 18 with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Build Tool**: Vite
- **State Management**: React Query + Context API
- **Routing**: React Router v6
- **Icons**: Lucide React
- **Forms**: React Hook Form with Zod validation

## 📱 Responsive Design

The application is designed to be fully responsive across all devices:
- **Desktop**: Full-featured experience with advanced navigation
- **Tablet**: Optimized layouts for medium screens
- **Mobile**: Touch-friendly interfaces (Phase 2 enhancement)

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect your repository** to Vercel
2. **Set environment variables** in Vercel dashboard
3. **Deploy automatically** on push to main branch

### Other Platforms

The application can be deployed to any static hosting platform:
- Netlify
- GitHub Pages
- AWS S3 + CloudFront
- Firebase Hosting

## 🔧 Environment Variables

Required environment variables:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Optional variables:

```env
VITE_APP_NAME=Damon Music Academy
VITE_APP_URL=https://your-domain.com
```

## 📊 Database Schema

The application uses Supabase with the following main tables:
- `profiles` - User profiles and roles
- `courses` - Course information
- `registrations` - Student course enrollments
- `events` - Event management
- `news` - News and announcements
- `teachers` - Teacher profiles and approvals
- `pending_teachers` - Teacher registration queue

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is proprietary software for Damon Music Academy.

## 🆘 Support

For technical support or questions:
- Create an issue in the GitHub repository
- Contact the development team
- Check the documentation in the `/docs` folder

## 🔄 Version History

- **v1.0.0** - Initial release with core features
- **v1.1.0** - Added Shop system (Phase 1)
- **v1.2.0** - Enhanced teacher portal and admin features
- **v1.3.0** - Improved services section and UI enhancements

---

**Built with ❤️ for Damon Music Academy**
