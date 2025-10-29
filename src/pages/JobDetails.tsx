import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  MapPin,
  DollarSign,
  Clock,
  Bookmark,
  ArrowLeft,
  Share2,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";

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

const JobDetails = () => {
  const { id } = useParams<{ id: string }>();
  const { currentUser } = useAuth();
  const [jobData, setJobData] = useState<JobData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // AI Draft Generation states
  const [generating, setGenerating] = useState(false);
  const [draftError, setDraftError] = useState<string | null>(null);
  const [showDraftDialog, setShowDraftDialog] = useState(false);
  const [generatedDraft, setGeneratedDraft] = useState<string>("");
  
  // Save Draft states
  const [isSaving, setIsSaving] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);

  useEffect(() => {
    const fetchJob = async () => {
      if (!id) {
        setError('No job ID provided');
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        setError(null);

        console.log('Fetching job with document ID:', id);
        
        // Fetch the document directly using the Firestore document ID
        const jobDocRef = doc(db, 'jobs', id);
        const jobDoc = await getDoc(jobDocRef);

        if (jobDoc.exists()) {
          const data = jobDoc.data() as Omit<JobData, 'id'>;
          setJobData({ id: jobDoc.id, ...data });
          console.log('Job found:', data);
        } else {
          console.log('No job found with document ID:', id);
          setError('Job not found');
        }
      } catch (err) {
        console.error('Error fetching job:', err);
        setError('Failed to load job details');
      } finally {
        setLoading(false);
      }
    };

    fetchJob();
  }, [id]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Loading job details...</h2>
            <p className="text-muted-foreground">Please wait</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Error or not found state
  if (error || !jobData) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">
              {error || 'Job not found'}
            </h2>
            <p className="text-muted-foreground mb-4">
              The job you're looking for doesn't exist or has been removed.
            </p>
            <Link to="/jobs">
              <Button variant="outline">Back to Jobs</Button>
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Format budget
  const formatBudget = () => {
    if (jobData.budgetMin && jobData.budgetMax) {
      return `${jobData.currency}${jobData.budgetMin} - ${jobData.currency}${jobData.budgetMax}`;
    } else if (jobData.budgetMin) {
      return `${jobData.currency}${jobData.budgetMin}+`;
    } else if (jobData.budgetMax) {
      return `Up to ${jobData.currency}${jobData.budgetMax}`;
    }
    return 'Budget not specified';
  };

  // Format posted date
  const formatPostedDate = () => {
    if (jobData.postedAt) {
      const date = new Date(jobData.postedAt);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    }
    return 'Recently posted';
  };

  // Handle AI Draft Generation
  const handleGenerateDraft = async () => {
    if (!currentUser) {
      alert('Please log in to use this feature');
      return;
    }

    if (!jobData) {
      setDraftError('Job data not available');
      return;
    }

    try {
      setGenerating(true);
      setDraftError(null);
      setGeneratedDraft("");

      // Get the Cloud Function URL from environment variable
      const functionUrl = import.meta.env.VITE_DRAFT_FUNCTION_URL;
      
      if (!functionUrl) {
        throw new Error('VITE_DRAFT_FUNCTION_URL environment variable is not set');
      }

      // Call the Cloud Function using fetch
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: {
            userId: currentUser.uid,
            jobDetails: jobData
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to generate application draft');
      }

      const result = await response.json();
      
      // Extract the draft from the result (wrapped in data object)
      const draft = result.data?.draft || 'No draft generated';
      setGeneratedDraft(draft);
      setShowDraftDialog(true);
      
    } catch (error: any) {
      console.error('Error generating draft:', error);
      setDraftError(error.message || 'Failed to generate application draft. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  // Handle saving draft to Firestore
  const handleSaveDraft = async () => {
    if (!currentUser) {
      alert('Please log in to save drafts');
      return;
    }

    if (!id || !jobData) {
      setDraftError('Unable to save draft: job information not available');
      return;
    }

    if (!generatedDraft) {
      setDraftError('No draft to save');
      return;
    }

    try {
      setIsSaving(true);
      setDraftSaved(false);

      // Create reference to the user's applications subcollection
      // Path: users/{userId}/applications/{jobId}
      const applicationRef = doc(db, 'users', currentUser.uid, 'applications', id);

      // Save the draft with the job details
      await setDoc(applicationRef, {
        jobId: id,
        jobTitle: jobData.title,
        draftText: generatedDraft,
        status: 'draft_saved',
        savedAt: serverTimestamp(),
        // Optionally save some job data for reference
        jobBudget: `${jobData.currency}${jobData.budgetMin || ''} - ${jobData.currency}${jobData.budgetMax || ''}`,
        jobSkills: jobData.skills,
      });

      // Show success feedback
      setDraftSaved(true);
      setTimeout(() => {
        setDraftSaved(false);
      }, 3000);

    } catch (error: any) {
      console.error('Error saving draft:', error);
      setDraftError('Failed to save draft. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Back Button */}
        <Link to="/jobs" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-smooth">
          <ArrowLeft className="w-4 h-4" />
          Back to Jobs
        </Link>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-8">
              {/* Header */}
              <div className="mb-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h1 className="text-3xl font-bold mb-2">{jobData.title}</h1>
                    <p className="text-xl text-muted-foreground font-medium">Freelancer Project</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon">
                      <Share2 className="w-5 h-5" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Bookmark className="w-5 h-5" />
                    </Button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 mb-4">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span>Remote</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <DollarSign className="w-4 h-4" />
                    <span>{formatBudget()}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>Posted {formatPostedDate()}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Badge className="bg-accent text-accent-foreground">{jobData.type}</Badge>
                  <Badge variant="secondary">{jobData.status}</Badge>
                </div>
              </div>

              <Separator className="my-6" />

              {/* Job Description */}
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-3">Job Description</h2>
                <div className="text-muted-foreground whitespace-pre-line leading-relaxed">
                  {jobData.description || 'No description available.'}
                </div>
              </div>

              <Separator className="my-6" />

              {/* Required Skills */}
              <div>
                <h2 className="text-xl font-semibold mb-3">Required Skills</h2>
                <div className="flex flex-wrap gap-2">
                  {jobData.skills && jobData.skills.length > 0 ? (
                    jobData.skills.map((skill, index) => (
                      <Badge key={index} variant="secondary" className="text-sm">
                        {skill}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-muted-foreground">No specific skills listed</p>
                  )}
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Apply Card */}
            <Card className="p-6 sticky top-24">
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Project Budget</p>
                  <p className="text-2xl font-bold text-primary">{formatBudget()}</p>
                </div>

                <Separator />

                <div>
                  <p className="text-sm text-muted-foreground mb-1">Currency</p>
                  <p className="text-lg font-semibold">{jobData.currency}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-1">Status</p>
                  <p className="text-lg font-semibold">{jobData.status}</p>
                </div>

                <Separator />

                <Button variant="hero" className="w-full" size="lg">
                  Apply Now
                </Button>

                <Button 
                  variant="default" 
                  className="w-full"
                  onClick={handleGenerateDraft}
                  disabled={generating}
                >
                  {generating ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      ✨ Generate Application Draft
                    </>
                  )}
                </Button>

                <Button variant="outline" className="w-full">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View Original Posting
                </Button>
              </div>
            </Card>

            {/* Job Stats */}
            <Card className="p-6">
              <h3 className="font-semibold mb-4">About this job</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Type</span>
                  <span className="text-sm font-medium">{jobData.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Location</span>
                  <span className="text-sm font-medium">Remote</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Posted</span>
                  <span className="text-sm font-medium">{formatPostedDate()}</span>
                </div>
                {jobData.freelancerId && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Project ID</span>
                    <span className="text-sm font-medium font-mono">{jobData.freelancerId}</span>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </main>

      <Footer />

      {/* AI Draft Dialog */}
      <Dialog open={showDraftDialog} onOpenChange={setShowDraftDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>✨ AI-Generated Application Draft</DialogTitle>
            <DialogDescription>
              Review and customize this draft application for the job posting.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {draftError && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                <p className="font-semibold">Error</p>
                <p>{draftError}</p>
              </div>
            )}
            
            {draftSaved && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
                <p className="font-semibold">✓ Draft Saved Successfully!</p>
                <p>Your draft has been saved to your profile.</p>
              </div>
            )}
            
            <Textarea
              value={generatedDraft}
              readOnly
              className="min-h-[300px] font-mono text-sm"
              placeholder="Your generated application draft will appear here..."
            />
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <div className="flex gap-2 w-full sm:w-auto">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowDraftDialog(false);
                  setDraftSaved(false);
                }}
                className="flex-1 sm:flex-none"
              >
                Close
              </Button>
              <Button 
                onClick={handleSaveDraft}
                disabled={isSaving || draftSaved || !generatedDraft}
                className="flex-1 sm:flex-none"
              >
                {isSaving ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Saving...
                  </>
                ) : draftSaved ? (
                  <>
                    ✓ Draft Saved!
                  </>
                ) : (
                  <>
                    📝 Save Draft
                  </>
                )}
              </Button>
              <Button 
                onClick={() => {
                  navigator.clipboard.writeText(generatedDraft);
                  alert('Draft copied to clipboard!');
                }}
                variant="outline"
                className="flex-1 sm:flex-none"
              >
                📋 Copy
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default JobDetails;
