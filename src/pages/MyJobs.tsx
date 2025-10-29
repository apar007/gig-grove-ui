import { useEffect, useState, useMemo } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import JobCard from "@/components/JobCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { Briefcase, Sparkles, AlertCircle, Filter, DollarSign, MapPin } from "lucide-react";

type JobData = {
  id: string;
  freelancerId: string;
  title: string;
  description: string;
  currency: string;
  budgetMin: number | null;
  budgetMax: number | null;
  skills: string[];
  postedAt: string;
  ownerId: number | null;
  type: string;
  status: string;
  source: string;
  createdAt: string;
  updatedAt: string;
};

interface ApprovedProfileData {
  personalInfo?: {
    name?: string;
    email?: string;
    phone?: string;
    location?: string;
  };
  skills?: string[];
  workExperience?: Array<{
    company: string;
    position: string;
    duration: string;
    description: string;
  }>;
  education?: Array<{
    institution: string;
    degree: string;
    duration: string;
  }>;
  summary?: string;
  jobPreferences?: {
    targetRoles?: string[];
    minimumRate?: number | null;
    rateCurrency?: string;
    workLocationPreference?: "remote" | "hybrid" | "onsite";
    preferredLocation?: string | null;
  };
  verifiedAt?: string;
}

// Helper function to format posted date
const formatPostedDate = (dateString: string): string => {
  const now = Date.now();
  const postedTime = new Date(dateString).getTime();
  const diffInMs = now - postedTime;
  const diffInSeconds = Math.floor(diffInMs / 1000);
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInDays > 0) {
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  } else if (diffInHours > 0) {
    return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  } else if (diffInMinutes > 0) {
    return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
  } else {
    return 'Just now';
  }
};

