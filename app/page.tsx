export default function Home(): JSX.Element {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 w-full max-w-5xl items-center justify-center font-mono text-sm">
        <div className="text-center">
          <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-accent-blue via-accent-green to-accent-blue bg-clip-text text-transparent">
            Project Zeta
          </h1>
          <p className="text-2xl text-text-secondary mb-8">
            Financial Planning Application
          </p>
          <p className="text-text-tertiary max-w-2xl mx-auto">
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
          
          <div className="mt-12 text-text-tertiary text-sm">
            <p>Status: 🟡 Phase 0 - Project Initialization</p>
            <p className="mt-2">Ready to start development! 🚀</p>
          </div>
        </div>
      </div>
    </main>
  );
}

