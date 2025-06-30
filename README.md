# proSpace - AI-Powered Learning Space Management Platform

## 🚀 Overview

proSpace is a comprehensive AI-powered learning space management platform that enables teachers and students to create, manage, and interact with educational content in collaborative workspaces. The platform leverages advanced AI technologies to generate flashcards, quizzes, summaries, audiobooks, and storyboards from uploaded content, making learning more engaging and interactive.

## ✨ Key Features

### 🎯 **Smart Content Generation**
- **AI-Powered Flashcards**: Automatically generate interactive flashcards from uploaded documents
- **Intelligent Quizzes**: Create comprehensive quizzes with multiple-choice questions
- **Smart Summaries**: Generate detailed summaries and key points from content
- **Storyboard Generation**: Create visual storyboards with AI-generated images and narratives

### 🌐 **Web Content Integration**
- **Website Import**: Import and process content directly from websites
- **Web Search**: Built-in search functionality to find relevant information
- **Web Notes**: Save and organize notes from web sources
- **Content Mapping**: Navigate through website structures to find relevant pages

### 👥 **Collaborative Learning Spaces**
- **Space Management**: Create and manage learning spaces with unique join codes
- **Role-Based Access**: Teacher and student roles with different permissions
- **Member Management**: Invite and manage team members
- **Real-time Collaboration**: Work together in shared learning environments

### 📊 **Dashboard & Analytics**
- **Comprehensive Dashboard**: Overview of all spaces and content
- **Progress Tracking**: Monitor learning progress and engagement
- **Content Statistics**: View counts of chapters, flashcards, quizzes, and more
- **Activity Monitoring**: Track recent activities and updates

### 🎨 **Modern User Interface**
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Dark Mode Support**: Toggle between light and dark themes
- **Intuitive Navigation**: Easy-to-use interface with clear navigation
- **Interactive Elements**: Hover effects, animations, and smooth transitions

## 🛠️ Technology Stack

### **Frontend**
- **Next.js 14**: React framework with App Router
- **React**: Modern React with hooks and functional components
- **Tailwind CSS**: Utility-first CSS framework
- **HeroUI**: Modern UI component library
- **TypeScript**: Type-safe JavaScript development

### **Backend & AI Services**
- **Appwrite**: Backend-as-a-Service for authentication, database, and storage
- **Tavily AI**: Web search and content processing
- **OpenAI GPT**: AI content generation (flashcards, quizzes, summaries)
- **Text-to-Speech**: Audio generation for audiobooks
- **Image Generation**: AI-powered storyboard creation

### **External APIs**
- **Tavily Search API**: Web search functionality
- **Content Processing API**: Custom API for document processing
- **Image Generation API**: AI image creation for storyboards

## 📁 Project Structure

```
100agent/
├── app/
│   ├── api/                    # API routes
│   │   ├── audiobook/         # Audiobook generation
│   │   ├── download-image/    # Image download handling
│   │   ├── flashcards/        # Flashcard generation
│   │   ├── quiz/              # Quiz generation
│   │   ├── storyboards/       # Storyboard generation
│   │   ├── summary/           # Summary generation
│   │   └── upload-file/       # File upload handling
│   ├── dashboard/             # Main dashboard
│   │   ├── myspace/          # Regular user space pages (students)
│   │   │   └── [id]/         # Individual user space with content viewing
│   │   ├── space/            # Creator space pages (teachers)
│   │   │   └── [id]/         # Individual creator space with content management
│   │   └── page.js           # Dashboard main page
│   ├── globals.css           # Global styles
│   ├── layout.js             # Root layout
│   ├── page.js               # Home page
│   └── providers.js          # Context providers
├── public/                   # Static assets
├── components/               # Reusable components
└── utils/                    # Utility functions
```

## 📖 Usage Guide

### For Teachers/Creators

1. **Create a Learning Space**
   - Sign up with credentials
   - Click "Create New Space" on the dashboard
   - Enter space name and description
   - Get a unique 6-digit join code automatically generated

2. **Manage Your Space** (`/dashboard/space/[id]`)
   - Access the creator dashboard for your space
   - AI will automatically process and generate content
   - Manage chapters, flashcards, quizzes, and other content
   - View space statistics and member management

3. **Share Join Code**
   - Copy the 6-digit join code from your space
   - Share it with students via email, messaging, or classroom
   - Students can join using the code from the main dashboard

4. **Content Management**
   - Review generated flashcards, quizzes, and summaries
   - Edit or regenerate content as needed
   - Organize content by chapters

### For Students/Regular Users

1. **Join a Space**
   - Get the 6-digit join code from your teacher
   - Enter the code on the main dashboard
   - Access the learning space

2. **Study Content** (`/dashboard/myspace/[id]`)
   - Browse chapters and content in the student view
   - Use flashcards for memorization
   - Take quizzes to test knowledge
   - Listen to audiobooks
   - View storyboards for visual learning

3. **Web Research**
   - Use the web search feature powered by Tavily
   - Import content from websites
   - Save web notes for reference

## 🔑 Join Code System

### **How Join Codes Work**
- **Automatic Generation**: Each learning space gets a unique 6-digit join code
- **Secure Access**: Only users with the correct code can join a space
- **Role-Based Permissions**: Teachers have full access, students have limited access
- **Easy Sharing**: Simple 6-digit codes are easy to share and remember
- **Appwrite Function Integration**: Join codes work through an Appwrite function that handles team joining

### **Join Code Features**
- **Unique Codes**: Each space has a distinct 6-digit identifier
- **Copy Functionality**: Easy one-click copying of join codes
- **Visual Display**: Codes are prominently displayed in the space dashboard
- **Error Handling**: Invalid codes show appropriate error messages
- **Success Feedback**: Successful joins show confirmation messages
- **Backend Processing**: Appwrite function validates codes and adds users to teams

### **Join Code Flow**
1. **Teacher creates space** → 6-digit code is generated
2. **Teacher shares code** → Students receive the code
3. **Students enter code** → Appwrite function validates and processes the join
4. **Team assignment** → User is added to the learning space team via Appwrite
5. **Role assignment** → Students get appropriate permissions based on team membership

### **Technical Implementation**
- **Appwrite Function**: Custom function handles join code validation and team joining
- **Team Management**: Uses Appwrite Teams for space membership and permissions
- **Code Validation**: Function checks if the join code exists and is valid
- **User Addition**: Successfully validated codes add users to the corresponding team
- **Error Handling**: Invalid or expired codes return appropriate error messages

## 🔧 API Endpoints

### Content Generation
- `POST /api/flashcards` - Generate flashcards from content
- `POST /api/quiz` - Create quizzes with questions
- `POST /api/summary` - Generate content summaries
- `POST /api/audiobook` - Convert text to audio
- `POST /api/storyboards` - Create visual storyboards

### File Management
- `POST /api/upload-file` - Upload and process documents
- `GET /api/download-image` - Download generated images
