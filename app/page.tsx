export default function Home(): JSX.Element {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8 md:p-24">
      <div className="z-10 w-full max-w-5xl items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-accent-blue via-accent-green to-accent-blue bg-clip-text text-transparent">
            Project Zeta
          </h1>
          <p className="text-xl md:text-2xl text-text-secondary mb-8">
            Financial Planning Application
          </p>
          <p className="text-text-tertiary max-w-2xl mx-auto text-sm md:text-base">
            World-class financial planning application for school relocation assessment.
            Evaluating 30-year projections (2023-2052) with focus on rent model comparison.
          </p>
          
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-background-secondary rounded-lg border border-background-tertiary">
              <h3 className="text-accent-blue text-xl font-semibold mb-2">🏗️ Version Management</h3>
              <p className="text-text-tertiary text-sm">
                Create, compare, and lock financial scenarios
              </p>
            </div>
            
            <div className="p-6 bg-background-secondary rounded-lg border border-background-tertiary">
              <h3 className="text-accent-green text-xl font-semibold mb-2">💰 Financial Calculations</h3>
              <p className="text-text-tertiary text-sm">
                Real-time 30-year projections with &lt;50ms performance
              </p>
            </div>
            
            <div className="p-6 bg-background-secondary rounded-lg border border-background-tertiary">
              <h3 className="text-accent-orange text-xl font-semibold mb-2">📊 Analytics</h3>
              <p className="text-text-tertiary text-sm">
                Interactive charts, NPV analysis, EBITDA trending
              </p>
            </div>
          </div>
          
          <div className="mt-12 space-y-4">
            <div className="inline-block px-6 py-3 bg-background-secondary rounded-lg border border-background-tertiary">
              <p className="text-text-primary font-semibold">Status: 🟢 Phase 0-8 Complete (79%)</p>
              <p className="text-text-tertiary text-sm mt-2">
                23 of 29 features implemented • Ready for testing phase! 🚀
              </p>
            </div>
            
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/auth/signin"
                className="px-6 py-3 bg-accent-blue text-white rounded-lg hover:bg-accent-blue/90 transition-colors font-medium"
              >
                Sign In to Dashboard
              </a>
              <a
                href="/versions"
                className="px-6 py-3 bg-background-secondary border border-background-tertiary text-text-primary rounded-lg hover:bg-background-tertiary transition-colors font-medium"
              >
                View Versions
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

