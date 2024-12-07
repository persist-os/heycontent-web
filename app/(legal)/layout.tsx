export default function LegalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gradient-to-r from-[#F8F0F9] to-blue-50">
      <div className="container max-w-4xl mx-auto py-12 px-4">
        {children}
      </div>
    </div>
  );
} 