const MyJobs = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState<ApprovedProfileData | null>(null);
  const [jobs, setJobs] = useState<JobData[]>([]);
  const [allMatchedJobs, setAllMatchedJobs] = useState<JobData[]>([]); // Jobs that match skills
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter states
  const [minimumRate, setMinimumRate] = useState<number | null>(null);
  const [rateCurrency, setRateCurrency] = useState<string>("USD");
  const [selectedLocationTypes, setSelectedLocationTypes] = useState<string[]>([]);
  
  // Get user's preferred location type from their profile
  const getUserLocationPreference = useMemo(() => {
    return userProfile?.jobPreferences?.workLocationPreference || "remote";
  }, [userProfile]);
  
  // Set initial filters based on user preferences
  useEffect(() => {
    if (userProfile?.jobPreferences) {
      const prefs = userProfile.jobPreferences;
      
      // Set initial minimum rate
      if (prefs.minimumRate) {
        setMinimumRate(prefs.minimumRate);
      }
      
      // Set initial currency
      if (prefs.rateCurrency) {
        setRateCurrency(prefs.rateCurrency);
      }
      
      // Set initial location preference
      if (prefs.workLocationPreference) {
        if (prefs.workLocationPreference === "remote") {
          setSelectedLocationTypes(["Remote"]);
        } else if (prefs.workLocationPreference === "hybrid") {
          setSelectedLocationTypes(["Hybrid", "Remote"]);
        } else {
          setSelectedLocationTypes(["On-site", "Hybrid", "Remote"]);
        }
      }
    }
  }, [userProfile]);

  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser) {
        navigate('/login');
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Fetch user profile data
        console.log('Fetching user profile...');
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
          setError('User profile not found. Please complete your profile first.');
          setIsLoading(false);
          return;
        }

        const userData = userDoc.data();
        
        // Check if user has approved profile data
        if (!userData.approvedProfileData) {
          setError('Please complete your profile verification first.');
          setIsLoading(false);
          return;
        }

        const profileData = userData.approvedProfileData as ApprovedProfileData;
        setUserProfile(profileData);

        // Fetch all jobs
        console.log('Fetching jobs...');
        const jobsCollection = collection(db, 'jobs');
        const querySnapshot = await getDocs(jobsCollection);
        
        const jobsData: JobData[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          jobsData.push({
            id: doc.id,
            ...data
          } as JobData);
        });

        console.log(`Fetched ${jobsData.length} jobs from Firestore`);
        setJobs(jobsData);

        // Filter jobs based on user skills
        if (profileData.skills && profileData.skills.length > 0) {
          const userSkills = profileData.skills.map(skill => skill.toLowerCase());
          
          const filteredJobs = jobsData.filter(job => {
            if (!job.skills || job.skills.length === 0) return false;
            
            // Check if any of the job's required skills match the user's skills
            const jobSkills = job.skills.map(skill => skill.toLowerCase());
            const hasMatchingSkill = userSkills.some(userSkill => 
              jobSkills.some(jobSkill => 
                jobSkill.includes(userSkill) || userSkill.includes(jobSkill)
              )
            );
            
            return hasMatchingSkill;
          });

          console.log(`Found ${filteredJobs.length} matching jobs`);
          setAllMatchedJobs(filteredJobs);
        } else {
          setAllMatchedJobs([]);
        }

      } catch (e) {
        const msg = e instanceof Error ? e.message : "Unknown error";
        setError(`Failed to load data: ${msg}`);
        console.error('Error fetching data:', e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [currentUser, navigate]);

  // Filter jobs based on user preferences
  const filteredJobs = useMemo(() => {
    let filtered = allMatchedJobs;

    // Filter by minimum rate
    if (minimumRate !== null && minimumRate > 0) {
      filtered = filtered.filter(job => {
        // Check if job budget meets minimum rate
        if (job.budgetMin && job.budgetMin >= minimumRate) return true;
        if (job.budgetMax && job.budgetMax >= minimumRate) return true;
        return false;
      });
    }

    // Filter by location type
    if (selectedLocationTypes.length > 0) {
      // Note: Most jobs are remote in this app, so we'll just check if user wants remote
      // In a real app, jobs would have location metadata
      filtered = filtered.filter(job => {
        // For now, assume all jobs are remote unless specified otherwise
        const jobLocationType = "Remote"; // In real app, this would come from job.locationType
        return selectedLocationTypes.includes(jobLocationType);
      });
    }

    return filtered;
  }, [allMatchedJobs, minimumRate, selectedLocationTypes]);

  // Toggle location filter
  const toggleLocationType = (locationType: string) => {
    setSelectedLocationTypes(prev => {
      if (prev.includes(locationType)) {
        return prev.filter(type => type !== locationType);
      } else {
        return [...prev, locationType];
      }
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Sparkles className="w-12 h-12 mx-auto mb-4 text-primary animate-pulse" />
            <p className="text-muted-foreground">Loading your personalized job feed...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-destructive" />
            <p className="text-lg mb-4">{error}</p>
            <Button onClick={() => navigate('/profile')}>
              Go to Profile
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="w-8 h-8 text-primary" />
            <h1 className="text-4xl font-bold">My Jobs</h1>
          </div>
          <p className="text-muted-foreground">
            Personalized job recommendations based on your skills
          </p>
          {userProfile?.skills && (
            <div className="mt-4 flex flex-wrap gap-2">
              {userProfile.skills.slice(0, 5).map((skill, idx) => (
                <span key={idx} className="text-sm px-3 py-1 bg-accent rounded-full">
                  {skill}
                </span>
              ))}
              {userProfile.skills.length > 5 && (
                <span className="text-sm px-3 py-1 bg-accent rounded-full">
                  +{userProfile.skills.length - 5} more
                </span>
              )}
            </div>
          )}
        </div>

        {/* Filters */}
        <Card className="p-6 mb-8">
          <div className="flex items-center gap-2 mb-6">
            <Filter className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold">Filters</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Rate Filter */}
            <div>
              <Label htmlFor="minimumRate" className="flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4" />
                Minimum Rate per Hour
              </Label>
              <div className="flex gap-2">
                <select
                  value={rateCurrency}
                  onChange={(e) => setRateCurrency(e.target.value)}
                  className="flex h-10 w-24 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="INR">INR</option>
                  <option value="CAD">CAD</option>
                </select>
                <Input
                  id="minimumRate"
                  type="number"
                  placeholder="Enter minimum rate"
                  value={minimumRate || ""}
                  onChange={(e) => setMinimumRate(e.target.value ? parseFloat(e.target.value) : null)}
                  className="flex-1"
                  min="0"
                  step="1"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Only show jobs at or above this rate
              </p>
            </div>

            {/* Location Type Filter */}
            <div>
              <Label className="flex items-center gap-2 mb-3">
                <MapPin className="w-4 h-4" />
                Location Type
              </Label>
              <div className="flex flex-wrap gap-2">
                {["Remote", "Hybrid", "On-site"].map((type) => (
                  <Button
                    key={type}
                    type="button"
                    variant={selectedLocationTypes.includes(type) ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleLocationType(type)}
                  >
                    {type}
                  </Button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {selectedLocationTypes.length === 0 && "Select at least one location type"}
                {selectedLocationTypes.length > 0 && `Showing jobs for: ${selectedLocationTypes.join(", ")}`}
              </p>
            </div>
          </div>
        </Card>

        {/* Job Listings */}
        {filteredJobs.length > 0 ? (
          <div className="grid lg:grid-cols-2 gap-6">
            {filteredJobs.map((job) => {
              // Format budget for display
              const formatBudget = () => {
                if (job.budgetMin && job.budgetMax) {
                  return `${job.currency}${job.budgetMin}-${job.budgetMax}`;
                } else if (job.budgetMin) {
                  return `${job.currency}${job.budgetMin}+`;
                } else if (job.budgetMax) {
                  return `Up to ${job.currency}${job.budgetMax}`;
                }
                return "Rate not specified";
              };

              // Transform Firestore data to match JobCard props
              const transformedJob = {
                id: job.id,
                title: job.title,
                company: "Freelancer Project",
                location: "Remote",
                jobType: job.type || "Freelance",
                payRate: formatBudget(),
                postedDate: formatPostedDate(job.postedAt),
                description: job.description,
                skills: job.skills,
              };

              return <JobCard key={job.id} {...transformedJob} />;
            })}
          </div>
        ) : (
          <div className="text-center py-20">
            <Briefcase className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">No matching jobs found</h3>
            <p className="text-muted-foreground mb-4">
              We couldn't find any jobs that match your current skills and filters.
              Try adjusting your filters or updating your skills in your profile.
            </p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => navigate('/profile')}>
                Update Profile
              </Button>
              <Button variant="hero" onClick={() => navigate('/jobs')}>
                Browse All Jobs
              </Button>
            </div>
          </div>
        )}

        {/* Stats */}
        {filteredJobs.length > 0 && (
          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground">
              Showing {filteredJobs.length} of {allMatchedJobs.length} job{allMatchedJobs.length > 1 ? 's' : ''} matching your criteria
            </p>
          </div>
        )}
        {filteredJobs.length === 0 && allMatchedJobs.length > 0 && (
          <div className="text-center py-20">
            <Filter className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">No jobs match your filters</h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your filters to see more results
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setMinimumRate(null);
                setSelectedLocationTypes(["Remote", "Hybrid", "On-site"]);
              }}
            >
              Clear All Filters
            </Button>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default MyJobs;

