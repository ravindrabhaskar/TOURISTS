export default function LoadingTrips() {
  return (
    <div className="container-x py-10 sm:py-14">
      <div className="skeleton h-8 w-40" />
      <div className="skeleton mt-4 h-12 w-80 max-w-full" />
      <div className="skeleton mt-4 h-5 w-96 max-w-full" />
      <div className="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="card overflow-hidden p-0">
            <div className="skeleton aspect-[4/3] rounded-none" />
            <div className="space-y-3 p-4">
              <div className="skeleton h-5 w-3/4" />
              <div className="skeleton h-4 w-full" />
              <div className="skeleton h-4 w-2/3" />
              <div className="skeleton h-2 w-full rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
