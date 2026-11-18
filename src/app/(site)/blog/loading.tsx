export default function BlogLoading() {
  return (
    <div className="min-h-screen pt-24 pb-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 animate-pulse">
        <div className="h-4 w-20 mx-auto bg-muted rounded" />
        <div className="h-12 w-72 mx-auto bg-muted rounded mt-4" />
        <div className="h-6 w-96 mx-auto bg-muted rounded mt-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="glass-card p-6 space-y-3">
              <div className="h-36 bg-muted rounded-xl" />
              <div className="h-4 w-2/3 bg-muted rounded" />
              <div className="h-3 w-full bg-muted rounded" />
              <div className="h-3 w-5/6 bg-muted rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
