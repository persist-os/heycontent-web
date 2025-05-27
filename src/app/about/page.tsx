import React from 'react';
import Link from 'next/link';

export default function About() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <nav className="mb-8">
        <Link href="/" className="text-blue-600 hover:text-blue-800">
          ← Back to Home
        </Link>
      </nav>

      <article className="prose prose-gray max-w-none">
        <h1 className="text-4xl font-bold mb-6">About HeyContent</h1>
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">Redefining Digital Strategy Through AI</h2>
        
        <p className="mb-8">
          HeyContent stands at the intersection of artificial intelligence,
          brand strategy, and content creation. We're transforming how creators and brands navigate the digital landscape 
          by providing AI-powered insights, strategic consulting, and growth optimization through our innovative platform.
        </p>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Our Mission</h2>
          <p>
            We empower creators and brands to achieve their full potential by translating complex data into strategic action. 
            Our AI technology doesn't just analyze – it understands, predicts, and guides, serving as your always-on strategic 
            partner in the digital space. We believe in a future where the gap between creators, brands, and their audiences 
            disappears, where strategic decisions are powered by intelligent insights, and where growth is driven by deep 
            understanding rather than guesswork.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Strategic AI Partnership</h2>
          <p>
            HeyContent serves as your strategic consultant, delivering insights typically reserved for high-end marketing 
            agencies and brand consultants. Our sophisticated AI system continuously analyzes patterns across platforms, 
            developing comprehensive strategies for brand positioning and growth. By processing vast amounts of data in 
            real-time, we provide nuanced recommendations that adapt to changing market conditions and audience preferences.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Comprehensive Platform Integration</h2>
          <p>
            Our platform creates a unified view of your digital presence across YouTube, Instagram, TikTok, and professional 
            communications. We analyze performance metrics, engagement data, and emerging trends to craft strategies that 
            resonate with your audience. Through deep analysis of cross-platform dynamics, we identify opportunities for 
            growth and collaboration before they become apparent to others in the market.
          </p>
        </section>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <section>
            <h2 className="text-2xl font-semibold mb-4">Creator Success</h2>
            <p>
              We guide creators through their evolution into sophisticated digital brands. Our platform provides professional 
              brand development guidance while ensuring authenticity in your market position. Through strategic content planning 
              and optimization, we ensure every piece of content serves your larger goals, helping you build sustainable growth 
              and meaningful partnerships.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Brand Growth</h2>
            <p>
              For brands seeking deeper connections with their digital audience, HeyContent provides unparalleled insights and 
              strategic guidance. We help identify ideal creator partnerships, forecast content performance, and track audience 
              sentiment to ensure your message resonates authentically. Our strategic recommendations help you build lasting 
              relationships with your target audience while maintaining brand integrity.
            </p>
          </section>
        </div>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Partnership Innovation</h2>
          <p>
            At the heart of HeyContent is our ability to create meaningful connections between creators and brands. Our AI 
            analyzes numerous variables to identify partnerships with the highest potential for success, providing insights 
            that help both parties reach mutually beneficial agreements. We continue monitoring and optimizing these 
            relationships, ensuring long-term success for everyone involved.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Our Technology</h2>
          <p>
            Our proprietary AI system combines advanced machine learning with strategic consulting expertise. This unique 
            integration allows us to provide predictive analytics, strategic recommendations, and partnership insights that 
            drive real results. We're constantly evolving our technology to stay ahead of market trends and provide 
            increasingly valuable insights to our users.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Our Commitment</h2>
          <p>
            We maintain the highest standards of data security and privacy while building lasting partnerships with our users. 
            Our commitment to innovation is matched only by our dedication to providing practical, actionable guidance. We 
            believe in democratizing access to high-level strategic consulting through our AI technology, making 
            professional-grade insights available to creators and brands of all sizes.
          </p>
        </section>

        <section className="bg-gray-50 p-8 rounded-lg">
          <h2 className="text-2xl font-semibold mb-4">Join Our Ecosystem</h2>
          <p>
            HeyContent is building a new kind of digital ecosystem where creators, brands, and audiences thrive together. 
            Whether you're a creator looking to build your brand or a business seeking to optimize your digital strategy, 
            our AI-powered platform provides the insights and guidance you need to succeed.
          </p>
        </section>
      </article>
    </div>
  );
} 