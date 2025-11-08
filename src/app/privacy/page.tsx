import { Header, Footer } from '@/components/layout';
import Link from 'next/link';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-3xl opacity-20 animate-pulse delay-1000"></div>
      </div>

      <Header />
      
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-3xl shadow-2xl shadow-black/30 p-6 sm:p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-cyan-100 bg-clip-text text-transparent mb-4">
              Privacy Policy
            </h1>
            <p className="text-slate-300">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </div>

          <div className="prose prose-invert prose-lg max-w-none text-slate-300 space-y-8">
            {/* Introduction */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">1. Introduction</h2>
              <p>
                The Elite Vibe ("we," "our," or "us") is committed to protecting your privacy. 
                This Privacy Policy explains how we collect, use, disclose, and safeguard your 
                information when you use our AI Model Marketplace platform.
              </p>
              <p>
                Please read this policy carefully. By accessing or using our Platform, 
                you agree to the collection and use of information in accordance with this policy.
              </p>
            </section>

            {/* Information We Collect */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">2. Information We Collect</h2>
              
              <h3 className="text-xl font-semibold text-cyan-300 mb-3">Personal Information:</h3>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li><strong>Account Information:</strong> Username, email, display name, profile details</li>
                <li><strong>Payment Information:</strong> Billing address, payment method details (processed by Stripe)</li>
                <li><strong>Communication Data:</strong> Messages, support requests, feedback</li>
                <li><strong>Profile Data:</strong> Bio, preferences, settings, subscription status</li>
              </ul>

              <h3 className="text-xl font-semibold text-purple-300 mb-3">Usage Information:</h3>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li><strong>Platform Activity:</strong> Models viewed, purchased, uploaded, downloaded</li>
                <li><strong>Technical Data:</strong> IP address, browser type, device information</li>
                <li><strong>Cookies and Tracking:</strong> Session data, preferences, analytics</li>
                <li><strong>Performance Data:</strong> Upload/download speeds, error logs</li>
              </ul>

              <h3 className="text-xl font-semibold text-emerald-300 mb-3">Content Information:</h3>
              <ul className="list-disc list-inside space-y-2">
                <li><strong>AI Models:</strong> Uploaded models, descriptions, metadata</li>
                <li><strong>Media Files:</strong> Images, videos, preview content</li>
                <li><strong>Transactional Data:</strong> Purchase history, sales records, earnings</li>
              </ul>
            </section>

            {/* How We Use Information */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">3. How We Use Your Information</h2>
              <div className="space-y-4">
                <p><strong>We use collected information to:</strong></p>
                <ul className="list-disc list-inside space-y-2">
                  <li>Provide, maintain, and improve our Platform</li>
                  <li>Process transactions and manage subscriptions</li>
                  <li>Facilitate communication between buyers and creators</li>
                  <li>Personalize your experience and recommendations</li>
                  <li>Monitor and analyze usage patterns and trends</li>
                  <li>Detect, prevent, and address technical issues and fraud</li>
                  <li>Send administrative information and updates</li>
                  <li>Comply with legal obligations and enforce our terms</li>
                </ul>
              </div>
            </section>

            {/* Information Sharing */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">4. Information Sharing and Disclosure</h2>
              
              <h3 className="text-xl font-semibold text-amber-300 mb-3">We may share information with:</h3>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li><strong>Service Providers:</strong> Payment processors (Stripe), hosting services, analytics providers</li>
                <li><strong>Other Users:</strong> Basic profile information to buyers/creators as needed for transactions</li>
                <li><strong>Business Transfers:</strong> In connection with mergers, acquisitions, or asset sales</li>
                <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
              </ul>

              <h3 className="text-xl font-semibold text-blue-300 mb-3">We do NOT sell your personal information to third parties.</h3>
            </section>

            {/* Data Security */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">5. Data Security</h2>
              <div className="space-y-4">
                <p>
                  We implement appropriate technical and organizational security measures 
                  to protect your personal information, including:
                </p>
                <ul className="list-disc list-inside space-y-2">
                  <li>Encryption of data in transit and at rest</li>
                  <li>Regular security assessments and monitoring</li>
                  <li>Access controls and authentication mechanisms</li>
                  <li>Secure payment processing through Stripe</li>
                  <li>Regular backups and disaster recovery procedures</li>
                </ul>
                <p>
                  However, no method of transmission over the Internet or electronic storage 
                  is 100% secure, and we cannot guarantee absolute security.
                </p>
              </div>
            </section>

            {/* Data Retention */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">6. Data Retention</h2>
              <div className="space-y-4">
                <p>We retain personal information only as long as necessary for:</p>
                <ul className="list-disc list-inside space-y-2">
                  <li>Providing services and maintaining your account</li>
                  <li>Complying with legal and tax obligations</li>
                  <li>Resolving disputes and enforcing agreements</li>
                  <li>Legitimate business purposes</li>
                </ul>
                <p>
                  You can request account deletion, which will remove your personal information 
                  subject to legal retention requirements.
                </p>
              </div>
            </section>

            {/* Your Rights */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">7. Your Rights and Choices</h2>
              <div className="space-y-4">
                <p><strong>You have the right to:</strong></p>
                <ul className="list-disc list-inside space-y-2">
                  <li>Access and receive a copy of your personal data</li>
                  <li>Correct inaccurate or incomplete information</li>
                  <li>Delete your personal data (right to be forgotten)</li>
                  <li>Restrict or object to processing of your data</li>
                  <li>Data portability - receive your data in a readable format</li>
                  <li>Withdraw consent where processing is based on consent</li>
                </ul>

                <p><strong>You can control your information through:</strong></p>
                <ul className="list-disc list-inside space-y-2">
                  <li>Account settings and preferences</li>
                  <li>Communication preferences and unsubscribe options</li>
                  <li>Cookie settings in your browser</li>
                  <li>Direct requests to our support team</li>
                </ul>
              </div>
            </section>

            {/* Cookies and Tracking */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">8. Cookies and Tracking Technologies</h2>
              <div className="space-y-4">
                <p>
                  We use cookies and similar tracking technologies to track activity on our 
                  Platform and store certain information.
                </p>

                <h3 className="text-xl font-semibold text-purple-300 mb-3">Types of cookies we use:</h3>
                <ul className="list-disc list-inside space-y-2">
                  <li><strong>Essential Cookies:</strong> Necessary for platform functionality</li>
                  <li><strong>Preference Cookies:</strong> Remember your settings and preferences</li>
                  <li><strong>Analytics Cookies:</strong> Help us understand how users interact with our Platform</li>
                  <li><strong>Marketing Cookies:</strong> Used to track effectiveness of advertising</li>
                </ul>

                <p>
                  You can instruct your browser to refuse all cookies or to indicate when a cookie 
                  is being sent. However, if you do not accept cookies, you may not be able to use 
                  some portions of our Platform.
                </p>
              </div>
            </section>

            {/* Third-Party Services */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">9. Third-Party Services</h2>
              <div className="space-y-4">
                <p>Our Platform uses third-party services that may collect information:</p>
                
                <h3 className="text-xl font-semibold text-cyan-300 mb-3">Stripe:</h3>
                <p>
                  We use Stripe for payment processing. When you make payments, 
                  Stripe collects and processes your payment information according to their 
                  privacy policy. We do not store your full payment card details.
                </p>

                <h3 className="text-xl font-semibold text-emerald-300 mb-3">Firebase/Storage:</h3>
                <p>
                  We use cloud storage services for hosting AI models and media files. 
                  Your content is stored securely and accessed only as necessary for platform operation.
                </p>

                <h3 className="text-xl font-semibold text-amber-300 mb-3">Analytics Services:</h3>
                <p>
                  We may use analytics services to understand platform usage and improve our services. 
                  These services collect aggregated, anonymized data.
                </p>
              </div>
            </section>

            {/* International Transfers */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">10. International Data Transfers</h2>
              <p>
                Your information may be transferred to and maintained on computers located 
                outside of your state, province, country, or other governmental jurisdiction 
                where the data protection laws may differ from those of your jurisdiction.
              </p>
              <p>
                We ensure appropriate safeguards are in place for international data transfers 
                and that your data receives an adequate level of protection.
              </p>
            </section>

            {/* Children's Privacy */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">11. Children's Privacy</h2>
              <p>
                Our Platform is not intended for use by children under the age of 18 ("Children"). 
                We do not knowingly collect personally identifiable information from Children. 
                If you become aware that a Child has provided us with personal information, 
                please contact us immediately.
              </p>
            </section>

            {/* Changes to Policy */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">12. Changes to This Privacy Policy</h2>
              <p>
                We may update our Privacy Policy from time to time. We will notify you of any 
                changes by posting the new Privacy Policy on this page and updating the 
                "Last updated" date.
              </p>
              <p>
                We will let you know via email and/or a prominent notice on our Platform 
                prior to the change becoming effective and update the "effective date" at the top of this Privacy Policy.
              </p>
            </section>

            {/* Contact */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">13. Contact Us</h2>
              <p>
                If you have any questions about this Privacy Policy, please contact us:
              </p>
              <div className="bg-slate-700/30 rounded-xl p-4 mt-4">
                <p className="text-cyan-400 font-semibold">The Elite Vibe</p>
                <p>Email: privacy@theelitevibe.com</p>
                <p>Support: support@theelitevibe.com</p>
              </div>
            </section>

            {/* Compliance */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">14. Compliance with Regulations</h2>
              <div className="space-y-4">
                <p>
                  We comply with applicable data protection regulations including GDPR, CCPA, 
                  and other privacy laws. Specific rights may vary based on your location.
                </p>

                <h3 className="text-xl font-semibold text-green-300 mb-3">GDPR (EU Users):</h3>
                <p>
                  We act as a data controller for EU users. You have enhanced rights under GDPR 
                  regarding your personal data.
                </p>

                <h3 className="text-xl font-semibold text-orange-300 mb-3">CCPA (California Users):</h3>
                <p>
                  California residents have specific rights regarding their personal information 
                  under the California Consumer Privacy Act.
                </p>
              </div>
            </section>
          </div>

          {/* Acceptance Section */}
          <div className="mt-8 p-6 bg-slate-700/30 rounded-xl border border-slate-600/50">
            <p className="text-slate-300 text-center">
              By using The Elite Vibe AI Model Marketplace, you acknowledge that you have read, 
              understood, and agree to the practices described in this Privacy Policy.
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}