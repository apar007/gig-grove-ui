import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as pdfParse from "pdf-parse";
import { GoogleGenerativeAI } from "@google/generative-ai";
import * as cors from "cors";

// Initialize Firebase Admin
admin.initializeApp();

/**
 * Cloud Function that triggers when a resume PDF is uploaded
 * Path: resumes/{userId}/resume.pdf
 */
export const parseResume = functions.runWith({ secrets: ["GEMINI_API_KEY"] })
  .storage.object().onFinalize(async (object) => {
  const filePath = object.name;
  const bucket = admin.storage().bucket(object.bucket);

  // Check if this is a resume file in the correct path
  if (!filePath || !filePath.match(/^resumes\/[^\/]+\/resume\.pdf$/)) {
    console.log("File is not a resume PDF, skipping...");
    return null;
  }

  // Extract userId from the file path
  const pathParts = filePath.split("/");
  const userId = pathParts[1];

  if (!userId) {
    console.error("Could not extract userId from file path:", filePath);
    return null;
  }

  console.log(`Processing resume for user: ${userId}`);

  try {
    // Download the PDF file
    const file = bucket.file(filePath);
    const [fileBuffer] = await file.download();

    console.log("PDF file downloaded successfully");

    // Parse PDF to extract text
    const pdfData = await pdfParse(fileBuffer);
    const resumeText = pdfData.text;

    console.log("PDF text extracted, length:", resumeText.length);

    if (!resumeText || resumeText.trim().length === 0) {
      throw new Error("No text could be extracted from the PDF");
    }

    // Prepare prompt for Gemini AI
    const prompt = `
Please analyze the following resume text and extract structured information. 
Return ONLY a valid JSON object with the following structure:

{
  "personalInfo": {
    "name": "Full name",
    "email": "Email address",
    "phone": "Phone number",
    "location": "City, State/Country"
  },
  "skills": [
    "List of technical and professional skills"
  ],
  "workExperience": [
    {
      "company": "Company name",
      "position": "Job title",
      "duration": "Start date - End date",
      "description": "Brief description of responsibilities and achievements"
    }
  ],
  "education": [
    {
      "institution": "School/University name",
      "degree": "Degree type and field",
      "duration": "Start date - End date"
    }
  ],
  "summary": "A brief professional summary based on the resume content"
}

Extract information only if it's clearly present in the resume. Use null for missing fields.

Resume text:
${resumeText}
`;

    // Initialize Gemini AI (at runtime, not deploy time)
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY environment variable is not set.");
    }
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    // Call Gemini AI
    const model = genAI.getGenerativeModel({ model: "models/gemini-2.0-flash-001" });
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const aiResponseText = response.text();

    console.log("Gemini AI response received");

    // Parse the JSON response
    let aiProfileData;
    try {
      // Clean the response to extract JSON (remove any markdown formatting)
      const cleanedResponse = aiResponseText
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
      
      aiProfileData = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error("Failed to parse AI response as JSON:", parseError);
      console.error("AI Response:", aiResponseText);
      throw new Error("AI response was not valid JSON");
    }

    // Add metadata
    aiProfileData.processedAt = admin.firestore.FieldValue.serverTimestamp();
    aiProfileData.source = "gemini-ai";

    // Save to user's document in Firestore
    const userDocRef = admin.firestore().collection("users").doc(userId);
    
    await userDocRef.set({
      aiProfileData: aiProfileData,
      resumeProcessedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    console.log(`Successfully processed resume and saved AI profile data for user: ${userId}`);

    return {
      success: true,
      userId: userId,
      message: "Resume processed successfully",
    };

  } catch (error) {
    console.error("Error processing resume:", error);

    // Save error information to user document
    try {
      const userDocRef = admin.firestore().collection("users").doc(userId);
      await userDocRef.set({
        resumeProcessingError: {
          message: error instanceof Error ? error.message : "Unknown error",
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
        },
      }, { merge: true });
    } catch (saveError) {
      console.error("Failed to save error to user document:", saveError);
    }

    throw error;
  }
});

/**
 * HTTP function to manually trigger resume processing (for testing)
 */
export const processResumeManually = functions.https.onCall(async (data, context) => {
  // Check if user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "The function must be called while authenticated."
    );
  }

  const userId = context.auth.uid;
  const resumePath = `resumes/${userId}/resume.pdf`;

  console.log(`Manual processing requested for user: ${userId}`);

  try {
    const bucket = admin.storage().bucket();
    const file = bucket.file(resumePath);

    // Check if file exists
    const [exists] = await file.exists();
    if (!exists) {
      throw new functions.https.HttpsError(
        "not-found",
        "Resume file not found. Please upload a resume first."
      );
    }

    // Trigger the same processing logic
    const [metadata] = await file.getMetadata();
    
    // Simulate the storage trigger
    await parseResume.run({
      name: resumePath,
      bucket: bucket.name,
      ...metadata,
    } as any, {} as any);

    return {
      success: true,
      message: "Resume processing initiated successfully",
    };

  } catch (error) {
    console.error("Manual processing error:", error);
    
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }

    throw new functions.https.HttpsError(
      "internal",
      "Failed to process resume",
      error
    );
  }
});

/**
 * HTTP function to generate AI-powered application draft
 * Expects: { data: { userId, jobDetails } } in POST body
 * Returns: Generated application draft text
 */
