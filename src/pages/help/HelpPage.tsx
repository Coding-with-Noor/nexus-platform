import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Book, MessageCircle, Phone, Mail, ExternalLink } from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const faqs = [
  {
    question: 'How do I connect with investors?',
    answer: 'You can browse our investor directory and send connection requests. Once an investor accepts, you can start messaging them directly through our platform.'
  },
  {
    question: 'What should I include in my startup profile?',
    answer: 'Your startup profile should include a compelling pitch, funding needs, team information, market opportunity, and any traction or metrics that demonstrate your progress.'
  },
  {
    question: 'How do I share documents securely?',
    answer: 'You can upload documents to your secure document vault and selectively share them with connected investors. All documents are encrypted and access-controlled.'
  },
  {
    question: 'What are collaboration requests?',
    answer: 'Collaboration requests are formal expressions of interest from investors. They indicate that an investor wants to learn more about your startup and potentially discuss investment opportunities.'
  },
  {
    question: 'How do I transfer funds to another user?',
    answer: 'Go to Wallet → Transfer, select a recipient by email (e.g. InDemo@gmail.com or EnDemo@gmail.com for demo accounts), enter the amount, and confirm the transfer.'
  },
  {
    question: 'How do I update my profile settings?',
    answer: 'Navigate to Settings from the sidebar. Update your name, email, location, or bio and click Save Changes. Password and 2FA options are under Security.'
  }
];

export const HelpPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [contactName, setContactName] = useState(user?.name || '');
  const [contactEmail, setContactEmail] = useState(user?.email || '');
  const [contactMessage, setContactMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredFaqs = faqs.filter(
    (faq) =>
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim() || !contactEmail.trim() || !contactMessage.trim()) {
      toast.error('Please fill in all fields');
      return;
    }
    setIsSubmitting(true);
    // Simulate support ticket submission
    await new Promise((r) => setTimeout(r, 800));
    toast.success('Your message has been sent! Our team will respond within 24 hours.');
    setContactMessage('');
    setIsSubmitting(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Help & Support</h1>
        <p className="text-gray-600">Find answers to common questions or get in touch with our support team</p>
      </div>

      <div className="max-w-2xl">
        <Input
          placeholder="Search help articles..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          startAdornment={<Search size={18} />}
          fullWidth
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardBody className="text-center p-6">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-50 rounded-lg mb-4">
              <Book size={24} className="text-primary-600" />
            </div>
            <h2 className="text-lg font-medium text-gray-900">Documentation</h2>
            <p className="text-sm text-gray-600 mt-2">
              Browse our API documentation and setup guides
            </p>
            <Button
              variant="outline"
              className="mt-4"
              rightIcon={<ExternalLink size={16} />}
              onClick={() => {
                const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
                const docsUrl = apiUrl.replace(/\/api\/?$/, '') + '/api/docs';
                window.open(docsUrl, '_blank');
              }}
            >
              View Docs
            </Button>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="text-center p-6">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-50 rounded-lg mb-4">
              <MessageCircle size={24} className="text-primary-600" />
            </div>
            <h2 className="text-lg font-medium text-gray-900">Live Chat</h2>
            <p className="text-sm text-gray-600 mt-2">
              Chat with our support team in real-time
            </p>
            <Button
              className="mt-4"
              onClick={() => navigate('/messages')}
            >
              Start Chat
            </Button>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="text-center p-6">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-50 rounded-lg mb-4">
              <Phone size={24} className="text-primary-600" />
            </div>
            <h2 className="text-lg font-medium text-gray-900">Contact Us</h2>
            <p className="text-sm text-gray-600 mt-2">
              Get help via email or phone
            </p>
            <Button
              variant="outline"
              className="mt-4"
              leftIcon={<Mail size={16} />}
              onClick={() => {
                window.location.href = 'mailto:support@businessnexus.com?subject=Nexus%20Support%20Request';
              }}
            >
              Contact Support
            </Button>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-medium text-gray-900">Frequently Asked Questions</h2>
        </CardHeader>
        <CardBody>
          {filteredFaqs.length === 0 ? (
            <p className="text-gray-500 text-center py-6">No articles match your search.</p>
          ) : (
            <div className="space-y-6">
              {filteredFaqs.map((faq, index) => (
                <div key={index} className="border-b border-gray-200 last:border-0 pb-6 last:pb-0">
                  <h3 className="text-base font-medium text-gray-900 mb-2">{faq.question}</h3>
                  <p className="text-gray-600">{faq.answer}</p>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-medium text-gray-900">Still need help?</h2>
        </CardHeader>
        <CardBody>
          <form className="space-y-6 max-w-2xl" onSubmit={handleContactSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Name"
                placeholder="Your name"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                required
              />
              <Input
                label="Email"
                type="email"
                placeholder="your@email.com"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
              <textarea
                className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                rows={4}
                placeholder="How can we help you?"
                value={contactMessage}
                onChange={(e) => setContactMessage(e.target.value)}
                required
              />
            </div>

            <div>
              <Button type="submit" isLoading={isSubmitting}>
                Send Message
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
};
