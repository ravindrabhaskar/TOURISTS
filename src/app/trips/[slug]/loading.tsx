export default function LoadingTripDetail() {
  return (
    <div className="container-x space-y-6 py-10 sm:py-12">
      <div className="skeleton h-4 w-56" />
      <div className="skeleton h-10 w-96 max-w-full" />
      <div className="skeleton h-5 w-72" />
      <div className="skeleton aspect-[16/9] max-h-[26rem]" />
      <div className="grid gap-10 lg:flex lg:flex-row-reverse">
        <div className="w-full space-y-4 lg:w-96 lg:shrink-0">
          <div className="skeleton h-64" />
          <div className="skeleton h-40" />
        </div>
        <div className="flex-1 space-y-4">
          <div className="skeleton h-24" />
          <div className="skeleton h-48" />
          <div className="skeleton h-64" />
        </div>
      </div>
    </div>
  );
}
