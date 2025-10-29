import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { config } from 'dotenv';

// Load environment variables from .env.local
config({ path: '.env.local' });

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

type FreelancerProjectList = {
  id: number | string;
  seo_url?: string;
  title?: string;
};

type FreelancerProjectDetail = {
  id: number | string;
  title: string;
  description?: string;
  currency?: { code?: string };
  budget?: { minimum?: number; maximum?: number };
  jobs?: { name: string }[];
  time_submitted?: number;
  owner_id?: number;
  type?: string;
  status?: string;
};

type FreelancerProjectsResponse = {
  result?: {
    projects?: FreelancerProjectList[];
  };
};

type FreelancerProjectDetailResponse = {
  result?: FreelancerProjectDetail;
};

const deleteAllJobs = async () => {
  try {
    console.log('🗑️  Deleting all existing jobs from database...\n');
    
    const jobsCollection = collection(db, 'jobs');
    const snapshot = await getDocs(jobsCollection);
    
    if (snapshot.empty) {
      console.log('   ℹ️  No existing jobs found. Database is already empty.\n');
      return;
    }
    
    const deletePromises = snapshot.docs.map((docSnapshot) => {
      return deleteDoc(doc(db, 'jobs', docSnapshot.id));
    });
    
    await Promise.all(deletePromises);
    console.log(`   ✅ Successfully deleted ${snapshot.size} existing job(s)\n`);
  } catch (error) {
    console.error('   ❌ Error deleting existing jobs:', error);
    throw error;
  }
};

const seedJobs = async () => {
  try {
    console.log('🚀 Starting job seeding process...\n');

    // Get API credentials from environment
    const baseUrl = process.env.VITE_FREELANCER_API_URL;
    const apiKey = process.env.VITE_FREELANCER_API_KEY;

    if (!baseUrl || !apiKey) {
      throw new Error('Missing VITE_FREELANCER_API_URL or VITE_FREELANCER_API_KEY in .env.local');
    }

    // Delete all existing jobs before fetching new ones
    await deleteAllJobs();

    // STEP 1: First Fetch - Get the list with NO projections (gets id and seo_url)
    console.log('📡 Step 1: Fetching project list (with id and seo_url)...');
    const listUrl = `${baseUrl.replace(/\/$/, '')}/projects/0.1/projects/active/`;
    
    const listResponse = await fetch(listUrl, {
      headers: {
        'freelancer-oauth-v1': apiKey,
        'Accept': 'application/json',
      },
    });

    if (!listResponse.ok) {
      throw new Error(`API request failed with status ${listResponse.status}`);
    }

    const listData: FreelancerProjectsResponse = await listResponse.json();
    const projects = listData?.result?.projects ?? [];

    console.log(`✅ Successfully fetched ${projects.length} project IDs from API\n`);

    if (projects.length === 0) {
      console.log('⚠️  No projects to seed. Exiting...');
      return;
    }

    // STEP 2: Loop through each project and fetch details
    console.log('📡 Step 2: Fetching details for each project...\n');
    console.log('💾 Storing jobs in Firestore...\n');

    let successCount = 0;
    let errorCount = 0;

    // Loop through each project
    for (const project of projects) {
      try {
        // STEP 3: Second Fetch - Get full details for this project
        const detailUrl = `${baseUrl.replace(/\/$/, '')}/projects/0.1/projects/${project.id}/?full_description=true&job_details=true`;
        
        const detailResponse = await fetch(detailUrl, {
          headers: {
            'freelancer-oauth-v1': apiKey,
            'Accept': 'application/json',
          },
        });

        if (!detailResponse.ok) {
          console.error(`   ⚠️  Failed to fetch details for project ${project.id} (status: ${detailResponse.status})`);
          errorCount++;
          continue;
        }

        const detailData: FreelancerProjectDetailResponse = await detailResponse.json();
        const detailedProject = detailData?.result;

        if (!detailedProject) {
          console.error(`   ⚠️  No detail data for project ${project.id}`);
          errorCount++;
          continue;
        }

        // STEP 4: Combine data from both calls
        const completeJob = {
          freelancerId: String(project.id),
          title: detailedProject.title || '',
          description: detailedProject.description || '',
          currency: detailedProject.currency?.code || 'USD',
          budgetMin: detailedProject.budget?.minimum || null,
          budgetMax: detailedProject.budget?.maximum || null,
          skills: detailedProject.jobs?.map((j) => j.name) || [],
          postedAt: detailedProject.time_submitted 
            ? new Date(detailedProject.time_submitted * 1000).toISOString()
            : new Date().toISOString(),
          ownerId: detailedProject.owner_id || null,
          type: detailedProject.type || 'hourly',
          status: detailedProject.status || 'open',
          seoUrl: project.seo_url || null, // From first call
          source: 'freelancer_api',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        // STEP 5: Save to Firestore (inside the loop)
        await addDoc(collection(db, 'jobs'), completeJob);
        successCount++;
        
        // Progress indicator
        if (successCount % 10 === 0 || successCount === projects.length) {
          console.log(`   Progress: ${successCount}/${projects.length} jobs processed...`);
        }
      } catch (error) {
        errorCount++;
        console.error(`   ❌ Error processing project ${project.id}:`, error);
      }
    }

    console.log('\n✨ Seeding complete!');
    console.log(`   ✅ Successfully stored: ${successCount} jobs`);
    if (errorCount > 0) {
      console.log(`   ⚠️  Errors: ${errorCount} jobs`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  }
};

// Run the seed function
seedJobs();

