# Memory Capsule - Decentralized Time Capsule Platform

A SvelteKit application that enables users to create, share, and unlock "digital time capsules" containing multimedia that reveal their contents only when specific conditions are met.

## Features

### 🔐 Secure Authentication

- **Anonymous Login**: Quick start without registration
- **OAuth Integration**: GitHub login support

### 📦 Time Capsule Creation

- **Rich Content**: Text, images, videos, and audio support
- **Multiple Unlock Types**:
  - **Date-based**: Unlock at a specific future date/time
  - **Location-based**: Unlock when at specific GPS coordinates
  - **Event-based**: Unlock during custom events

### 🌍 Privacy & Sharing

- **Private Capsules**: Personal memories for future you
- **Public Capsules**: Share with the community
- **Secure Storage**: Encrypted content in Appwrite Cloud

### 🚀 Technical Stack

- **Frontend**: SvelteKit + TypeScript + TailwindCSS
- **Backend**: Appwrite Cloud (Database, Storage, Authentication, Functions, Realtime API)
- **Deployment**: Ready for Appwrite Sites

## Quick Start

### Prerequisites

- Node.js 18+ or Bun
- Appwrite Cloud account

### Setup

1. **Clone and Install**

   ```bash
   git clone <repository>
   cd Memory Capsule
   bun install  # or npm install
   ```

2. **Environment Configuration**
   `cp .env.example .env`

## Appwrite Services Used

- ✅ **Authentication**: Anonymous and OAuth sessions
- ✅ **Databases**: Capsule metadata storage
- ✅ **Storage**: Encrypted media files
- ✅ **Functions**: AI content generation
- ✅ **Realtime**: Monitoring AI function
