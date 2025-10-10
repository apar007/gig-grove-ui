import { useParams, Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  MapPin,
  DollarSign,
  Clock,
  Bookmark,
  ArrowLeft,
  Share2,
  ExternalLink,
} from "lucide-react";
import { mockJobs } from "@/data/mockJobs";

const JobDetails = () => {
  const { id } = useParams();
  const job = mockJobs.find((j) => j.id === id);

  if (!job) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Job not found</h2>
            <Link to="/jobs">
              <Button variant="outline">Back to Jobs</Button>
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

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
                    <h1 className="text-3xl font-bold mb-2">{job.title}</h1>
                    <p className="text-xl text-muted-foreground font-medium">{job.company}</p>
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
                    <span>{job.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <DollarSign className="w-4 h-4" />
                    <span>{job.payRate}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>Posted {job.postedDate}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Badge className="bg-accent text-accent-foreground">{job.jobType}</Badge>
                  <Badge variant="secondary">{job.experienceLevel}</Badge>
                </div>
              </div>

              <Separator className="my-6" />

              {/* Job Description */}
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-3">Job Description</h2>
                <div className="text-muted-foreground whitespace-pre-line leading-relaxed">
                  {job.fullDescription}
                </div>
              </div>

              <Separator className="my-6" />

              {/* Required Skills */}
              <div>
                <h2 className="text-xl font-semibold mb-3">Required Skills</h2>
                <div className="flex flex-wrap gap-2">
                  {job.skills.map((skill) => (
                    <Badge key={skill} variant="secondary" className="text-sm">
                      {skill}
                    </Badge>
                  ))}
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
                  <p className="text-2xl font-bold text-primary">{job.budget}</p>
                </div>

                <Separator />

                <div>
                  <p className="text-sm text-muted-foreground mb-1">Hourly Rate</p>
                  <p className="text-lg font-semibold">{job.payRate}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-1">Experience Level</p>
                  <p className="text-lg font-semibold">{job.experienceLevel}</p>
                </div>

                <Separator />

                <Button variant="hero" className="w-full" size="lg">
                  Apply Now
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
                  <span className="text-sm font-medium">{job.jobType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Location</span>
                  <span className="text-sm font-medium">{job.location}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Posted</span>
                  <span className="text-sm font-medium">{job.postedDate}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default JobDetails;
