# FitFlow AI

**Automated Exercise Tracking & Personalized Growth Insights**

FitFlow AI is an AI-powered web application that automatically tracks workout data and provides personalized performance insights for fitness enthusiasts. Built with React, Supabase, and OpenAI, it offers a comprehensive fitness tracking solution with intelligent recommendations.

## 🚀 Features

### Core Features
- **Automated Real-time Workout Logging**: Track exercise type, sets, reps, and weight with intelligent data capture
- **Progress Visualization & Analysis**: Clear charts and graphs showing workout history, personal bests, and performance trends
- **Personalized Workout Recommendations**: AI-powered suggestions based on your performance data and goals
- **Cross-App Data Integration**: Future-ready for consolidating data from other fitness apps and wearables

### Subscription Tiers
- **Free**: Up to 10 workouts/month, basic tracking, 2 AI recommendations/week
- **Pro ($9/month)**: Up to 100 workouts/month, advanced analytics, 10 AI recommendations/week
- **Elite ($19/month)**: Unlimited workouts, unlimited AI recommendations, AI coaching, custom workout plans

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Authentication, Real-time)
- **AI**: OpenAI GPT-3.5 Turbo for recommendations and analysis
- **Payments**: Stripe for subscription management
- **Charts**: Recharts for data visualization
- **Icons**: Lucide React

## 📋 Prerequisites

Before you begin, ensure you have:

- Node.js 18+ installed
- A Supabase account and project
- An OpenAI API key
- A Stripe account (for billing features)

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd fitflow-ai
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup

Copy the environment template and fill in your credentials:

```bash
cp .env.example .env
```

Edit `.env` with your actual values:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# OpenAI Configuration
VITE_OPENAI_API_KEY=your_openai_api_key

# Stripe Configuration
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
VITE_STRIPE_PRO_PRICE_ID=your_stripe_pro_price_id
VITE_STRIPE_ELITE_PRICE_ID=your_stripe_elite_price_id

# Application Configuration
VITE_APP_URL=http://localhost:5173
```

### 4. Database Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Run the database schema from `src/lib/database.sql` in your Supabase SQL editor
3. Enable Row Level Security (RLS) policies as defined in the schema

### 5. Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## 🗄️ Database Schema

The application uses the following main tables:

- **users**: User profiles and subscription information
- **workouts**: Workout sessions with metadata
- **exercises**: Master list of available exercises
- **workout_exercises**: Junction table linking workouts to exercises
- **recommendations**: AI-generated recommendations for users
- **user_progress**: Progress tracking and personal records
- **subscription_events**: Subscription change history

## 🔧 Configuration

### Supabase Setup

1. Create a new project in Supabase
2. Copy your project URL and anon key to `.env`
3. Run the SQL schema from `src/lib/database.sql`
4. Configure authentication providers as needed

### OpenAI Setup

1. Get an API key from [OpenAI](https://platform.openai.com)
2. Add it to your `.env` file
3. Monitor usage to manage costs

### Stripe Setup

1. Create a Stripe account
2. Set up products and prices for Pro and Elite tiers
3. Add your publishable key and price IDs to `.env`
4. Configure webhooks for subscription events (production)

## 🏗️ Project Structure

```
src/
├── components/          # React components
│   ├── auth/           # Authentication components
│   ├── ui/             # Reusable UI components
│   └── ...             # Feature-specific components
├── context/            # React context providers
├── services/           # API service classes
├── lib/                # Utility libraries and configurations
├── hooks/              # Custom React hooks
└── styles/             # Global styles and Tailwind config
```

## 🔐 Authentication

The app uses Supabase Auth with:
- Email/password authentication
- Password reset functionality
- Protected routes
- Session management
- User profile creation

## 💳 Subscription Management

Stripe integration provides:
- Subscription checkout
- Customer portal access
- Usage-based limits
- Upgrade/downgrade flows
- Billing history

## 🤖 AI Features

OpenAI integration powers:
- Personalized workout recommendations
- Exercise form analysis
- Progress insights
- Workout plan suggestions
- Performance trend analysis

## 📊 Analytics & Insights

The app provides:
- Workout frequency tracking
- Progress visualization
- Personal record tracking
- Volume and intensity analysis
- Goal achievement metrics

## 🚀 Deployment

### Production Checklist

1. **Environment Variables**: Set all production environment variables
2. **Database**: Ensure RLS policies are properly configured
3. **Stripe**: Set up production webhooks
4. **OpenAI**: Monitor API usage and set up billing alerts
5. **Domain**: Configure custom domain and SSL

### Recommended Platforms

- **Frontend**: Vercel, Netlify, or similar
- **Database**: Supabase (managed PostgreSQL)
- **File Storage**: Supabase Storage or AWS S3

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e
```

## 📈 Performance

The app is optimized for:
- Fast initial load with code splitting
- Efficient data fetching with caching
- Responsive design for all devices
- Progressive Web App capabilities

## 🔒 Security

Security measures include:
- Row Level Security (RLS) in Supabase
- Input validation and sanitization
- Secure API key management
- HTTPS enforcement
- Content Security Policy

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Check the documentation
- Open an issue on GitHub
- Contact support (for paid users)

## 🗺️ Roadmap

Upcoming features:
- Mobile app (React Native)
- Wearable device integration
- Social features and challenges
- Advanced AI coaching
- Nutrition tracking
- Workout video library

---

**Built with ❤️ for fitness enthusiasts**
