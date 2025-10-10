import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, TrendingUp, Zap, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import JobCard from "@/components/JobCard";
import { mockJobs } from "@/data/mockJobs";
import heroImage from "@/assets/hero-workspace.jpg";

const Landing = () => {
  const trendingJobs = mockJobs.slice(0, 3);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-hero opacity-10" />
        <div className="container mx-auto px-4 py-20 lg:py-32 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8 animate-fade-in">
              <h1 className="text-5xl lg:text-6xl font-bold leading-tight">
                Find Freelance Work{" "}
                <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  That Fits You
                </span>
              </h1>
              <p className="text-xl text-muted-foreground">
                Discover opportunities from multiple platforms in one elegant dashboard. 
                Your next perfect gig is just a search away.
              </p>

              {/* Search Bar */}
              <div className="flex flex-col sm:flex-row gap-3 max-w-xl">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    placeholder="Search by skills or keywords..."
                    className="pl-10 h-12 shadow-soft"
                  />
                </div>
                <Link to="/jobs">
                  <Button variant="hero" size="lg" className="w-full sm:w-auto">
                    Browse Jobs
                  </Button>
                </Link>
              </div>

              {/* Stats */}
              <div className="flex flex-wrap gap-8 pt-4">
                <div>
                  <p className="text-3xl font-bold text-primary">2,500+</p>
                  <p className="text-sm text-muted-foreground">Active Jobs</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-secondary">50+</p>
                  <p className="text-sm text-muted-foreground">Job Platforms</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-primary">10K+</p>
                  <p className="text-sm text-muted-foreground">Freelancers</p>
                </div>
              </div>
            </div>

            {/* Hero Image */}
            <div className="relative animate-fade-in">
              <div className="absolute inset-0 gradient-hero opacity-20 blur-3xl rounded-full" />
              <img
                src={heroImage}
                alt="Modern workspace"
                className="relative rounded-2xl shadow-hover w-full"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">Why Choose FreelanceHub?</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              We make finding your next freelance opportunity simple and enjoyable
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-card p-8 rounded-xl shadow-soft hover-lift">
              <div className="w-12 h-12 gradient-hero rounded-lg flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Lightning Fast</h3>
              <p className="text-muted-foreground">
                Search thousands of jobs across multiple platforms in seconds. No more tab overload.
              </p>
            </div>

            <div className="bg-card p-8 rounded-xl shadow-soft hover-lift">
              <div className="w-12 h-12 gradient-hero rounded-lg flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Always Updated</h3>
              <p className="text-muted-foreground">
                Real-time job updates from all major freelance platforms. Never miss an opportunity.
              </p>
            </div>

            <div className="bg-card p-8 rounded-xl shadow-soft hover-lift">
              <div className="w-12 h-12 gradient-hero rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Verified Jobs</h3>
              <p className="text-muted-foreground">
                All listings are verified and sourced from trusted platforms. Work with confidence.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Trending Jobs */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl lg:text-4xl font-bold mb-2">Trending Opportunities</h2>
              <p className="text-muted-foreground">Hot jobs that match your skills</p>
            </div>
            <Link to="/jobs">
              <Button variant="outline">View All</Button>
            </Link>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {trendingJobs.map((job) => (
              <JobCard key={job.id} {...job} />
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Landing;
