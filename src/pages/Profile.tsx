import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import JobCard from "@/components/JobCard";
import { Edit, Upload, Mail, MapPin, Calendar } from "lucide-react";
import { mockJobs } from "@/data/mockJobs";

const Profile = () => {
  const savedJobs = mockJobs.slice(0, 2);
  const appliedJobs = mockJobs.slice(2, 4);

  const userSkills = [
    "React",
    "TypeScript",
    "Node.js",
    "UI/UX Design",
    "Figma",
    "Python",
  ];

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
                    JD
                  </AvatarFallback>
                </Avatar>
                <h2 className="text-2xl font-bold mb-1">John Doe</h2>
                <p className="text-muted-foreground mb-4">Full-Stack Developer</p>
                <Button variant="outline" size="sm" className="w-full">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              </div>

              <Separator className="my-6" />

              <div className="space-y-4">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span>john.doe@email.com</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span>San Francisco, CA</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span>Member since 2024</span>
                </div>
              </div>

              <Separator className="my-6" />

              <div>
                <h3 className="font-semibold mb-3">Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {userSkills.map((skill) => (
                    <Badge key={skill} variant="secondary">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            </Card>

            {/* Resume Section */}
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Resume</h3>
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-3">
                  Upload your resume
                </p>
                <Button variant="outline" size="sm">
                  Choose File
                </Button>
              </div>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            <Card className="p-6">
              <div className="mb-6">
                <h1 className="text-3xl font-bold mb-2">My Dashboard</h1>
                <p className="text-muted-foreground">
                  Manage your saved and applied jobs
                </p>
              </div>

              <Tabs defaultValue="saved" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="saved">
                    Saved Jobs ({savedJobs.length})
                  </TabsTrigger>
                  <TabsTrigger value="applied">
                    Applied Jobs ({appliedJobs.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="saved" className="space-y-4">
                  {savedJobs.length > 0 ? (
                    savedJobs.map((job) => <JobCard key={job.id} {...job} />)
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground mb-4">
                        No saved jobs yet
                      </p>
                      <Button variant="outline" asChild>
                        <a href="/jobs">Browse Jobs</a>
                      </Button>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="applied" className="space-y-4">
                  {appliedJobs.length > 0 ? (
                    appliedJobs.map((job) => <JobCard key={job.id} {...job} />)
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground mb-4">
                        No applications yet
                      </p>
                      <Button variant="outline" asChild>
                        <a href="/jobs">Find Jobs</a>
                      </Button>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </Card>

            {/* Profile Stats */}
            <div className="grid md:grid-cols-3 gap-4 mt-6">
              <Card className="p-6 text-center">
                <p className="text-3xl font-bold text-primary mb-1">
                  {savedJobs.length}
                </p>
                <p className="text-sm text-muted-foreground">Saved Jobs</p>
              </Card>
              <Card className="p-6 text-center">
                <p className="text-3xl font-bold text-secondary mb-1">
                  {appliedJobs.length}
                </p>
                <p className="text-sm text-muted-foreground">Applications</p>
              </Card>
              <Card className="p-6 text-center">
                <p className="text-3xl font-bold text-primary mb-1">85%</p>
                <p className="text-sm text-muted-foreground">Profile Strength</p>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Profile;
