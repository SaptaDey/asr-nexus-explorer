import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Mail, MapPin, Github, ExternalLink, GraduationCap, Microscope, Brain, Send, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { validateInput } from '@/utils/securityUtils';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    issueType: 'general'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Create mailto link with form data
    const subject = encodeURIComponent(`[Scientific Reasoning Framework] ${formData.subject}`);
    const body = encodeURIComponent(`
Name: ${formData.name}
Email: ${formData.email}
Issue Type: ${formData.issueType}

Message:
${formData.message}

---
Sent from Scientific Reasoning Framework
    `);
    
    window.location.href = `mailto:saptaswa.dey@medunigraz.at?subject=${subject}&body=${body}`;
    toast.success('Email client opened with your message');
  };

  // SECURITY: Secure input handler with validation and sanitization
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    try {
      // Validate input based on field type
      let validatedValue: string;
      
      if (name === 'issueType') {
        // Select field with predefined options - just validate it's one of the allowed values
        const allowedTypes = ['general', 'bug', 'feature', 'research', 'technical'];
        if (!allowedTypes.includes(value)) {
          toast.error('Invalid issue type selected');
          return;
        }
        validatedValue = value;
      } else {
        // For text inputs, use the general input validation
        validatedValue = validateInput(value, name === 'message' ? 'query' : 'prompt');
      }
      
      setFormData(prev => ({
        ...prev,
        [name]: validatedValue
      }));
    } catch (error) {
      toast.error(`Input validation error: ${error.message}`);
      // Don't update state with invalid input
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <Link to="/">
            <Button variant="outline" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold gradient-text mb-4">Contact Us</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Get in touch with our research team for support, collaboration, or feedback on the Scientific Reasoning framework
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Creator Profile */}
          <Card className="card-gradient">
            <CardHeader>
              <CardTitle className="gradient-text flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Framework Creator
              </CardTitle>
              <CardDescription>
                Leading researcher in AI and computational immunology
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Enhanced Profile */}
              <div className="flex items-start gap-6">
                <img 
                  src="https://avatars.githubusercontent.com/u/142305749?v=4" 
                  alt="Sapta Dey"
                  className="w-24 h-24 rounded-full border-3 border-primary/30 shadow-lg"
                />
                <div className="flex-1">
                  <h3 className="text-2xl font-bold">Dr. Sapta Dey</h3>
                  <p className="text-base text-muted-foreground mb-3 leading-relaxed">
                    🔬 Lead Biomedical Researcher & AI Framework Developer<br/>
                    🧠 Specialist in Computational Immunology & Graph Neural Networks<br/>
                    🧬 Creator of Advanced Scientific Reasoning (ASR-GoT) Framework
                  </p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <Badge variant="secondary" className="text-xs">
                      <GraduationCap className="h-3 w-3 mr-1" />
                      PhD Researcher
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      <Microscope className="h-3 w-3 mr-1" />
                      Biomedical Sciences
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      <Brain className="h-3 w-3 mr-1" />
                      AI/ML Expert
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      Graph Theory
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      Immunology
                    </Badge>
                  </div>
                  
                  {/* Research Focus */}
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-3 rounded-lg border border-blue-100">
                    <h4 className="font-semibold text-sm mb-2">Research Focus Areas</h4>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>• Advanced AI reasoning systems for scientific research</li>
                      <li>• Graph-based knowledge representation and reasoning</li>
                      <li>• Computational immunology and biomedical data analysis</li>
                      <li>• Evidence synthesis and bias detection in scientific literature</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Institution */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span className="font-semibold text-sm">Current Affiliation</span>
                </div>
                <p className="text-sm">Department of Dermatology</p>
                <p className="text-sm">Medical University of Graz</p>
                <p className="text-sm text-muted-foreground">Graz, Austria</p>
              </div>

              {/* Contact Info */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-primary" />
                  <a 
                    href="mailto:saptaswa.dey@medunigraz.at" 
                    className="text-sm hover:text-primary transition-colors"
                  >
                    saptaswa.dey@medunigraz.at
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <Github className="h-4 w-4 text-primary" />
                  <a 
                    href="https://github.com/SaptaDey" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm hover:text-primary transition-colors flex items-center gap-1"
                  >
                    GitHub Profile
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>

              {/* Academic Links */}
              <Separator />
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Academic Profiles</h4>
                <div className="grid grid-cols-1 gap-2 text-sm">
                  <a 
                    href="https://orcid.org/0000-0001-7532-7858" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 hover:text-primary transition-colors"
                  >
                    ORCID Profile <ExternalLink className="h-3 w-3" />
                  </a>
                  <a 
                    href="https://scholar.google.com/citations?user=ziVhgG0AAAAJ&hl=en" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 hover:text-primary transition-colors"
                  >
                    Google Scholar <ExternalLink className="h-3 w-3" />
                  </a>
                  <a 
                    href="https://www.linkedin.com/in/saptaswa-dey-6743b4163/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 hover:text-primary transition-colors"
                  >
                    LinkedIn Profile <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Form */}
          <Card className="card-gradient">
            <CardHeader>
              <CardTitle className="gradient-text flex items-center gap-2">
                <Send className="h-5 w-5" />
                Send Message
              </CardTitle>
              <CardDescription>
                Report issues, request features, or discuss research collaboration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="issueType">Issue Type</Label>
                  <select
                    id="issueType"
                    name="issueType"
                    value={formData.issueType}
                    onChange={handleChange}
                    className="w-full p-2 border border-input rounded-md bg-background"
                  >
                    <option value="general">General Inquiry</option>
                    <option value="bug">Bug Report</option>
                    <option value="feature">Feature Request</option>
                    <option value="research">Research Collaboration</option>
                    <option value="technical">Technical Support</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows={6}
                    required
                  />
                </div>

                <Button type="submit" className="w-full gradient-bg">
                  <Send className="h-4 w-4 mr-2" />
                  Send Message
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Framework Info */}
        <Card className="card-gradient mt-8 max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="gradient-text text-center">About the Scientific Reasoning Framework</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              This framework implements Advanced Scientific Reasoning using Graph of Thoughts methodology, 
              combining AI-powered analysis with rigorous scientific methodology for comprehensive research automation.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Badge variant="outline">Graph Neural Networks</Badge>
              <Badge variant="outline">Scientific Reasoning</Badge>
              <Badge variant="outline">AI-Powered Research</Badge>
              <Badge variant="outline">Evidence Synthesis</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Contact;