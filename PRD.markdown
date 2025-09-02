# Product Requirements Document (PRD): Decentralized Memory Capsule Platform

## 1. Overview

### 1.1 Project Purpose

The Decentralized Memory Capsule Platform enables users to create, share, and unlock "digital time capsules" containing multimedia (text, images, videos, audio) that reveal their contents only when specific conditions are met, such as a future date, geographic location, or external event (e.g., a birthday, a specific GPS coordinate, or a global event like a lunar eclipse). Unlike traditional social or journaling apps, this platform emphasizes emotional storytelling, privacy, and delayed reveals, fostering meaningful connections across time or communities. Built with SvelteKit for a reactive frontend and Appwrite for a secure, scalable backend, it targets creators, families, and communities for personal, historical, or collaborative use cases.

### 1.2 Business Justification

- **Impact**: Addresses the human desire to preserve and share memories for future generations, with applications in personal legacies, education, and historical preservation.
- **Creativity**: Combines time-delayed reveals, geolocation-based unlocks, and optional AI-driven content analysis (e.g., sentiment tagging) to create a unique, futuristic experience.
- **Technical Execution**: Leverages Appwrite’s authentication, database, storage, functions, messaging, and realtime services, paired with SvelteKit’s modern, reactive framework, to deliver a polished product within the hackathon’s 2-week timeline.
- **Hackathon Fit**: Showcases deep Appwrite integration, a memorable `.appwrite.network` domain (e.g., `timetravelcapsule.appwrite.network`), and a novel concept to stand out in the Appwrite Sites Hackathon (Aug 29 - Sept 12, 2025).

### 1.3 Target Audience

- **Primary Users**: Individuals (18–45) seeking to preserve personal memories (e.g., parents creating capsules for children’s milestones, couples sharing anniversary messages).
- **Secondary Users**: Communities or educators creating public capsules for historical or cultural events (e.g., a city’s centennial celebration).
- **Personas**:
  - **Emma, 30, Parent**: Wants to create a capsule with videos and letters for her child’s 18th birthday.
  - **Liam, 25, Artist**: Aims to share a public capsule with art that unlocks at a specific festival location.
  - **Maya, 40, Historian**: Seeks to preserve community stories that unlock during future events.

## 2. Project Goals

1. **Emotional Engagement**: Enable users to create and share time capsules that evoke nostalgia and connection, measurable by user feedback in the demo video.
2. **Secure and Scalable Backend**: Use Appwrite to ensure data privacy (encrypted storage) and scalability, handling at least 100 concurrent users during testing.
3. **Reactive Frontend**: Deliver a fast, intuitive UI with SvelteKit, achieving a Lighthouse score of 90+ for performance and accessibility.
4. **Hackathon Success**: Maximize impact, creativity, and technical execution scores by integrating multiple Appwrite services and deploying on a `.appwrite.network` domain.

## 3. Functional Requirements

### 3.1 User Authentication

- **Description**: Secure user sign-up and login to protect capsule ownership and access.
- **Features**:
  - OAuth 2.0 (GitHub) and Magic URL login via Appwrite Authentication.
  - Anonymous login for public capsule creation
- **Dependencies**: Appwrite SDK (`@appwrite.io/client`), SvelteKit server routes.

### 3.2 Capsule Creation

- **Description**: Allow users to create capsules with multimedia and unlock conditions.
- **Features**:
  - Form to input title, text content, multimedia (images, videos, audio), unlock conditions (date, geolocation, or event), and privacy settings (private/public).
  - Client-side encryption of multimedia using `crypto-js` before uploading to Appwrite Storage.
  - Save capsule metadata to Appwrite’s `capsules` collection.
- **Dependencies**: Appwrite Database, Storage, SvelteKit form actions, TailwindCSS for styling.
- **Success Criteria**: Users can create a capsule in under 2 minutes with a 99% success rate for uploads.

### 3.3 Capsule Unlocking

- **Description**: Display capsule contents when unlock conditions are met (date, location, or event).
- **Features**:
  - Check unlock conditions via Appwrite Functions (e.g., compare current date to `unlockDate` or user’s GPS to `unlockLocation` using Mapbox API).
  - Decrypt and display multimedia with Svelte Motion animations (e.g., “capsule opening” effect).
  - Support public capsule discovery via a map interface (using Mapbox).
- **Dependencies**: Appwrite Functions, Storage, Mapbox API, SvelteKit’s reactive stores.
- **Success Criteria**: 95% of capsules unlock correctly when conditions are met, with animations rendering in under 1 second.

### 3.4 Collaboration and Sharing

- **Description**: Enable users to share capsules with specific users or the public.
- **Features**:
  - Invite collaborators via email or user ID, stored in Appwrite’s `capsules` collection.
  - Real-time updates for collaborative editing using Appwrite’s Realtime API.
  - Share public capsules via unique URLs with SEO-friendly previews (SvelteKit SSR).
- **Dependencies**: Appwrite Realtime, Messaging, SvelteKit SSR.
- **Success Criteria**: 90% of shared capsules are accessible within 5 seconds of sharing.

### 3.5 Notifications