export const generateApplicationDraft = functions
  .region('us-central1')
  .runWith({ secrets: ["GEMINI_API_KEY"] })
  .https.onRequest(async (request, response) => {
  // CORS configuration - allow all origins
  const corsHandler = cors({ origin: true });
  
  // Apply CORS to the response
  return new Promise<void>((resolve) => {
    corsHandler(request, response, async () => {
      // Handle preflight OPTIONS request
      if (request.method === 'OPTIONS') {
        response.status(204).send();
        return resolve();
      }

      // Only allow POST requests
      if (request.method !== 'POST') {
        response.status(405).json({ error: { message: 'Method not allowed' } });
        return resolve();
      }

      try {
        // Read data from request body (wrapped in data object)
        const { userId, jobDetails } = request.body.data || {};

        // Validate input
        if (!userId) {
          response.status(400).json({ error: { message: 'userId is required' } });
          return resolve();
        }

        if (!jobDetails || !jobDetails.description || !jobDetails.skills) {
          response.status(400).json({ 
            error: { message: 'jobDetails with description and skills is required' } 
          });
          return resolve();
        }

        console.log(`Generating application draft for user: ${userId}`);

        // Fetch user's approved profile data from Firestore
        const userDocRef = admin.firestore().collection("users").doc(userId);
        const userDoc = await userDocRef.get();

        if (!userDoc.exists) {
          response.status(404).json({ error: { message: 'User profile not found' } });
          return resolve();
        }

        const userData = userDoc.data();
        
        if (!userData || !userData.approvedProfileData) {
          response.status(412).json({ 
            error: { message: 'User profile has not been approved yet. Please complete profile verification.' } 
          });
          return resolve();
        }

        const approvedProfileData = userData.approvedProfileData;

        // Extract key information
        const userSkills = approvedProfileData.skills || [];
        const userSummary = approvedProfileData.summary || "";
        const workExperience = approvedProfileData.workExperience || [];
        const userEducation = approvedProfileData.education || [];
        const personalInfo = approvedProfileData.personalInfo || {};

        // Build experience highlights
        const experienceHighlights = workExperience
          .slice(0, 3)
          .map((exp: any) => 
            `${exp.position} at ${exp.company} (${exp.duration}): ${exp.description}`
          )
          .join("\n");

        // Construct the prompt for Gemini API
        const prompt = `You are helping a freelancer create a compelling, bid-winning application for a job on a freelancing platform.

**Job Details:**
Title: ${jobDetails.title || "Freelance Position"}
Description: ${jobDetails.description}

Required Skills: ${jobDetails.skills.join(", ")}

**Applicant's Profile:**
Name: ${personalInfo.name || "Professional"}
Skills: ${userSkills.join(", ")}
${userSummary ? `Summary: ${userSummary}` : ""}

${experienceHighlights ? `Recent Experience:\n${experienceHighlights}` : ""}
${userEducation.length > 0 ? `Education: ${userEducation.map((edu: any) => `${edu.degree} from ${edu.institution}`).join(", ")}` : ""}

**CRITICAL INSTRUCTIONS - Follow these EXACTLY:**

Generate a professional application draft that:

1. **GREETING:** Start with a friendly but professional greeting. DO NOT use placeholders like "[Employer Name]", "Sir/Madam", or any generic terms. Use "Hi there," or address the project directly. NEVER personalize with the employer's name since you don't have it.

2. **PROJECT FOCUS:** Heavily emphasize and demonstrate understanding of THIS SPECIFIC PROJECT. Deeply reference the job description: "${jobDetails.description}". Show you've read and understood their exact needs. Be specific about what they're trying to achieve.

3. **SKILL MATCHING:** Cross-reference the required skills (${jobDetails.skills.join(", ")}) with the applicant's skills (${userSkills.join(", ")}) and explicitly mention 1-2 KEY skills where there's a clear match. Be specific: say which skills and how they apply to THIS project.

4. **RELEVANT EXPERIENCE:** If there's experience that matches this project, mention 1-2 specific examples. If not, focus more on how the skills transfer to this project.

5. **CONCISENESS:** Keep it to 2-3 SHORT paragraphs maximum. Be direct and avoid fluff. Freelancers value efficiency.

6. **INCLUDE A QUESTION:** End with ONE relevant, open-ended question about the project that shows genuine interest and encourages a reply. Make it specific to their project, not generic.

7. **ADD PROOF PLACEHOLDER:** Include the following placeholder text exactly as shown: "[Briefly mention a relevant past project similar to this one]"

8. **NO GENERIC LANGUAGE:** Avoid phrases like "I am a hard worker" or "I can help you." Every sentence should be tailored to THIS SPECIFIC JOB and THIS SPECIFIC USER. Show you understand their unique needs.

9. **TONE:** Professional but warm and human. Avoid corporate jargon. Speak like a real person who's excited about their project.

Now generate the application draft. It should feel completely personalized and show you've read their job description carefully:`;

        // Initialize Gemini AI
        if (!process.env.GEMINI_API_KEY) {
          throw new Error("GEMINI_API_KEY environment variable is not set.");
        }
        
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ 
          model: "models/gemini-2.0-flash-001"
        });

        console.log("Calling Gemini API to generate application draft...");
        
        const result = await model.generateContent(prompt);
        const aiResponse = await result.response;
        const draftText = aiResponse.text();

        console.log("Application draft generated successfully");

        // Return success response wrapped in data object
        response.status(200).json({
          data: {
            success: true,
            draft: draftText,
            userId: userId,
            jobTitle: jobDetails.title,
          }
        });
        return resolve();

      } catch (error) {
        console.error("Error generating application draft:", error);

        response.status(500).json({
          error: { 
            message: 'Failed to generate application draft',
            details: error instanceof Error ? error.message : 'Unknown error'
          }
        });
        return resolve();
      }
    });
  });
});

