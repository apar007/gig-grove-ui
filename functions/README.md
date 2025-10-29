# Firebase Cloud Functions - Resume Parser

This directory contains Firebase Cloud Functions for parsing resumes using Google's Gemini AI.

## Setup Instructions

### 1. Install Dependencies
```bash
cd functions
npm install
```

### 2. Set up Gemini API Key

#### Option A: Using Firebase CLI (Recommended)
```bash
firebase functions:config:set gemini.api_key="your-actual-gemini-api-key"
```

#### Option B: For local development
Create a `.runtimeconfig.json` file in the functions directory:
```json
{
  "gemini": {
    "api_key": "your-actual-gemini-api-key"
  }
}
```

### 3. Deploy Functions
```bash
firebase deploy --only functions
```

## Functions

### `parseResume`
- **Trigger**: Automatically triggered when a file is uploaded to `resumes/{userId}/resume.pdf`
- **Purpose**: Parses PDF resume using Gemini AI and saves structured data to Firestore
- **Output**: Saves `aiProfileData` to the user's document in the `users` collection

### `processResumeManually`
- **Trigger**: HTTP callable function
- **Purpose**: Manually trigger resume processing for testing
- **Usage**: Call from your frontend application

## File Structure Expected

```
Storage Bucket:
├── resumes/
│   ├── {userId1}/
│   │   └── resume.pdf
│   ├── {userId2}/
│   │   └── resume.pdf
│   └── ...
```

## Firestore Structure

The function will create/update documents in the `users` collection:

```javascript
{
  userId: {
    aiProfileData: {
      personalInfo: {
        name: "John Doe",
        email: "john@example.com",
        phone: "+1234567890",
        location: "San Francisco, CA"
      },
      skills: ["JavaScript", "React", "Node.js", ...],
      workExperience: [
        {
          company: "Tech Corp",
          position: "Software Engineer",
          duration: "2020 - Present",
          description: "Developed web applications..."
        }
      ],
      education: [
        {
          institution: "University of Technology",
          degree: "Bachelor of Computer Science",
          duration: "2016 - 2020"
        }
      ],
      summary: "Experienced software engineer...",
      processedAt: timestamp,
      source: "gemini-ai"
    },
    resumeProcessedAt: timestamp
  }
}
```

## Error Handling

If processing fails, error information is saved to the user document:

```javascript
{
  resumeProcessingError: {
    message: "Error description",
    timestamp: timestamp
  }
}
```

## Local Development

1. Install Firebase CLI: `npm install -g firebase-tools`
2. Login: `firebase login`
3. Start emulators: `npm run serve`

## Security Rules

Make sure your Firestore security rules allow the function to write to user documents:

```javascript
// Allow functions to write to user documents
match /users/{userId} {
  allow read, write: if request.auth != null && request.auth.uid == userId;
  // Allow cloud functions to write
  allow write: if request.auth.token.firebase.sign_in_provider == 'custom';
}
```

