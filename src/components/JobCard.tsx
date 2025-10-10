import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, DollarSign, Clock, Bookmark } from "lucide-react";
import { Link } from "react-router-dom";

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
        <Button variant="ghost" size="icon" className="hover:text-primary">
          <Bookmark className="w-5 h-5" />
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
