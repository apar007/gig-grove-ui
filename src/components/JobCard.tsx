import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, DollarSign, Clock, Bookmark, BookmarkCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { toast } from "@/hooks/use-toast";

interface JobCardProps {
  id: string;
  title: string;
  company: string;
  location: string;
  jobType: string;
  payRate: string;
  postedDate: string;
  description: string;
  skills: string[];
}

const JobCard = ({
  id,
  title,
  company,
  location,
  jobType,
  payRate,
  postedDate,
  description,
  skills,
}: JobCardProps) => {
  const { currentUser } = useAuth();
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Check if job is saved when component mounts
  useEffect(() => {
    const checkSavedStatus = async () => {
      if (!currentUser) {
        setIsSaved(false);
        return;
      }

      try {
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const savedJobs = userData.savedJobs || [];
          setIsSaved(savedJobs.includes(id));
        }
      } catch (error) {
        console.error('Error checking saved status:', error);
      }
    };

    checkSavedStatus();
  }, [currentUser, id]);

  const handleSaveToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!currentUser) {
      toast({
        title: "Authentication required",
        description: "Please sign in to save jobs.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSaving(true);
      const userDocRef = doc(db, 'users', currentUser.uid);
      
      if (isSaved) {
        // Remove from saved jobs
        await updateDoc(userDocRef, {
          savedJobs: arrayRemove(id),
        });
        setIsSaved(false);
        toast({
          title: "Job unsaved",
          description: "Job removed from your saved jobs.",
        });
      } else {
        // Add to saved jobs
        await updateDoc(userDocRef, {
          savedJobs: arrayUnion(id),
        });
        setIsSaved(true);
        toast({
          title: "Job saved!",
          description: "Job added to your saved jobs.",
        });
      }
    } catch (error) {
      console.error('Error toggling save status:', error);
      toast({
        title: "Error",
        description: "Failed to update saved jobs. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="p-6 hover-lift cursor-pointer group">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <Link to={`/jobs/${id}`}>
            <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-smooth">
              {title}
            </h3>
          </Link>
          <p className="text-muted-foreground font-medium">{company}</p>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          className={`hover:text-primary ${isSaved ? 'text-primary' : ''}`}
          onClick={handleSaveToggle}
          disabled={isSaving}
        >
          {isSaved ? (
            <BookmarkCheck className="w-5 h-5 fill-current" />
          ) : (
            <Bookmark className="w-5 h-5" />
          )}
        </Button>
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <MapPin className="w-4 h-4" />
          <span>{location}</span>
        </div>
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <DollarSign className="w-4 h-4" />
          <span>{payRate}</span>
        </div>
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Clock className="w-4 h-4" />
          <span>{postedDate}</span>
        </div>
      </div>

      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{description}</p>

      <div className="flex flex-wrap gap-2 mb-4">
        {skills.slice(0, 3).map((skill) => (
          <Badge key={skill} variant="secondary" className="text-xs">
            {skill}
          </Badge>
        ))}
        {skills.length > 3 && (
          <Badge variant="outline" className="text-xs">
            +{skills.length - 3} more
          </Badge>
        )}
      </div>

      <div className="flex gap-2">
        <Badge className="bg-accent text-accent-foreground">{jobType}</Badge>
        <Link to={`/jobs/${id}`} className="ml-auto">
          <Button variant="outline" size="sm">
            View Details
          </Button>
        </Link>
      </div>
    </Card>
  );
};

export default JobCard;
