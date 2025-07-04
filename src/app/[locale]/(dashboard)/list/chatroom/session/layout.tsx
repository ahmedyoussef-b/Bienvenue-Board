// This layout will provide a full-screen container for the session room,
// bypassing the main dashboard layout that includes the global navbar.

export default function SessionPageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen w-screen bg-muted/30">
      {children}
    </div>
  );
}
