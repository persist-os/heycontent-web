"use client";

import { motion } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, Zap, Star, Flame, Eye } from "lucide-react";
import { useTheme } from "next-themes";

// Import our clean components
import { Section } from "./_components/section";
import { Heading } from "./_components/heading";
import { Typewriter } from "./_components/typewriter";
import { FeatureList } from "./_components/feature-list";
import { CTAButton } from "./_components/cta-button";
import { MorphingBackground } from "./_components/morphing-background";
import { ParticleField } from "./_components/particle-field";

export default function AmbassadorPage() {
  const [showIntro, setShowIntro] = useState(true);
  const [showMainContent, setShowMainContent] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    // Show intro for 3 seconds, then show main content
    const timer = setTimeout(() => {
      setShowIntro(false);
      setTimeout(() => setShowMainContent(true), 500);
    }, 3500);
    
    return () => clearTimeout(timer);
  }, []);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Theme-aware accent colors - wait for theme to be loaded
  const isDark = mounted && theme === 'dark';
  const accentColor = isDark ? 'text-accent' : 'text-purple-600';
  const accentIcon = isDark ? 'text-accent' : 'text-purple-600';



  return (
    <div 
      className="relative min-h-screen bg-cover bg-center bg-fixed"
      style={{ backgroundImage: 'url(/clouds.jpg)' }}
    >
      <main className="relative min-h-screen snap-y snap-mandatory overflow-y-scroll h-screen bg-background/60 backdrop-blur-sm">
        {/* Intro Screen with Typewriter */}
        <motion.section 
          className="fixed inset-0 z-50 flex items-center justify-center bg-background"
          initial={{ opacity: 1 }}
          animate={{ 
            opacity: showIntro ? 1 : 0,
            pointerEvents: showIntro ? "all" : "none"
          }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-center px-6 max-w-4xl mx-auto">
            <Typewriter
              text="Better content. Real money."
              speed={100}
              delay={500}
              completionDelay={2000}
              className={`text-4xl md:text-5xl lg:text-6xl font-black ${isDark ? 'bg-gradient-to-r from-foreground via-accent to-foreground' : 'bg-gradient-to-r from-foreground via-purple-600 to-foreground'} bg-clip-text text-transparent`}
              onComplete={() => {}}
            />
            <ParticleField particleCount={40} className="opacity-40" />
          </div>
        </motion.section>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: showMainContent ? 1 : 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10"
        >
          {/* Hero Section */}
          <Section spacing="xl" maxWidth="xl" className="h-screen flex items-center snap-start">
            <div className="text-center space-y-8">
              <Badge variant="outline" className={`${isDark ? 'bg-accent/10 border-accent/30' : 'bg-purple-600/10 border-purple-600/30'} text-foreground`}>
                <Star className={`mr-2 h-4 w-4 ${accentIcon}`} /> 
                HeyContent Launch Partner
              </Badge>
              
              <Heading level={1} size="2xl">
                Creating content is hard enough. What if it didn't have to be?
              </Heading>
              
              <motion.p 
                className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
              >
                We're looking for creators who want to try something that might actually help—and get paid while they figure it out.
              </motion.p>


            </div>
          </Section>

          {/* Here's the thing */}
          <Section background="muted" spacing="xl" maxWidth="xl" className="h-screen flex items-center snap-start">
            <div className="text-center space-y-12 w-full">
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3, duration: 0.8 }}
                className="space-y-12"
              >
                <div className="flex items-center justify-center gap-4">
                  <Sparkles className={`h-8 w-8 ${accentIcon}`} />
                  <span className={`text-2xl font-bold ${accentColor}`}>Here's the thing</span>
                </div>
                
                <div className="max-w-4xl mx-auto">
                  <Typewriter
                    text="You spend hours planning content. Half of it doesn't land. You're constantly switching between apps, losing ideas, drowning in the same repetitive tasks."
                    speed={35}
                    delay={500}
                    completionDelay={2500}
                    className="text-2xl md:text-3xl lg:text-4xl font-semibold leading-tight text-foreground"
                    onComplete={() => {}}
                  />
                </div>
              </motion.div>
            </div>
          </Section>

          {/* Why This Matters */}
          <Section spacing="xl" maxWidth="lg" className="h-screen flex items-center snap-start">
            <div className="text-center space-y-8 w-full">
              <Heading level={2} size="xl">
                We built HeyContent because we felt this too
              </Heading>
              
              <div className="space-y-6 text-lg text-muted-foreground max-w-3xl mx-auto">
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 }}
                >
                  It helps you see patterns in what works, gives you ideas when you're stuck, and handles the boring stuff so you can focus on creating.
                </motion.p>
              </div>
            </div>
          </Section>

          {/* What You Get */}
          <Section spacing="xl" maxWidth="lg" className="h-screen flex items-center snap-start">
            <div className="space-y-12 w-full">
              <Heading level={2} size="xl">
                What's in it for you
              </Heading>
              
              <FeatureList 
                items={[
                  { 
                    icon: <Sparkles className="w-5 h-5" />, 
                    title: "Content ideas that don't suck", 
                    description: "Ideas that actually resonate with your audience and drive engagement." 
                  },
                  { 
                    icon: <Zap className="w-5 h-5" />, 
                    title: "Less time on busywork", 
                    description: "More time creating what you love, less admin work." 
                  },
                  { 
                    icon: <Eye className="w-5 h-5" />, 
                    title: "Insights that actually make sense", 
                    description: "Not just vanity metrics—data that actually helps you grow." 
                  },
                  { 
                    icon: <Flame className="w-5 h-5" />, 
                    title: "Money for sharing your experience", 
                    description: "Get paid for sharing what's working (or not)." 
                  },
                  { 
                    icon: <Star className="w-5 h-5" />, 
                    title: "Other creators who get the struggle", 
                    description: "Connect with people who understand the creative journey." 
                  },
                ]}
              />
            </div>
          </Section>

          {/* The Difference */}
          <Section background="muted" spacing="xl" maxWidth="lg" className="h-screen flex items-center snap-start">
            <div className="text-center space-y-8 w-full">
              <Heading level={2} size="xl">
                No catch
              </Heading>
              
              <div className="space-y-6 text-lg text-muted-foreground max-w-3xl mx-auto">
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 }}
                >
                  Use it how you want. Share what's working (or not). Be honest about your experience. That's it.
                </motion.p>
                
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 }}
                  className={`text-xl font-semibold ${accentColor}`}
                >
                  We're not asking you to be a salesperson. Just be yourself.
                </motion.p>
              </div>
            </div>
          </Section>

          {/* Final CTA */}
          <Section spacing="xl" maxWidth="lg" className="h-screen flex items-center snap-start">
            <div className="text-center space-y-8 w-full">
              <Heading level={2} size="2xl">
                Think this might help your workflow?
              </Heading>
              
              <motion.p 
                className="text-lg text-muted-foreground italic max-w-xl mx-auto"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
              >
                We'll send you everything you need.
              </motion.p>
              
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
              >
                <CTAButton 
                  href="https://lumpy-macrame-21f.notion.site/24b58668c71f807389c7d726b71b5745"
                  size="xl"
                  className="text-xl px-12 py-6"
                >
                  Apply now
                </CTAButton>
              </motion.div>
            </div>
          </Section>
        </motion.div>
      </main>
    </div>
  );
}
