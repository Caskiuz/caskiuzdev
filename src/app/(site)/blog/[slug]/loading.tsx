export default function BlogPostLoading() {
  return (
    <div className="min-h-screen pt-24 pb-24">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 animate-pulse">
        <div className="h-4 w-32 bg-muted rounded" />
        <div className="h-64 bg-muted rounded-2xl mt-8" />
        <div className="h-10 w-3/4 bg-muted rounded mt-8" />
        <div className="h-4 w-1/3 bg-muted rounded mt-4" />
        <div className="glass-card mt-10 p-8 space-y-4">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className={`h-4 bg-muted rounded ${i % 2 ? "w-5/6" : "w-full"}`} />
          ))}
        </div>
      </div>
    </div>
  );
}
