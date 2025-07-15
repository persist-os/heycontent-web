export default function LegalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-6 py-16 sm:px-8 lg:px-12">
        {children}
      </div>
    </div>
  );
} 