- **Description**: Notify users when capsules are ready to unlock or receive updates.
- **Features**:
  - Send push notifications or emails via Appwrite’s Messaging service when a capsule unlocks or is shared.
  - Notify collaborators of edits in real-time.
- **Dependencies**: Appwrite Messaging, Realtime API, SvelteKit stores.
- **Success Criteria**: 95% of notifications are delivered within 10 seconds.

### 3.6 AI Content Analysis (Stretch Goal)

- **Description**: Analyze capsule content for sentiment or themes to enhance user experience (e.g., tag a capsule as “nostalgic” or suggest related capsules).
- **Features**:
  - Use Hugging Face’s DistilBERT (via API) to analyze text content for sentiment.
  - Store tags in the `capsules` collection for searchability.
  - Suggest related public capsules based on tags.
- **Dependencies**: Appwrite Functions, Hugging Face API, SvelteKit server routes.
- **Success Criteria**: 80% accuracy in sentiment tagging, implemented if time allows.

## 4. Non-Functional Requirements

- **Performance**: Page load times under 2 seconds (Lighthouse score 90+).
- **Security**: Encrypt multimedia before storage; use Appwrite’s role-based permissions to restrict access.
- **Scalability**: Handle 100 concurrent users with no performance degradation.
- **Accessibility**: WCAG 2.1 compliance (e.g., keyboard navigation, screen reader support).
- **Mobile Responsiveness**: Fully functional on devices with screens ≥320px.

## 5. Technical Requirements

- **Frontend**:
  - SvelteKit (TypeScript) for reactive UI and SSR.
  - TailwindCSS for styling, Svelte Motion for animations.
  - Mapbox for geolocation-based unlocks.
- **Backend**:
  - Appwrite Cloud for authentication, database (`capsules`, `feedback` collections), storage, functions, messaging, and realtime.
  - Appwrite Functions (Node.js) for unlock logic and AI integration (stretch goal).
- **External APIs**:
  - Mapbox API for geolocation.
  - Hugging Face API (DistilBERT) for sentiment analysis (stretch goal).
- **Deployment**:
  - Host on Appwrite Cloud with a `.appwrite.network` domain (e.g., `timetravelcapsule.appwrite.network`).
  - GitHub repo with readme and demo video for submission.

## 6. Project Scope

- **In Scope**:
  - User authentication (OAuth, Magic URL).
  - Capsule creation with multimedia, encryption, and unlock conditions (date, location).
  - Real-time collaboration and sharing.
  - Notifications for unlocks and updates.
  - Map-based public capsule discovery.
  - AI sentiment analysis (if time allows).
- **Out of Scope** (due to hackathon timeline):
  - Augmented reality (AR) discovery.
  - Complex event-based triggers (e.g., news API integration).
  - Advanced AI features (e.g., generative visuals).

## 7. Milestones and Timeline

- **Week 1 (Aug 29 - Sept 4, 2025)**:
  - Set up SvelteKit project, Appwrite instance, and `.appwrite.network` domain.
  - Implement authentication and capsule creation (UI and backend).
  - Develop database schema and storage logic.
- **Week 2 (Sept 5 - Sept 12, 2025)**:
  - Build capsule unlocking with Mapbox integration.
  - Add collaboration, sharing, and notifications.
  - Implement AI sentiment analysis (stretch goal).
  - Test, polish UI, and deploy to Appwrite Cloud.
  - Record demo video and submit GitHub repo with readme.

## 8. Dependencies

- **Internal**:
  - Appwrite SDK for authentication, database, storage, functions, messaging, and realtime.
  - SvelteKit form actions and server routes for backend integration.
- **External**:
  - Mapbox API for geolocation-based unlocks.
  - Hugging Face API for AI sentiment analysis (stretch goal).
  - `crypto-js` for client-side encryption.
  - `browser-image-compression` for multimedia uploads.

## 9. Success Metrics

- **User Experience**: 90% of test users can create and unlock a capsule without errors.
- **Performance**: Achieve Lighthouse score of 90+ for performance and accessibility.
- **Hackathon Goals**: Integrate at least 5 Appwrite services (auth, database, storage, functions, messaging/realtime) and deploy on a `.appwrite.network` domain.
- **Engagement**: Share project on X with #SitesHack2025, aiming for 50+ engagements (likes/retweets).

## 10. Risks and Mitigations

- **Risk**: Appwrite API rate limits during testing.
  - **Mitigation**: Implement retry logic in SvelteKit server routes and cache API responses.
- **Risk**: AI API latency or cost for sentiment analysis.
  - **Mitigation**: Use lightweight Hugging Face model; make AI feature optional.
- **Risk**: Timeline constraints for polish.
  - **Mitigation**: Prioritize core features (creation, unlocking, sharing) and defer stretch goals.

## 11. Version History

| Version | Date         | Changes           |
| ------- | ------------ | ----------------- |
| 1.0     | Aug 30, 2025 | Initial PRD draft |

## 12. Authorization

- **Project Lead**: [Your Name]
- **Approval**: To be submitted as part of the Appwrite Sites Hackathon entry, with demo video and GitHub repo for stakeholder (judge) review.
