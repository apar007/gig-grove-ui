import { useState, useRef, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { storage, db } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, updateDoc, getDoc, collection, getDocs, query, where, deleteDoc } from "firebase/firestore";
import { 
  Upload, Mail, MapPin, Calendar, LogOut, FileText, CheckCircle, 
  RefreshCw, Plus, X, Save, BookmarkCheck, ExternalLink, FilePen, Copy, Check, Send
} from "lucide-react";
import JobCard from "@/components/JobCard";

interface Skill {
  id: string;
  name: string;
}

interface WorkExperience {
  id: string;
  company: string;
  position: string;
  duration: string;
  description: string;
}

interface Education {
  id: string;
  institution: string;
  degree: string;
  duration: string;
}

interface AIProfileData {
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
}

const Profile = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Resume upload states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [userResumeUrl, setUserResumeUrl] = useState<string | null>(null);
  const [loadingResume, setLoadingResume] = useState(true);
  
  // User data and verification states
  const [loadingUserData, setLoadingUserData] = useState(true);
  const [aiProfileData, setAiProfileData] = useState<AIProfileData | null>(null);
  const [personalInfo, setPersonalInfo] = useState({
    name: "",
    email: "",
    phone: "",
    location: "",
  });
  const [skills, setSkills] = useState<Skill[]>([]);
  const [newSkill, setNewSkill] = useState("");
  const [workExperience, setWorkExperience] = useState<WorkExperience[]>([]);
  const [education, setEducation] = useState<Education[]>([]);
  const [summary, setSummary] = useState("");
  const [saving, setSaving] = useState(false);
  
  // Job preferences states
  const [targetRoles, setTargetRoles] = useState<string[]>([]);
  const [newRole, setNewRole] = useState("");
  const [minimumRate, setMinimumRate] = useState("");
  const [rateCurrency, setRateCurrency] = useState("USD");
  const [workLocationPreference, setWorkLocationPreference] = useState<"remote" | "hybrid" | "onsite">("remote");
  const [preferredLocation, setPreferredLocation] = useState("");

  // Saved jobs states
  const [savedJobIds, setSavedJobIds] = useState<string[]>([]);
  const [savedJobs, setSavedJobs] = useState<any[]>([]);
  const [loadingSavedJobs, setLoadingSavedJobs] = useState(true);
  
  // Saved drafts/applications states
  const [savedDrafts, setSavedDrafts] = useState<any[]>([]);
  const [loadingDrafts, setLoadingDrafts] = useState(true);
  const [editingDrafts, setEditingDrafts] = useState<{ [key: string]: string }>({});
  const [savingDrafts, setSavingDrafts] = useState<{ [key: string]: boolean }>({});
  const [copiedDraft, setCopiedDraft] = useState<string | null>(null);
  
  // Profile form visibility
  const [showProfileForm, setShowProfileForm] = useState(false);

  // Fetch user data on mount
  useEffect(() => {
    const fetchUserData = async () => {
      if (!currentUser) return;
      
      try {
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUserResumeUrl(userData.resumeUrl || null);
          
          // Check for aiProfileData
          if (userData.aiProfileData) {
            setAiProfileData(userData.aiProfileData);
            
            // Populate form with AI data
            setPersonalInfo({
              name: userData.aiProfileData.personalInfo?.name || "",
              email: userData.aiProfileData.personalInfo?.email || "",
              phone: userData.aiProfileData.personalInfo?.phone || "",
              location: userData.aiProfileData.personalInfo?.location || "",
            });
            
            setSkills(
              (userData.aiProfileData.skills || []).map((skill: string, index: number) => ({
                id: `skill-${index}`,
                name: skill,
              }))
            );
            
            setWorkExperience(
              (userData.aiProfileData.workExperience || []).map((exp: any, index: number) => ({
                id: `exp-${index}`,
                company: exp.company || "",
                position: exp.position || "",
                duration: exp.duration || "",
                description: exp.description || "",
              }))
            );
            
            setEducation(
              (userData.aiProfileData.education || []).map((edu: any, index: number) => ({
                id: `edu-${index}`,
                institution: edu.institution || "",
                degree: edu.degree || "",
                duration: edu.duration || "",
              }))
            );
            
            setSummary(userData.aiProfileData.summary || "");
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoadingResume(false);
        setLoadingUserData(false);
      }
    };

    fetchUserData();
  }, [currentUser]);

  // Fetch saved jobs
  useEffect(() => {
    const fetchSavedJobs = async () => {
      if (!currentUser) {
        setLoadingSavedJobs(false);
        return;
      }

      try {
        // Get saved job IDs from user document
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();
          const savedIds = userData.savedJobs || [];
          setSavedJobIds(savedIds);

          if (savedIds.length > 0) {
            // Fetch full job details for each saved job
            const jobsCollection = collection(db, 'jobs');
            const allJobsSnapshot = await getDocs(jobsCollection);
            
            const allJobs: any[] = [];
            allJobsSnapshot.forEach((doc) => {
              allJobs.push({ id: doc.id, ...doc.data() });
            });

            // Filter to only include saved jobs
            const saved = allJobs.filter(job => savedIds.includes(job.id));
            setSavedJobs(saved);
          }
        }
      } catch (error) {
        console.error('Error fetching saved jobs:', error);
      } finally {
        setLoadingSavedJobs(false);
      }
    };

    fetchSavedJobs();
  }, [currentUser]);

  // Fetch saved drafts/applications
  useEffect(() => {
    const fetchSavedDrafts = async () => {
      if (!currentUser) {
        setLoadingDrafts(false);
        return;
      }

      try {
        // Fetch all documents from the applications subcollection
        const applicationsRef = collection(db, 'users', currentUser.uid, 'applications');
        const applicationsSnapshot = await getDocs(applicationsRef);
        
        const drafts: any[] = [];
        
        for (const applicationDoc of applicationsSnapshot.docs) {
          const data = applicationDoc.data();
          
          // Fetch the job details using the jobId
          if (data.jobId) {
            try {
              const jobDocRef = doc(db, 'jobs', data.jobId);
              const jobDoc = await getDoc(jobDocRef);
              
              if (jobDoc.exists()) {
                const jobData = jobDoc.data();
                drafts.push({
                  id: applicationDoc.id,
                  jobId: data.jobId,
                  jobTitle: jobData.title || data.jobTitle || 'Unknown Job',
                  draftText: data.draftText || '',
                  status: data.status || 'draft_saved',
                  savedAt: data.savedAt || null,
                  seoUrl: jobData.seoUrl || null,
                });
              } else {
                // Job was deleted, but keep the draft
                drafts.push({
                  id: applicationDoc.id,
                  jobId: data.jobId,
                  jobTitle: data.jobTitle || 'Job No Longer Available',
                  draftText: data.draftText || '',
                  status: data.status || 'draft_saved',
                  savedAt: data.savedAt || null,
                  seoUrl: null,
                });
              }
            } catch (error) {
              console.error('Error fetching job for application:', error);
            }
          }
        }
        
        setSavedDrafts(drafts);
        // Initialize editing state with current draft texts
        const initialEditing: { [key: string]: string } = {};
        drafts.forEach(draft => {
          initialEditing[draft.id] = draft.draftText;
        });
        setEditingDrafts(initialEditing);
      } catch (error) {
        console.error('Error fetching saved drafts:', error);
      } finally {
        setLoadingDrafts(false);
      }
    };

    fetchSavedDrafts();
  }, [currentUser]);

  const handleSignOut = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Failed to sign out:', error);
    }
  };

  // Resume upload handlers
  const handleChooseFile = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setUploadSuccess(false);
      setUploadError("");
    }
  };

  const handleUploadResume = async () => {
    if (!selectedFile || !currentUser) {
      setUploadError("Please select a file first");
      return;
    }

    try {
      setUploading(true);
      setUploadError("");
      setUploadSuccess(false);

      const storageRef = ref(storage, `resumes/${currentUser.uid}/resume.pdf`);
      await uploadBytes(storageRef, selectedFile);
      const downloadURL = await getDownloadURL(storageRef);

      const userDocRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userDocRef, {
        resumeUrl: downloadURL
      });

      setUserResumeUrl(downloadURL);
      setUploadSuccess(true);
      setSelectedFile(null);
      
      setTimeout(() => {
        setUploadSuccess(false);
      }, 3000);
      
    } catch (error) {
      console.error('Error uploading resume:', error);
      setUploadError('Failed to upload resume. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  // Skills management
  const handleAddSkill = () => {
    if (newSkill.trim()) {
      setSkills([...skills, { id: `skill-${Date.now()}`, name: newSkill.trim() }]);
      setNewSkill("");
    }
  };

  const handleRemoveSkill = (id: string) => {
    setSkills(skills.filter(s => s.id !== id));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddSkill();
    }
  };

  // Work experience management
  const handleAddExperience = () => {
    setWorkExperience([
      ...workExperience,
      { id: `exp-${Date.now()}`, company: "", position: "", duration: "", description: "" }
    ]);
  };

  const handleRemoveExperience = (id: string) => {
    setWorkExperience(workExperience.filter(exp => exp.id !== id));
  };

  const handleUpdateExperience = (id: string, field: string, value: string) => {
    setWorkExperience(workExperience.map(exp => 
      exp.id === id ? { ...exp, [field]: value } : exp
    ));
  };

  // Education management
  const handleAddEducation = () => {
    setEducation([
      ...education,
      { id: `edu-${Date.now()}`, institution: "", degree: "", duration: "" }
    ]);
  };

  const handleRemoveEducation = (id: string) => {
    setEducation(education.filter(edu => edu.id !== id));
  };

  const handleUpdateEducation = (id: string, field: string, value: string) => {
    setEducation(education.map(edu => 
      edu.id === id ? { ...edu, [field]: value } : edu
    ));
  };

  // Target roles management
  const handleAddRole = () => {
    if (newRole.trim()) {
      setTargetRoles([...targetRoles, newRole.trim()]);
      setNewRole("");
    }
  };

  const handleRemoveRole = (role: string) => {
    setTargetRoles(targetRoles.filter(r => r !== role));
  };

  const handleRoleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddRole();
    }
  };

  // Update draft text in editing state
  const handleUpdateDraftText = (draftId: string, text: string) => {
    setEditingDrafts({
      ...editingDrafts,
      [draftId]: text
    });
  };

  // Save updated draft to Firestore
  const handleSaveDraft = async (draftId: string) => {
    if (!currentUser) return;

    try {
      setSavingDrafts({
        ...savingDrafts,
        [draftId]: true
      });

      const updatedText = editingDrafts[draftId];
      
      if (updatedText === undefined) {
        console.error('No text to save');
        return;
      }

      // Update the draft in Firestore
      const draftRef = doc(db, 'users', currentUser.uid, 'applications', draftId);
      await updateDoc(draftRef, {
        draftText: updatedText,
        updatedAt: new Date().toISOString()
      });

      // Update local state
      setSavedDrafts(savedDrafts.map(draft => 
        draft.id === draftId ? { ...draft, draftText: updatedText } : draft
      ));

      console.log('Draft saved successfully');
      
    } catch (error) {
      console.error('Error saving draft:', error);
      alert('Failed to save draft. Please try again.');
    } finally {
      setSavingDrafts({
        ...savingDrafts,
        [draftId]: false
      });
    }
  };

  // Copy draft to clipboard
  const handleCopyDraft = async (draftId: string) => {
    const textToCopy = editingDrafts[draftId] || savedDrafts.find(d => d.id === draftId)?.draftText || '';
    
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopiedDraft(draftId);
      
      // Reset the "Copied!" state after 2 seconds
      setTimeout(() => {
        setCopiedDraft(null);
      }, 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      alert('Failed to copy to clipboard. Please try again.');
    }
  };

  // Remove saved job
  const handleRemoveSavedJob = async (jobId: string) => {
    if (!currentUser) return;

    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        const currentSavedJobs = userData.savedJobs || [];
        
        // Remove the job ID from the array
        const updatedSavedJobs = currentSavedJobs.filter((id: string) => id !== jobId);

        // Update the user document
        await updateDoc(userDocRef, {
          savedJobs: updatedSavedJobs,
        });

        // Update local state
        setSavedJobIds(updatedSavedJobs);
        setSavedJobs(savedJobs.filter(job => job.id !== jobId));
      }
    } catch (error) {
      console.error('Error removing saved job:', error);
      alert('Failed to remove saved job. Please try again.');
    }
  };

  // Remove saved draft
  const handleRemoveSavedDraft = async (draftId: string) => {
    if (!currentUser) return;

    try {
      // Delete the draft document from the applications subcollection
      const draftRef = doc(db, 'users', currentUser.uid, 'applications', draftId);
      await deleteDoc(draftRef);

      // Update local state
      setSavedDrafts(savedDrafts.filter(draft => draft.id !== draftId));
      
      // Remove from editing state
      const updatedEditingDrafts = { ...editingDrafts };
      delete updatedEditingDrafts[draftId];
      setEditingDrafts(updatedEditingDrafts);
    } catch (error) {
      console.error('Error removing saved draft:', error);
      alert('Failed to remove saved draft. Please try again.');
    }
  };

  // Mark draft as applied
  const handleMarkAsApplied = async (draftId: string) => {
    if (!currentUser) return;

    try {
      // Update the status in Firestore
      const draftRef = doc(db, 'users', currentUser.uid, 'applications', draftId);
      await updateDoc(draftRef, {
        status: 'applied',
        appliedAt: new Date().toISOString()
      });

      // Update local state
      setSavedDrafts(savedDrafts.map(draft => 
        draft.id === draftId ? { ...draft, status: 'applied' } : draft
      ));
    } catch (error) {
      console.error('Error marking draft as applied:', error);
      alert('Failed to mark as applied. Please try again.');
    }
  };

  // Save approved profile data
  const handleSaveAndRedirect = async () => {
    if (!currentUser) return;

    try {
      setSaving(true);

      const approvedProfileData = {
        personalInfo,
        skills: skills.map(s => s.name),
        workExperience: workExperience,
        education: education,
        summary,
        // Job preferences
        jobPreferences: {
          targetRoles: targetRoles,
          minimumRate: minimumRate ? parseFloat(minimumRate) : null,
          rateCurrency,
          workLocationPreference,
          preferredLocation: (workLocationPreference === "hybrid" || workLocationPreference === "onsite") ? preferredLocation : null,
        },
        verifiedAt: new Date().toISOString(),
      };

      const userDocRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userDocRef, {
        approvedProfileData,
      });

      // Redirect to personalized job feed
      navigate('/my-jobs');
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loadingUserData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Sidebar Profile */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="p-6">
              <div className="flex flex-col items-center text-center mb-6">
                <Avatar className="w-24 h-24 mb-4">
                  <AvatarImage src="" />
                  <AvatarFallback className="text-2xl gradient-hero text-white">
                    {currentUser?.email?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <h2 className="text-2xl font-bold mb-1">
                  {personalInfo.name || currentUser?.email?.split('@')[0] || 'User'}
                </h2>
                <p className="text-muted-foreground mb-4">Freelancer</p>
                <div className="w-full space-y-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => setShowProfileForm(!showProfileForm)}
                  >
                    {showProfileForm ? 'Hide Profile Details' : 'View/Edit Profile'}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={handleSignOut}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </Button>
                </div>
              </div>

              <Separator className="my-6" />

              <div className="space-y-4">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span>{personalInfo.email || currentUser?.email || 'No email'}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span>{personalInfo.location || 'Location not set'}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span>Member since {new Date(currentUser?.metadata?.creationTime || Date.now()).getFullYear()}</span>
                </div>
              </div>

              <Separator className="my-6" />

              {/* Skills display in sidebar */}
              <div>
                <h3 className="font-semibold mb-3">Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill) => (
                    <Badge key={skill.id} variant="secondary">
                      {skill.name}
                    </Badge>
                  ))}
                </div>
              </div>
            </Card>

            {/* Resume Section */}
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Resume</h3>
              
              {loadingResume ? (
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                  <p className="text-sm text-muted-foreground">Loading...</p>
                </div>
              ) : userResumeUrl ? (
                <div className="border-2 border-solid border-green-200 bg-green-50 rounded-lg p-6 text-center">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={uploading}
                  />
                  <div className="flex flex-col items-center gap-3">
                    {!selectedFile && (
                      <>
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                          <CheckCircle className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-green-900 mb-1">Resume Uploaded</p>
                          <div className="flex items-center gap-2 text-sm text-green-700">
                            <FileText className="w-4 h-4" />
                            <span>resume.pdf</span>
                          </div>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          type="button"
                          onClick={handleChooseFile}
                          disabled={uploading}
                          className="mt-2"
                        >
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Change Resume
                        </Button>
                      </>
                    )}
                    
                    {selectedFile && (
                      <>
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <FileText className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-blue-900 mb-1">New Resume Selected</p>
                          <div className="flex items-center gap-2 text-sm text-blue-700 mb-3">
                            <FileText className="w-4 h-4" />
                            <span className="truncate max-w-[200px]">{selectedFile.name}</span>
                          </div>
                        </div>
                        
                        {uploadError && (
                          <Alert variant="destructive" className="mb-2 w-full">
                            <AlertDescription className="text-xs">{uploadError}</AlertDescription>
                          </Alert>
                        )}
                        
                        <div className="flex gap-2 w-full">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            type="button"
                            onClick={() => setSelectedFile(null)}
                            disabled={uploading}
                            className="flex-1"
                          >
                            Cancel
                          </Button>
                          <Button 
                            variant="hero" 
                            size="sm" 
                            type="button"
                            onClick={handleUploadResume}
                            disabled={uploading}
                            className="flex-1"
                          >
                            {uploading ? 'Uploading...' : 'Upload New Resume'}
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                  <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-3">
                    Upload your resume (PDF only)
                  </p>
                  
                  {uploadSuccess && (
                    <Alert className="mb-3 bg-green-50 border-green-200">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-800">
                        Resume uploaded successfully!
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {uploadError && (
                    <Alert variant="destructive" className="mb-3">
                      <AlertDescription>{uploadError}</AlertDescription>
                    </Alert>
                  )}
                  
                  {selectedFile && (
                    <div className="mb-3 p-2 bg-accent rounded-lg">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium truncate">
                          {selectedFile.name}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf"
                      onChange={handleFileChange}
                      className="hidden"
                      disabled={uploading}
                    />
                    <Button 
                      variant="outline" 
                      size="sm" 
                      type="button"
                      onClick={handleChooseFile}
                      disabled={uploading}
                    >
                      Choose File
                    </Button>
                    
                    {selectedFile && (
                      <Button 
                        variant="hero" 
                        size="sm" 
                        onClick={handleUploadResume}
                        disabled={uploading}
                        className="w-full"
                      >
                        {uploading ? 'Uploading...' : 'Upload Resume'}
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {aiProfileData ? (
              <>
                {showProfileForm ? (
                  <Card className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h1 className="text-3xl font-bold mb-2">Verify Your Profile</h1>
                        <p className="text-muted-foreground">
                          Review and edit your AI-extracted profile information
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowProfileForm(false)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>

                <div className="space-y-6">
                  {/* Personal Information */}
                  <div>
                    <h2 className="text-xl font-semibold mb-4">Personal Information</h2>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">Name</Label>
                        <Input
                          id="name"
                          value={personalInfo.name}
                          onChange={(e) => setPersonalInfo({ ...personalInfo, name: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={personalInfo.email}
                          onChange={(e) => setPersonalInfo({ ...personalInfo, email: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                          id="phone"
                          value={personalInfo.phone}
                          onChange={(e) => setPersonalInfo({ ...personalInfo, phone: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="location">Location</Label>
                        <Input
                          id="location"
                          value={personalInfo.location}
                          onChange={(e) => setPersonalInfo({ ...personalInfo, location: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Skills */}
                  <div>
                    <h2 className="text-xl font-semibold mb-4">Skills</h2>
                    <div className="flex gap-2 mb-3">
                      <Input
                        placeholder="Add a skill"
                        value={newSkill}
                        onChange={(e) => setNewSkill(e.target.value)}
                        onKeyPress={handleKeyPress}
                      />
                      <Button type="button" onClick={handleAddSkill}>
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {skills.map((skill) => (
                        <Badge key={skill.id} variant="secondary" className="text-sm px-3 py-1">
                          {skill.name}
                          <button
                            type="button"
                            onClick={() => handleRemoveSkill(skill.id)}
                            className="ml-2 hover:text-red-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Work Experience */}
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-xl font-semibold">Work Experience</h2>
                      <Button type="button" variant="outline" size="sm" onClick={handleAddExperience}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Experience
                      </Button>
                    </div>
                    <div className="space-y-4">
                      {workExperience.map((exp) => (
                        <Card key={exp.id} className="p-4">
                          <div className="flex justify-end mb-2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveExperience(exp.id)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="grid md:grid-cols-2 gap-3">
                            <div>
                              <Label>Company</Label>
                              <Input
                                value={exp.company}
                                onChange={(e) => handleUpdateExperience(exp.id, 'company', e.target.value)}
                              />
                            </div>
                            <div>
                              <Label>Position</Label>
                              <Input
                                value={exp.position}
                                onChange={(e) => handleUpdateExperience(exp.id, 'position', e.target.value)}
                              />
                            </div>
                            <div>
                              <Label>Duration</Label>
                              <Input
                                value={exp.duration}
                                onChange={(e) => handleUpdateExperience(exp.id, 'duration', e.target.value)}
                                placeholder="e.g., Jan 2020 - Dec 2022"
                              />
                            </div>
                          </div>
                          <div className="mt-3">
                            <Label>Description</Label>
                            <Textarea
                              value={exp.description}
                              onChange={(e) => handleUpdateExperience(exp.id, 'description', e.target.value)}
                              rows={2}
                            />
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Education */}
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-xl font-semibold">Education</h2>
                      <Button type="button" variant="outline" size="sm" onClick={handleAddEducation}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Education
                      </Button>
                    </div>
                    <div className="space-y-4">
                      {education.map((edu) => (
                        <Card key={edu.id} className="p-4">
                          <div className="flex justify-end mb-2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveEducation(edu.id)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="grid md:grid-cols-2 gap-3">
                            <div>
                              <Label>Institution</Label>
                              <Input
                                value={edu.institution}
                                onChange={(e) => handleUpdateEducation(edu.id, 'institution', e.target.value)}
                              />
                            </div>
                            <div>
                              <Label>Degree</Label>
                              <Input
                                value={edu.degree}
                                onChange={(e) => handleUpdateEducation(edu.id, 'degree', e.target.value)}
                              />
                            </div>
                            <div className="md:col-span-2">
                              <Label>Duration</Label>
                              <Input
                                value={edu.duration}
                                onChange={(e) => handleUpdateEducation(edu.id, 'duration', e.target.value)}
                                placeholder="e.g., 2018 - 2022"
                              />
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Summary */}
                  <div>
                    <h2 className="text-xl font-semibold mb-4">Professional Summary</h2>
                    <Textarea
                      value={summary}
                      onChange={(e) => setSummary(e.target.value)}
                      rows={4}
                      placeholder="Write a brief professional summary..."
                    />
                  </div>

                  <Separator />

                  {/* Job Preferences */}
                  <div>
                    <h2 className="text-xl font-semibold mb-4">Job Preferences</h2>
                    
                    {/* Target Roles */}
                    <div className="mb-6">
                      <Label className="text-base">Target Role(s)</Label>
                      <div className="flex gap-2 mt-2">
                        <Input
                          placeholder="Enter desired role (e.g., React Developer)"
                          value={newRole}
                          onChange={(e) => setNewRole(e.target.value)}
                          onKeyPress={handleRoleKeyPress}
                        />
                        <Button type="button" onClick={handleAddRole}>
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {targetRoles.map((role) => (
                          <Badge key={role} variant="secondary" className="text-sm px-3 py-1">
                            {role}
                            <button
                              type="button"
                              onClick={() => handleRemoveRole(role)}
                              className="ml-2 hover:text-red-600"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Desired Rate/Budget */}
                    <div className="mb-6">
                      <Label className="text-base">Minimum Hourly Rate</Label>
                      <div className="flex gap-2 mt-2">
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
                          type="number"
                          placeholder="e.g., 50"
                          value={minimumRate}
                          onChange={(e) => setMinimumRate(e.target.value)}
                          className="flex-1"
                        />
                        <div className="flex items-center text-sm text-muted-foreground">
                          per hour
                        </div>
                      </div>
                    </div>

                    {/* Location Preference */}
                    <div className="mb-6">
                      <Label className="text-base">Work Location Preference</Label>
                      <div className="flex gap-4 mt-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="workLocation"
                            value="remote"
                            checked={workLocationPreference === "remote"}
                            onChange={(e) => setWorkLocationPreference(e.target.value as "remote" | "hybrid" | "onsite")}
                            className="w-4 h-4"
                          />
                          Remote Only
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="workLocation"
                            value="hybrid"
                            checked={workLocationPreference === "hybrid"}
                            onChange={(e) => setWorkLocationPreference(e.target.value as "remote" | "hybrid" | "onsite")}
                            className="w-4 h-4"
                          />
                          Hybrid
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="workLocation"
                            value="onsite"
                            checked={workLocationPreference === "onsite"}
                            onChange={(e) => setWorkLocationPreference(e.target.value as "remote" | "hybrid" | "onsite")}
                            className="w-4 h-4"
                          />
                          On-site
                        </label>
                      </div>
                      {(workLocationPreference === "hybrid" || workLocationPreference === "onsite") && (
                        <div className="mt-3">
                          <Input
                            placeholder="Preferred city/country (e.g., New York, USA)"
                            value={preferredLocation}
                            onChange={(e) => setPreferredLocation(e.target.value)}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Save Button */}
                  <div className="flex justify-end pt-4">
                    <Button
                      variant="hero"
                      size="lg"
                      onClick={handleSaveAndRedirect}
                      disabled={saving}
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {saving ? 'Saving...' : 'Save Profile and Find My Jobs'}
                    </Button>
                  </div>
                </div>
                  </Card>
                ) : (
                  <>
                    {/* Saved Jobs Section */}
                    <Card className="p-6">
                      <h3 className="font-semibold mb-4 flex items-center gap-2">
                        <BookmarkCheck className="w-5 h-5 text-primary" />
                        Saved Jobs
                      </h3>
                      
                      {loadingSavedJobs ? (
                        <div className="text-center py-8">
                          <p className="text-sm text-muted-foreground">Loading...</p>
                        </div>
                      ) : savedJobs.length === 0 ? (
                        <div className="text-center py-8">
                          <BookmarkCheck className="w-12 h-12 mx-auto mb-2 text-muted-foreground opacity-50" />
                          <p className="text-sm text-muted-foreground mb-3">
                            No saved jobs yet
                          </p>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => navigate('/jobs')}
                          >
                            Browse Jobs
                          </Button>
                        </div>
                      ) : (
                        <div className="grid md:grid-cols-2 gap-4">
                          {savedJobs.map((job) => {
                            const formatBudget = () => {
                              if (job.budgetMin && job.budgetMax) {
                                return `${job.currency || '$'}${job.budgetMin}-${job.budgetMax}`;
                              } else if (job.budgetMin) {
                                return `${job.currency || '$'}${job.budgetMin}+`;
                              } else if (job.budgetMax) {
                                return `Up to ${job.currency || '$'}${job.budgetMax}`;
                              }
                              return "Rate not specified";
                            };

                            return (
                              <div 
                                key={job.id} 
                                className="border rounded-lg p-4 hover:bg-accent/50 transition-colors relative"
                              >
                                <div className="flex items-start justify-between gap-2 mb-2">
                                  <a
                                    href={`/jobs/${job.id}`}
                                    onClick={(e) => {
                                      e.preventDefault();
                                      navigate(`/jobs/${job.id}`);
                                    }}
                                    className="font-semibold text-base line-clamp-2 hover:text-primary flex-1 cursor-pointer"
                                  >
                                    {job.title}
                                  </a>
                                  <div className="flex items-center gap-1 flex-shrink-0">
                                    {job.seoUrl && (
                                      <a
                                        href={`https://www.freelancer.com/projects/${job.seoUrl}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-center h-8 w-8 rounded-md hover:bg-accent transition-colors"
                                        title="View Original Job on Freelancer"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <ExternalLink className="w-4 h-4" />
                                      </a>
                                    )}
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 p-0"
                                      onClick={() => handleRemoveSavedJob(job.id)}
                                      title="Remove Saved Job"
                                    >
                                      <X className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                                  {job.description}
                                </p>
                                <div className="flex flex-wrap gap-1 mb-3">
                                  {job.skills?.slice(0, 3).map((skill: string, idx: number) => (
                                    <Badge key={idx} variant="secondary" className="text-xs">
                                      {skill}
                                    </Badge>
                                  ))}
                                  {job.skills && job.skills.length > 3 && (
                                    <Badge variant="outline" className="text-xs">
                                      +{job.skills.length - 3}
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm font-semibold text-primary">
                                  {formatBudget()}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </Card>

                    {/* Saved Drafts Section */}
                    <Card className="p-6">
                      <h3 className="font-semibold mb-4 flex items-center gap-2">
                        <FilePen className="w-5 h-5 text-primary" />
                        Saved Application Drafts
                      </h3>
                      
                      {loadingDrafts ? (
                        <div className="text-center py-8">
                          <p className="text-sm text-muted-foreground">Loading...</p>
                        </div>
                      ) : savedDrafts.length === 0 ? (
                        <div className="text-center py-8">
                          <FilePen className="w-12 h-12 mx-auto mb-2 text-muted-foreground opacity-50" />
                          <p className="text-sm text-muted-foreground mb-3">
                            No saved drafts yet
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Generate and save application drafts from job pages
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {savedDrafts.map((draft) => {
                            const isApplied = draft.status === 'applied';
                            return (
                            <div 
                              key={draft.id} 
                              className={`border rounded-lg p-4 bg-background ${
                                isApplied ? 'border-green-200 bg-green-50/30' : ''
                              }`}
                            >
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                  <a
                                    href={`/jobs/${draft.jobId}`}
                                    onClick={(e) => {
                                      e.preventDefault();
                                      navigate(`/jobs/${draft.jobId}`);
                                    }}
                                    className="font-semibold text-base mb-1 block hover:text-primary cursor-pointer"
                                  >
                                    {draft.jobTitle}
                                  </a>
                                  <div className="flex items-center gap-2 mb-2">
                                    <Badge 
                                      variant={isApplied ? "default" : "secondary"} 
                                      className={`text-xs ${isApplied ? 'bg-green-600 hover:bg-green-700' : ''}`}
                                    >
                                      {isApplied ? (
                                        <>
                                          <CheckCircle className="w-3 h-3 mr-1" />
                                          Applied
                                        </>
                                      ) : (
                                        'Draft'
                                      )}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground">
                                      {draft.savedAt && (
                                        new Date(draft.savedAt?.seconds ? draft.savedAt.seconds * 1000 : draft.savedAt).toLocaleDateString()
                                      )}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1 flex-shrink-0">
                                  {draft.seoUrl && (
                                    <a
                                      href={`https://www.freelancer.com/projects/${draft.seoUrl}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center justify-center h-9 w-9 rounded-md hover:bg-accent transition-colors"
                                      title="View Original Job on Freelancer"
                                    >
                                      <ExternalLink className="w-4 h-4" />
                                    </a>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-9 w-9 p-0"
                                    onClick={() => handleRemoveSavedDraft(draft.id)}
                                    title="Remove Saved Draft"
                                  >
                                    <X className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                              
                              <Textarea
                                value={editingDrafts[draft.id] || ''}
                                onChange={(e) => handleUpdateDraftText(draft.id, e.target.value)}
                                className="min-h-[120px] text-sm mb-3"
                                placeholder="Your application draft..."
                              />
                              
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex-1"
                                  onClick={() => handleCopyDraft(draft.id)}
                                  disabled={!!copiedDraft && copiedDraft === draft.id}
                                >
                                  {copiedDraft === draft.id ? (
                                    <>
                                      <Check className="w-3 h-3 mr-2" />
                                      Copied!
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3 h-3 mr-2" />
                                      Copy Draft
                                    </>
                                  )}
                                </Button>
                                <Button
                                  variant="default"
                                  size="sm"
                                  className="flex-1"
                                  onClick={() => handleSaveDraft(draft.id)}
                                  disabled={savingDrafts[draft.id]}
                                >
                                  {savingDrafts[draft.id] ? (
                                    <>
                                      <RefreshCw className="w-3 h-3 mr-2 animate-spin" />
                                      Saving...
                                    </>
                                  ) : (
                                    <>
                                      <Save className="w-3 h-3 mr-2" />
                                      Save Changes
                                    </>
                                  )}
                                </Button>
                                {!isApplied ? (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex-1"
                                    onClick={() => handleMarkAsApplied(draft.id)}
                                  >
                                    <Send className="w-3 h-3 mr-2" />
                                    Mark as Applied
                                  </Button>
                                ) : (
                                  <Button
                                    variant="default"
                                    size="sm"
                                    className="flex-1 bg-green-600 hover:bg-green-700"
                                    disabled
                                  >
                                    <CheckCircle className="w-3 h-3 mr-2" />
                                    Applied
                                  </Button>
                                )}
                              </div>
                            </div>
                            );
                          })}
                        </div>
                      )}
                    </Card>
                  </>
                )}
              </>
            ) : (
              <Card className="p-12 text-center">
                <Upload className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h2 className="text-2xl font-bold mb-2">Upload Your Resume</h2>
                <p className="text-muted-foreground mb-6">
                  Upload your resume to get started. Our AI will extract your profile information.
                </p>
                <p className="text-sm text-muted-foreground">
                  Please upload a resume PDF from the sidebar to begin.
                </p>
              </Card>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Profile;
