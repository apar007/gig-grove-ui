import { useEffect, useMemo, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import JobCard from "@/components/JobCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, SlidersHorizontal } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";

type JobData = {
  id: string; // Firestore document ID
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

const Jobs = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedJobType, setSelectedJobType] = useState("all");
  const [selectedExperience, setSelectedExperience] = useState("all");
  const [selectedLocation, setSelectedLocation] = useState("all");
  const [jobs, setJobs] = useState<JobData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        console.log('Fetching jobs from Firestore...');
        const jobsCollection = collection(db, 'jobs');
        const querySnapshot = await getDocs(jobsCollection);
        
        const jobsData: JobData[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          jobsData.push({
            id: doc.id, // Use Firestore document ID
            ...data
          } as JobData);
        });
        
        console.log(`Fetched ${jobsData.length} jobs from Firestore`);
        setJobs(jobsData);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Unknown error";
        setError(`Failed to load jobs: ${msg}`);
        console.error('Error fetching jobs:', e);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchJobs();
  }, []);

  // Filter jobs based on selected filters
  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      searchQuery === "" ||
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.skills.some((skill: string) => skill.toLowerCase().includes(searchQuery.toLowerCase())) ||
      job.description.toLowerCase().includes(searchQuery.toLowerCase());

    // For Firestore jobs, we only filter by search since they don't have jobType/experienceLevel/location
    // All jobs are remote freelance jobs from the API
    return matchesSearch;
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Browse Freelance Jobs</h1>
          <p className="text-muted-foreground">
            {filteredJobs.length} opportunities waiting for you
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-card rounded-xl shadow-soft p-6 mb-8">
          <div className="grid lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="lg:col-span-2 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search jobs or skills..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Job Type Filter */}
            <Select value={selectedJobType} onValueChange={setSelectedJobType}>
              <SelectTrigger>
                <SelectValue placeholder="Job Type" />
              </SelectTrigger>
              <SelectContent className="bg-popover z-50">
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Contract">Contract</SelectItem>
                <SelectItem value="Freelance">Freelance</SelectItem>
                <SelectItem value="Part-Time">Part-Time</SelectItem>
              </SelectContent>
            </Select>

            {/* Experience Filter */}
            <Select value={selectedExperience} onValueChange={setSelectedExperience}>
              <SelectTrigger>
                <SelectValue placeholder="Experience" />
              </SelectTrigger>
              <SelectContent className="bg-popover z-50">
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="Entry-Level">Entry-Level</SelectItem>
                <SelectItem value="Mid-Level">Mid-Level</SelectItem>
                <SelectItem value="Senior">Senior</SelectItem>
              </SelectContent>
            </Select>

            {/* Location Filter */}
            <Select value={selectedLocation} onValueChange={setSelectedLocation}>
              <SelectTrigger>
                <SelectValue placeholder="Location" />
              </SelectTrigger>
              <SelectContent className="bg-popover z-50">
                <SelectItem value="all">All Locations</SelectItem>
                <SelectItem value="Remote">Remote</SelectItem>
                <SelectItem value="New York">New York</SelectItem>
                <SelectItem value="San Francisco">San Francisco</SelectItem>
                <SelectItem value="Chicago">Chicago</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Active Filters Display */}
          {(selectedJobType !== "all" ||
            selectedExperience !== "all" ||
            selectedLocation !== "all") && (
            <div className="mt-4 flex items-center gap-2 flex-wrap">
              <span className="text-sm text-muted-foreground">Active filters:</span>
              {selectedJobType !== "all" && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setSelectedJobType("all")}
                >
                  {selectedJobType} ✕
                </Button>
              )}
              {selectedExperience !== "all" && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setSelectedExperience("all")}
                >
                  {selectedExperience} ✕
                </Button>
              )}
              {selectedLocation !== "all" && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setSelectedLocation("all")}
                >
                  {selectedLocation} ✕
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Remote/API loading & errors */}
        {isLoading && (
          <div className="text-sm text-muted-foreground mb-4">Loading jobs...</div>
        )}
        {error && (
          <div className="text-sm text-red-600 mb-4">{error}</div>
        )}

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
                id: job.id, // Use Firestore document ID
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
            <SlidersHorizontal className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">No jobs found</h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your filters or search query
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery("");
                setSelectedJobType("all");
                setSelectedExperience("all");
                setSelectedLocation("all");
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

export default Jobs;
