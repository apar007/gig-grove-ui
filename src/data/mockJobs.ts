export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  jobType: string;
  payRate: string;
  postedDate: string;
  description: string;
  fullDescription: string;
  skills: string[];
  experienceLevel: string;
  budget: string;
}

export const mockJobs: Job[] = [
  {
    id: "1",
    title: "Senior Full-Stack Developer",
    company: "TechFlow Inc.",
    location: "Remote",
    jobType: "Contract",
    payRate: "$80-120/hr",
    postedDate: "2 days ago",
    description: "Looking for an experienced full-stack developer to build a modern SaaS platform using React and Node.js.",
    fullDescription: "We're seeking a senior full-stack developer to join our team and help build the next generation of our SaaS platform. You'll work with React, TypeScript, Node.js, and PostgreSQL to create scalable, maintainable solutions. This is a 3-month contract with potential for extension.\n\nResponsibilities:\n- Design and implement new features\n- Collaborate with product and design teams\n- Write clean, maintainable code\n- Participate in code reviews",
    skills: ["React", "Node.js", "TypeScript", "PostgreSQL"],
    experienceLevel: "Senior",
    budget: "$24,000-36,000",
  },
  {
    id: "2",
    title: "UI/UX Designer",
    company: "Creative Studios",
    location: "New York, NY",
    jobType: "Freelance",
    payRate: "$60-90/hr",
    postedDate: "1 day ago",
    description: "Need a talented UI/UX designer to redesign our mobile app with focus on user experience and modern aesthetics.",
    fullDescription: "Join our creative team to redesign our flagship mobile application. We're looking for someone who can create beautiful, intuitive interfaces that delight users.\n\nWhat you'll do:\n- Conduct user research and create personas\n- Design wireframes and high-fidelity mockups\n- Build interactive prototypes\n- Work closely with developers\n- Iterate based on user feedback",
    skills: ["Figma", "UI Design", "UX Research", "Prototyping"],
    experienceLevel: "Mid-Level",
    budget: "$18,000-27,000",
  },
  {
    id: "3",
    title: "Content Writer",
    company: "Digital Marketing Co.",
    location: "Remote",
    jobType: "Part-Time",
    payRate: "$40-60/hr",
    postedDate: "3 days ago",
    description: "Seeking a skilled content writer to create engaging blog posts and marketing copy for B2B SaaS company.",
    fullDescription: "We're looking for a talented content writer who understands the B2B SaaS space and can create compelling content that drives engagement and conversions.\n\nYou'll be responsible for:\n- Writing blog posts (2-3 per week)\n- Creating marketing copy for email campaigns\n- Developing case studies and whitepapers\n- SEO optimization\n- Collaborating with marketing team",
    skills: ["Content Writing", "SEO", "Copywriting", "B2B Marketing"],
    experienceLevel: "Entry-Level",
    budget: "$6,000-9,000",
  },
  {
    id: "4",
    title: "DevOps Engineer",
    company: "CloudTech Solutions",
    location: "San Francisco, CA",
    jobType: "Contract",
    payRate: "$90-130/hr",
    postedDate: "5 days ago",
    description: "Looking for a DevOps engineer to optimize our cloud infrastructure and implement CI/CD pipelines.",
    fullDescription: "Join our infrastructure team to help scale our cloud operations. We need someone with strong AWS experience who can help us optimize costs while improving reliability.\n\nKey responsibilities:\n- Design and implement CI/CD pipelines\n- Manage AWS infrastructure\n- Monitor and optimize system performance\n- Implement security best practices\n- Automate deployment processes",
    skills: ["AWS", "Docker", "Kubernetes", "Terraform"],
    experienceLevel: "Senior",
    budget: "$27,000-39,000",
  },
  {
    id: "5",
    title: "Mobile App Developer",
    company: "StartupXYZ",
    location: "Remote",
    jobType: "Freelance",
    payRate: "$70-100/hr",
    postedDate: "1 week ago",
    description: "Need an experienced mobile developer to build a cross-platform app using React Native.",
    fullDescription: "We're building a new mobile application for our fitness platform and need an experienced React Native developer to bring it to life.\n\nWhat we're looking for:\n- 3+ years of React Native experience\n- Strong understanding of mobile UX patterns\n- Experience with native modules\n- API integration skills\n- App store deployment experience",
    skills: ["React Native", "JavaScript", "iOS", "Android"],
    experienceLevel: "Mid-Level",
    budget: "$21,000-30,000",
  },
  {
    id: "6",
    title: "Data Analyst",
    company: "Analytics Pro",
    location: "Chicago, IL",
    jobType: "Contract",
    payRate: "$55-85/hr",
    postedDate: "4 days ago",
    description: "Seeking a data analyst to help analyze customer behavior and create actionable insights for our product team.",
    fullDescription: "Join our data team to help us make data-driven decisions. You'll work with product managers and engineers to analyze user behavior and identify opportunities for improvement.\n\nResponsibilities:\n- Analyze user behavior data\n- Create dashboards and reports\n- Conduct A/B test analysis\n- Present insights to stakeholders\n- Collaborate with product team",
    skills: ["SQL", "Python", "Tableau", "Data Analysis"],
    experienceLevel: "Mid-Level",
    budget: "$16,500-25,500",
  },
];
