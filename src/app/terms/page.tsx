import { Header, Footer } from '@/components/layout';
import Link from 'next/link';

export default function TermsOfService() {
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
              Terms of Service
            </h1>
            <p className="text-slate-300">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </div>

          <div className="prose prose-invert prose-lg max-w-none text-slate-300 space-y-8">
            {/* Introduction */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">1. Agreement to Terms</h2>
              <p>
                By accessing or using The Elite Vibe AI Model Marketplace ("the Platform"), 
                you agree to be bound by these Terms of Service and our Privacy Policy. 
                If you disagree with any part of these terms, you may not access our Platform.
              </p>
            </section>

            {/* Definitions */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">2. Definitions</h2>
              <ul className="list-disc list-inside space-y-2">
                <li><strong>Platform:</strong> The Elite Vife AI Model Marketplace website and services</li>
                <li><strong>User:</strong> Any person accessing or using the Platform</li>
                <li><strong>Creator/Seller:</strong> Users who upload and sell AI models</li>
                <li><strong>Buyer/Explorer:</strong> Users who purchase and download AI models</li>
                <li><strong>Content:</strong> AI models, images, videos, descriptions, and other materials</li>
                <li><strong>Subscription:</strong> Paid access to enhanced platform features</li>
              </ul>
            </section>

            {/* Account Terms */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">3. Account Registration</h2>
              <div className="space-y-4">
                <p>
                  To access certain features, you must register for an account. You agree to:
                </p>
                <ul className="list-disc list-inside space-y-2">
                  <li>Provide accurate, current, and complete information</li>
                  <li>Maintain the security of your password and accept all risks of unauthorized access</li>
                  <li>Notify us immediately of any unauthorized use of your account</li>
                  <li>Be at least 18 years old or have parental consent</li>
                  <li>Not create multiple accounts for abusive purposes</li>
                </ul>
              </div>
            </section>

            {/* User Responsibilities */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">4. User Responsibilities</h2>
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-cyan-300">For All Users:</h3>
                <ul className="list-disc list-inside space-y-2">
                  <li>Comply with all applicable laws and regulations</li>
                  <li>Respect intellectual property rights</li>
                  <li>Not engage in fraudulent, abusive, or illegal activities</li>
                  <li>Not attempt to disrupt or compromise platform security</li>
                </ul>

                <h3 className="text-xl font-semibold text-purple-300">For Creators:</h3>
                <ul className="list-disc list-inside space-y-2">
                  <li>Only upload content you have the rights to distribute</li>
                  <li>Ensure all uploaded models are safe and free from malware</li>
                  <li>Provide accurate descriptions and pricing</li>
                  <li>Maintain the quality and functionality of your models</li>
                  <li>Comply with our content guidelines and moderation policies</li>
                </ul>

                <h3 className="text-xl font-semibold text-blue-300">For Buyers:</h3>
                <ul className="list-disc list-inside space-y-2">
                  <li>Use purchased models in accordance with their license terms</li>
                  <li>Not redistribute or resell purchased models without permission</li>
                  <li>Respect creator rights and intellectual property</li>
                </ul>
              </div>
            </section>

            {/* Content Guidelines */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">5. Content Guidelines</h2>
              <div className="space-y-4">
                <p><strong>Prohibited Content Includes:</strong></p>
                <ul className="list-disc list-inside space-y-2">
                  <li>Content that infringes on intellectual property rights</li>
                  <li>Malicious software, viruses, or harmful code</li>
                  <li>Content promoting hate speech, violence, or illegal activities</li>
                  <li>Spam, misleading, or fraudulent content</li>
                  <li>Content that violates privacy rights</li>
                  <li>Models designed for unethical or harmful purposes</li>
                </ul>
                
                <p>
                  We reserve the right to remove any content that violates these guidelines 
                  and suspend or terminate accounts of repeat offenders.
                </p>
              </div>
            </section>

            {/* Payments and Fees */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">6. Payments, Fees, and Revenue Share</h2>
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-emerald-300">Pricing and Payments:</h3>
                <ul className="list-disc list-inside space-y-2">
                  <li>All prices are in USD unless otherwise specified</li>
                  <li>Buyers pay the listed price for AI models</li>
                  <li>We use Stripe for secure payment processing</li>
                  <li>All sales are final - no refunds except as required by law</li>
                </ul>

                <h3 className="text-xl font-semibold text-amber-300">Revenue Share:</h3>
                <ul className="list-disc list-inside space-y-2">
                  <li><strong>Starter Plan:</strong> 80% revenue share for creators</li>
                  <li><strong>Pro Plan:</strong> 85% revenue share for creators</li>
                  <li><strong>Enterprise Plan:</strong> 90% revenue share for creators</li>
                  <li>Payouts are processed when balance reaches $50 minimum</li>
                  <li>Platform commission covers payment processing, hosting, and maintenance</li>
                </ul>

                <h3 className="text-xl font-semibold text-purple-300">Subscriptions:</h3>
                <ul className="list-disc list-inside space-y-2">
                  <li>Subscription fees are billed monthly</li>
                  <li>Automatic renewal unless canceled</li>
                  <li>Cancel anytime - access continues through paid period</li>
                  <li>No refunds for partial subscription periods</li>
                </ul>
              </div>
            </section>

            {/* Intellectual Property */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">7. Intellectual Property</h2>
              <div className="space-y-4">
                <p><strong>Creator Rights:</strong></p>
                <ul className="list-disc list-inside space-y-2">
                  <li>You retain all intellectual property rights to your uploaded models</li>
                  <li>By uploading, you grant us license to distribute and display your content</li>
                  <li>You warrant you have necessary rights to all uploaded content</li>
                </ul>

                <p><strong>Buyer Rights:</strong></p>
                <ul className="list-disc list-inside space-y-2">
                  <li>Purchase grants license to use the model per creator's terms</li>
                  <li>License is typically for personal or commercial use as specified</li>
                  <li>Redistribution rights vary by model - check creator terms</li>
                </ul>

                <p><strong>Platform Rights:</strong></p>
                <ul className="list-disc list-inside space-y-2">
                  <li>We own all platform code, design, and branding</li>
                  <li>You grant us license to use your content for platform operation</li>
                </ul>
              </div>
            </section>

            {/* Privacy and Data */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">8. Privacy and Data Protection</h2>
              <p>
                We collect and use personal information as described in our 
                <Link href="/privacy" className="text-cyan-400 hover:text-cyan-300 mx-1">
                  Privacy Policy
                </Link>. 
                By using our Platform, you consent to such processing.
              </p>
            </section>

            {/* Termination */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">9. Termination</h2>
              <div className="space-y-4">
                <p>We may suspend or terminate your account if you:</p>
                <ul className="list-disc list-inside space-y-2">
                  <li>Violate these Terms of Service</li>
                  <li>Create legal liability for us</li>
                  <li>Engage in fraudulent or illegal activities</li>
                  <li>Abuse platform resources</li>
                </ul>
                <p>
                  You may terminate your account at any time by contacting us. 
                  Upon termination, your right to use the Platform will immediately cease.
                </p>
              </div>
            </section>

            {/* Disclaimers */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">10. Disclaimers</h2>
              <div className="space-y-4">
                <p><strong>The Platform is provided "as is" without warranties of any kind.</strong></p>
                <ul className="list-disc list-inside space-y-2">
                  <li>We do not guarantee uninterrupted or error-free service</li>
                  <li>We are not responsible for model quality or performance</li>
                  <li>We do not endorse or guarantee any user-generated content</li>
                  <li>You use models at your own risk</li>
                </ul>
              </div>
            </section>

            {/* Limitation of Liability */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">11. Limitation of Liability</h2>
              <p>
                To the fullest extent permitted by law, The Elite Vibe shall not be liable 
                for any indirect, incidental, special, consequential, or punitive damages, 
                including without limitation, loss of profits, data, use, goodwill, or other 
                intangible losses, resulting from your access to or use of or inability to 
                access or use the Platform.
              </p>
            </section>

            {/* Changes to Terms */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">12. Changes to Terms</h2>
              <p>
                We reserve the right to modify these terms at any time. We will provide 
                notice of material changes via email or platform notification. 
                Continued use after changes constitutes acceptance of modified terms.
              </p>
            </section>

            {/* Governing Law */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">13. Governing Law</h2>
              <p>
                These Terms shall be governed by the laws of [Your Jurisdiction] without 
                regard to its conflict of law provisions. Any disputes shall be resolved 
                in the courts of [Your Jurisdiction].
              </p>
            </section>

            {/* Contact */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">14. Contact Information</h2>
              <p>
                For questions about these Terms of Service, please contact us at:
                <br />
                <span className="text-cyan-400">legal@theelitevibe.com</span>
              </p>
            </section>
          </div>

          {/* Acceptance Section */}
          <div className="mt-8 p-6 bg-slate-700/30 rounded-xl border border-slate-600/50">
            <p className="text-slate-300 text-center">
              By using The Elite Vibe AI Model Marketplace, you acknowledge that you have read, 
              understood, and agree to be bound by these Terms of Service.
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}