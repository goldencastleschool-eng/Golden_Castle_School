function HeroSkeleton() {
  return (
    <div className="relative w-full min-h-screen overflow-hidden bg-secondary animate-pulse">

      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-r from-secondary via-secondary/90 to-secondary"></div>

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50"></div>

      {/* Content */}
      <div className="relative z-10 flex items-center min-h-screen px-4 sm:px-6 md:px-10 lg:px-16">

        <div className="w-full max-w-4xl">

          <div className="h-5 w-32 sm:w-40 bg-primary/20 rounded-full mb-6"></div>

          <div className="space-y-4">
            <div className="h-10 sm:h-14 md:h-16 w-full bg-primary/20 rounded-xl"></div>
            <div className="h-10 sm:h-14 md:h-16 w-5/6 bg-primary/20 rounded-xl"></div>
          </div>

          <div className="mt-6 sm:mt-8 space-y-3">
            <div className="h-4 w-full sm:w-3/4 bg-primary/20 rounded"></div>
            <div className="h-4 w-2/3 bg-primary/20 rounded"></div>
          </div>

          <div className="flex flex-wrap gap-4 mt-8 sm:mt-10">
            <div className="h-12 sm:h-14 w-32 sm:w-36 bg-primary/20 rounded-2xl"></div>
            <div className="h-12 sm:h-14 w-36 sm:w-40 bg-primary/20 rounded-2xl"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HeroSkeleton;