export function BountyHealth() {
  return (
    <div className="mt-6 rounded-2xl bg-gradient-to-br from-surface-container-high to-surface p-1 shadow-xl">
      <div className="flex flex-col items-center gap-8 rounded-xl bg-surface p-8 md:flex-row">
        <div className="w-full md:w-1/3">
          <h3 className="mb-2 font-headline text-lg font-bold">Bounty Health</h3>
          <p className="mb-6 text-sm text-on-surface-variant">
            Aggregated funding status across all active challenges.
          </p>
          <div className="space-y-4">
            <div>
              <div className="mb-2 flex justify-between text-xs">
                <span className="text-on-surface-variant">Escrow Status</span>
                <span className="font-bold text-secondary">92%</span>
              </div>
              <div className="bounty-pulse">
                <div className="bounty-pulse-fill" style={{ width: '92%' }}></div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4">
              <div>
                <p className="text-[10px] font-bold uppercase text-on-surface-variant">
                  Voter Quorum
                </p>
                <p className="text-xl font-bold text-on-surface">84.2%</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase text-on-surface-variant">
                  Avg. Quality
                </p>
                <p className="text-xl font-bold text-secondary">4.8/5</p>
              </div>
            </div>
          </div>
        </div>
        <div className="hidden h-40 w-px bg-outline-variant/10 md:block"></div>
        <div className="w-full flex-1">
          <div className="overflow-hidden rounded-xl border border-outline-variant/10">
            <img
              className="h-40 w-full object-cover opacity-50 grayscale transition-all duration-700 hover:grayscale-0"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDCvwRNMOFtef_42YQLaREvDBel2OVFBO08fCBDESKtxzcjs1F59moWVKUERkk5ugny2Dptf6pJNqAgQHficlbyfVnMUkNpV8Ec_N_8TcvzS0BlsDYo5f3gpmHkWyP0Rs_z-nt7ezpvqRSKgaG4VtoaWWddsbQ8y-X8czw9qRtfmwqo29nGAGAnFQfqs4K5lo9S4SwKre7w6KPDk73pIeDjZ3OGZfloMID6WdNnLIkzBI0-kXI2-H14a7chrbI27JBGzez1BU7rmxqk"
              alt="Data visualization"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
