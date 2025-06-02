import React, { useState, useEffect } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useAuth } from '@/app/context/auth-context';

interface PersonaStepProps {
  name: string;
  onComplete: () => void;
  onSkip: () => void;
}

const PersonaStep: React.FC<PersonaStepProps> = ({ name, onComplete, onSkip }) => {
  const { firebaseUser } = useAuth();
  const createPersona = useMutation(api.personas.createPersona);
  
  const [currentPersona, setCurrentPersona] = useState("");
  const [futureVision, setFutureVision] = useState("");
  const [personaLoading, setPersonaLoading] = useState(false);
  const [personaSuccess, setPersonaSuccess] = useState<string | null>(null);
  const [personaError, setPersonaError] = useState<string | null>(null);

  // Restore persona fields from localStorage on mount
  useEffect(() => {
    const savedPersona = localStorage.getItem('register_currentPersona');
    const savedVision = localStorage.getItem('register_futureVision');
    if (savedPersona) setCurrentPersona(savedPersona);
    if (savedVision) setFutureVision(savedVision);
  }, []);

  // Persist persona fields to localStorage on change
  useEffect(() => {
    localStorage.setItem('register_currentPersona', currentPersona);
  }, [currentPersona]);

  useEffect(() => {
    localStorage.setItem('register_futureVision', futureVision);
  }, [futureVision]);

  const handleSavePersona = async (e: React.FormEvent) => {
    e.preventDefault();
    setPersonaLoading(true);
    setPersonaSuccess(null);
    setPersonaError(null);
    
    try {
      if (!firebaseUser) throw new Error("You must be logged in to save your persona.");
      
      await createPersona({
        userId: firebaseUser.uid,
        preferredName: name,
        currentPersona,
        futureVision,
      });
      
      setPersonaSuccess("Persona saved!");
      // Clear localStorage after successful save
      localStorage.removeItem('register_currentPersona');
      localStorage.removeItem('register_futureVision');
      // Advance to next step after successful save
      onComplete();
    } catch (err: any) {
      setPersonaError(err.message || "Failed to save persona.");
    } finally {
      setPersonaLoading(false);
    }
  };

  const handleSkip = () => {
    // Clear localStorage if firebaseUser skips
    localStorage.removeItem('register_currentPersona');
    localStorage.removeItem('register_futureVision');
    onSkip();
  };

  return (
    <form onSubmit={handleSavePersona} className="space-y-4 bg-white shadow-lg rounded-xl p-4 sm:p-8">
      <h2 className="text-2xl font-bold mb-4 text-center">Your Creator Persona</h2>
      <p className="text-center text-gray-600 mb-4">
        <strong>What is a Persona?</strong> <br />
        This is a personal snapshot of who you are and who you want to become. We share this with your HeyContent chat so it can better understand and support you. You can keep it simple or get creative—it's all about you!
      </p>
      
      <div>
        <label htmlFor="currentPersona" className="block text-sm font-medium mb-1">Current Persona</label>
        <div className="relative">
          <textarea
            id="currentPersona"
            value={currentPersona}
            onChange={e => setCurrentPersona(e.target.value.slice(0, 500))}
            className="w-full border rounded px-3 py-2 min-h-[90px] resize-none pr-12"
            rows={3}
            maxLength={500}
            required
          />
          <span className="absolute bottom-2 right-3 text-xs text-gray-400 bg-white bg-opacity-80 px-1 rounded">
            {currentPersona.length}/500
          </span>
        </div>
        <div className="flex justify-between items-center mt-1">
          <span className="text-xs text-gray-500">
            Example:
            <span className="italic block mt-1">
              "I'm a lifestyle content creator who loves sharing my daily routines, travel adventures, and wellness tips. I enjoy connecting with my audience through authentic stories and inspiring others to live their best lives."
            </span>
          </span>
        </div>
      </div>
      
      <div>
        <label htmlFor="futureVision" className="block text-sm font-medium mb-1">Future Vision</label>
        <div className="relative">
          <textarea
            id="futureVision"
            value={futureVision}
            onChange={e => setFutureVision(e.target.value.slice(0, 500))}
            className="w-full border rounded px-3 py-2 min-h-[90px] resize-none pr-12"
            rows={3}
            maxLength={500}
            required
          />
          <span className="absolute bottom-2 right-3 text-xs text-gray-400 bg-white bg-opacity-80 px-1 rounded">
            {futureVision.length}/500
          </span>
        </div>
        <div className="flex justify-between items-center mt-1">
          <span className="text-xs text-gray-500">
            Example:
            <span className="italic block mt-1">
              "I want to build a global brand that empowers my followers to feel confident and creative. My dream is to inspire millions, launch my own product line, and collaborate with top creators and brands around the world."
            </span>
          </span>
        </div>
      </div>
      
      <button
        type="submit"
        className="w-full bg-blue-600 text-white py-2 rounded disabled:opacity-50"
        disabled={personaLoading}
      >
        {personaLoading ? 'Saving...' : 'Continue'}
      </button>
      
      {personaSuccess && <div className="text-green-500 text-sm">{personaSuccess}</div>}
      {personaError && <div className="text-red-500 text-sm">{personaError}</div>}
      
      <button
        type="button"
        className="w-full mt-2 bg-gray-200 text-gray-700 py-2 rounded border border-gray-300 hover:bg-gray-100"
        onClick={handleSkip}
      >
        Skip this and add in settings later
      </button>
    </form>
  );
};

export default PersonaStep; 