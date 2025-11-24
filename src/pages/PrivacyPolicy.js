import React from 'react';
import Layout from '../components/Layout/Layout';
import Card from '../components/ui/Card';
import { Shield, Lock, Eye, FileText, Users, AlertCircle } from 'lucide-react';

const PrivacyPolicy = () => {
  const sections = [
    {
      icon: FileText,
      title: '1. Introduction',
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Welcome to Blocks ("we," "our," or "us"). We are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our real estate tokenization platform.
          </p>
          <p className="text-muted-foreground">
            By accessing or using Blocks, you agree to the collection and use of information in accordance with this policy. If you do not agree with our policies and practices, please do not use our services.
          </p>
        </div>
      ),
    },
    {
      icon: Eye,
      title: '2. Information We Collect',
      content: (
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-foreground mb-2">2.1 Personal Information</h4>
            <p className="text-muted-foreground mb-2">
              We may collect personal information that you provide directly to us, including:
            </p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
              <li>Name, email address, phone number, and postal address</li>
              <li>Government-issued identification documents for KYC verification</li>
              <li>Financial information for investment transactions</li>
              <li>Bank account details and payment information</li>
              <li>Tax identification numbers</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-2">2.2 Automatically Collected Information</h4>
            <p className="text-muted-foreground mb-2">
              When you use our platform, we automatically collect certain information, including:
            </p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
              <li>Device information (IP address, browser type, operating system)</li>
              <li>Usage data (pages visited, time spent, features used)</li>
              <li>Cookies and similar tracking technologies</li>
              <li>Transaction history and investment activity</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-2">2.3 Blockchain Information</h4>
            <p className="text-muted-foreground">
              As a blockchain-based platform, we collect wallet addresses and transaction hashes associated with your account. This information is publicly available on the blockchain but is linked to your account for service provision.
            </p>
          </div>
        </div>
      ),
    },
    {
      icon: Users,
      title: '3. How We Use Your Information',
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground mb-2">
            We use the collected information for various purposes, including:
          </p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
            <li>Providing, maintaining, and improving our services</li>
            <li>Processing transactions and managing your investments</li>
            <li>Verifying your identity and conducting KYC/AML checks</li>
            <li>Communicating with you about your account, transactions, and platform updates</li>
            <li>Sending marketing communications (with your consent)</li>
            <li>Detecting and preventing fraud, security threats, and illegal activities</li>
            <li>Complying with legal obligations and regulatory requirements</li>
            <li>Analyzing usage patterns to enhance user experience</li>
            <li>Providing customer support and responding to inquiries</li>
          </ul>
        </div>
      ),
    },
    {
      icon: Lock,
      title: '4. Information Sharing and Disclosure',
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground mb-2">
            We do not sell your personal information. We may share your information in the following circumstances:
          </p>
          <div>
            <h4 className="font-semibold text-foreground mb-2">4.1 Service Providers</h4>
            <p className="text-muted-foreground">
              We may share information with third-party service providers who perform services on our behalf, such as payment processing, identity verification, cloud storage, and analytics. These providers are contractually obligated to protect your information.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-2">4.2 Legal Requirements</h4>
            <p className="text-muted-foreground">
              We may disclose information if required by law, court order, or government regulation, or to protect our rights, property, or safety, or that of our users or others.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-2">4.3 Business Transfers</h4>
            <p className="text-muted-foreground">
              In the event of a merger, acquisition, or sale of assets, your information may be transferred to the acquiring entity.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-2">4.4 With Your Consent</h4>
            <p className="text-muted-foreground">
              We may share your information with your explicit consent or at your direction.
            </p>
          </div>
        </div>
      ),
    },
    {
      icon: Shield,
      title: '5. Data Security',
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground">
            We implement industry-standard security measures to protect your personal information, including:
          </p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
            <li>Encryption of data in transit and at rest</li>
            <li>Secure authentication and access controls</li>
            <li>Regular security audits and vulnerability assessments</li>
            <li>Blockchain-based transaction security</li>
            <li>Employee training on data protection</li>
            <li>Incident response procedures</li>
          </ul>
          <p className="text-muted-foreground">
            However, no method of transmission over the internet or electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your information, we cannot guarantee absolute security.
          </p>
        </div>
      ),
    },
    {
      icon: Users,
      title: '6. Your Rights and Choices',
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground mb-2">
            Depending on your jurisdiction, you may have the following rights regarding your personal information:
          </p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
            <li><strong>Access:</strong> Request access to your personal information</li>
            <li><strong>Correction:</strong> Request correction of inaccurate or incomplete information</li>
            <li><strong>Deletion:</strong> Request deletion of your personal information (subject to legal obligations)</li>
            <li><strong>Portability:</strong> Request a copy of your data in a portable format</li>
            <li><strong>Objection:</strong> Object to certain processing activities</li>
            <li><strong>Restriction:</strong> Request restriction of processing in certain circumstances</li>
            <li><strong>Withdraw Consent:</strong> Withdraw consent where processing is based on consent</li>
          </ul>
          <p className="text-muted-foreground">
            To exercise these rights, please contact us using the information provided in the "Contact Us" section below.
          </p>
        </div>
      ),
    },
    {
      icon: FileText,
      title: '7. Cookies and Tracking Technologies',
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground">
            We use cookies and similar tracking technologies to track activity on our platform and store certain information. Cookies are files with a small amount of data that may include an anonymous unique identifier.
          </p>
          <p className="text-muted-foreground">
            You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, if you do not accept cookies, you may not be able to use some portions of our platform.
          </p>
          <p className="text-muted-foreground">
            We use cookies for:
          </p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
            <li>Authentication and session management</li>
            <li>Remembering your preferences and settings</li>
            <li>Analyzing platform usage and performance</li>
            <li>Providing personalized content and advertisements</li>
          </ul>
        </div>
      ),
    },
    {
      icon: AlertCircle,
      title: '8. Data Retention',
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground">
            We retain your personal information for as long as necessary to fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is required or permitted by law. Factors we consider when determining retention periods include:
          </p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
            <li>The nature and sensitivity of the information</li>
            <li>Legal and regulatory requirements</li>
            <li>The potential risk of harm from unauthorized use or disclosure</li>
            <li>Our legitimate business interests</li>
            <li>Whether we can achieve the purposes through other means</li>
          </ul>
          <p className="text-muted-foreground">
            Financial and transaction records are typically retained for at least 7 years to comply with regulatory requirements.
          </p>
        </div>
      ),
    },
    {
      icon: FileText,
      title: '9. International Data Transfers',
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Your information may be transferred to and processed in countries other than your country of residence. These countries may have data protection laws that differ from those in your country.
          </p>
          <p className="text-muted-foreground">
            We take appropriate safeguards to ensure that your personal information receives an adequate level of protection, including:
          </p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
            <li>Using standard contractual clauses approved by relevant data protection authorities</li>
            <li>Ensuring service providers are bound by appropriate data protection agreements</li>
            <li>Implementing security measures consistent with international standards</li>
          </ul>
        </div>
      ),
    },
    {
      icon: Users,
      title: '10. Children\'s Privacy',
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Our platform is not intended for individuals under the age of 18 (or the age of majority in your jurisdiction). We do not knowingly collect personal information from children. If you believe we have collected information from a child, please contact us immediately, and we will take steps to delete such information.
          </p>
        </div>
      ),
    },
    {
      icon: FileText,
      title: '11. Changes to This Privacy Policy',
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground">
            We may update this Privacy Policy from time to time to reflect changes in our practices, technology, legal requirements, or other factors. We will notify you of any material changes by:
          </p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
            <li>Posting the updated policy on our platform with a new "Last Updated" date</li>
            <li>Sending an email notification to registered users</li>
            <li>Displaying a prominent notice on our platform</li>
          </ul>
          <p className="text-muted-foreground">
            Your continued use of our platform after such changes constitutes acceptance of the updated Privacy Policy.
          </p>
        </div>
      ),
    },
    {
      icon: Users,
      title: '12. Contact Us',
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground">
            If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:
          </p>
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <p className="text-foreground font-semibold">Blocks Platform</p>
            <p className="text-muted-foreground">
              <strong>Email:</strong> privacy@blocks.com
            </p>
            <p className="text-muted-foreground">
              <strong>Support:</strong> support@blocks.com
            </p>
            <p className="text-muted-foreground">
              <strong>Address:</strong> [Your Business Address]
            </p>
          </div>
          <p className="text-muted-foreground">
            We will respond to your inquiry within a reasonable timeframe and in accordance with applicable data protection laws.
          </p>
        </div>
      ),
    },
  ];

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/20 rounded-2xl flex items-center justify-center">
              <Shield className="w-8 h-8 text-primary-600 dark:text-primary-400" />
            </div>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">
            Privacy Policy
          </h1>
          <p className="text-xl text-muted-foreground mb-2">
            Your privacy is important to us
          </p>
          <p className="text-sm text-muted-foreground">
            Last Updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Policy Sections */}
        <div className="space-y-6">
          {sections.map((section, index) => {
            const Icon = section.icon;
            return (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/20 rounded-lg flex items-center justify-center">
                      <Icon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-foreground mb-4">
                      {section.title}
                    </h2>
                    <div className="text-muted-foreground leading-relaxed">
                      {section.content}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Footer Note */}
        <div className="mt-12 p-6 bg-muted/50 rounded-lg border border-border text-center">
          <p className="text-muted-foreground">
            By using Blocks, you acknowledge that you have read and understood this Privacy Policy. 
            If you have any questions, please don't hesitate to contact us.
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default PrivacyPolicy;

