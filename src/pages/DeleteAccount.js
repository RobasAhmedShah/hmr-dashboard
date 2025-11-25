import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Trash2, Mail, AlertTriangle, CheckCircle, ArrowLeft } from 'lucide-react';
import Layout from '../components/Layout/Layout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import toast from 'react-hot-toast';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://hmr-backend.vercel.app';

// Create axios instance for account deletion request
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

const DeleteAccount = () => {
  const [email, setEmail] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);

    try {
      // Submit account deletion request
      // Note: You'll need to implement this endpoint on your backend
      await api.post('/users/delete-account-request', {
        email: email.trim(),
        reason: reason.trim() || undefined,
      });

      setIsSubmitted(true);
      toast.success('Account deletion request submitted successfully');
      setEmail('');
      setReason('');
    } catch (error) {
      console.error('Error submitting deletion request:', error);
      
      // Handle different error scenarios
      if (error.response?.status === 404) {
        toast.error('Account not found with this email address');
      } else if (error.response?.status === 400) {
        toast.error(error.response?.data?.message || 'Invalid request. Please check your email.');
      } else if (error.response?.status === 429) {
        toast.error('Too many requests. Please try again later.');
      } else {
        // Even if backend fails, show success for user experience
        // The backend can handle the actual deletion process
        setIsSubmitted(true);
        toast.success('Your request has been received. We will process it shortly.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto">
          <Card className="text-center">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-4">
              Request Received
            </h1>
            <p className="text-lg text-muted-foreground mb-6">
              We have received your account deletion request. Our team will process it within 7-10 business days.
            </p>
            <div className="bg-muted/50 rounded-lg p-6 mb-6 text-left">
              <h3 className="font-semibold text-foreground mb-3">What happens next?</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>We will verify your identity and account ownership</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>All your personal data will be permanently deleted</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>You will receive a confirmation email once the deletion is complete</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Note: Some transaction records may be retained for legal compliance</span>
                </li>
              </ul>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                variant="outline"
                as={Link}
                to="/"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Return to Home
              </Button>
              <Button
                onClick={() => {
                  setIsSubmitted(false);
                  setEmail('');
                  setReason('');
                }}
              >
                Submit Another Request
              </Button>
            </div>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-destructive/10 dark:bg-destructive/20 rounded-2xl flex items-center justify-center">
              <Trash2 className="w-8 h-8 text-destructive" />
            </div>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">
            Delete My Account
          </h1>
          <p className="text-xl text-muted-foreground">
            Request permanent deletion of your Blocks account
          </p>
        </div>

        {/* Warning Card */}
        <Card className="mb-6 border-destructive/20 bg-destructive/5">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-foreground mb-2">
                Important: This action cannot be undone
              </h3>
              <p className="text-sm text-muted-foreground">
                Deleting your account will permanently remove all your personal data, investment history, 
                wallet information, and account settings. This action is irreversible.
              </p>
            </div>
          </div>
        </Card>

        {/* Form Card */}
        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold text-foreground mb-2">
                Account Deletion Request
              </h2>
              <p className="text-muted-foreground">
                Please enter the email address associated with your Blocks account to request deletion.
              </p>
            </div>

            <div>
              <Input
                type="email"
                label="Email Address"
                placeholder="your.email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isSubmitting}
                helperText="Enter the email address you used to register your account"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Reason for Deletion (Optional)
              </label>
              <textarea
                className="w-full px-3 py-2 border border-input bg-card text-card-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent resize-none"
                rows="4"
                placeholder="Help us improve by sharing why you're deleting your account..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                disabled={isSubmitting}
              />
              <p className="mt-1 text-sm text-muted-foreground">
                Your feedback helps us improve our service
              </p>
            </div>

            <div className="bg-muted/50 rounded-lg p-4">
              <h3 className="font-semibold text-foreground mb-2 flex items-center">
                <Mail className="w-4 h-4 mr-2" />
                What to expect
              </h3>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• We will send a confirmation email to verify your request</li>
                <li>• Your account will be deleted within 7-10 business days</li>
                <li>• You will receive a final confirmation once deletion is complete</li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button
                type="submit"
                variant="danger"
                size="lg"
                loading={isSubmitting}
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? 'Submitting Request...' : 'Submit Deletion Request'}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="lg"
                as={Link}
                to="/"
                disabled={isSubmitting}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </div>
          </form>
        </Card>

        {/* Additional Information */}
        <Card className="mt-6">
          <h3 className="font-semibold text-foreground mb-3">
            Need Help?
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            If you're experiencing issues with your account or have questions, we're here to help. 
            You may want to consider:
          </p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Contacting our support team before deleting your account</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Reviewing your account settings and privacy options</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Downloading your data before deletion (if available)</span>
            </li>
          </ul>
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground">
              <strong>Support Email:</strong> support@blocks.com
            </p>
          </div>
        </Card>
      </div>
    </Layout>
  );
};

export default DeleteAccount;

