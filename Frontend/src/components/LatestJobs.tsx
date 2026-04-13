import type { JobResponse } from '../types/api';

export default function LatestJobs({ jobs }: { jobs: JobResponse[] }) {
  return (
    <>
<div className="w-[1440px] h-[877px] relative overflow-hidden">
    <div className="w-[1440px] h-[877px] left-0 top-0 absolute bg-slate-50" />
    <div className="w-[860px] h-[794px] left-[780px] top-[83px] absolute">
      <div className="w-48 h-96 left-[480.75px] top-[-298.25px] absolute origin-top-left rotate-[64deg] opacity-60 bg-slate-50 border-4 border-indigo-200" />
      <div className="w-80 h-[778.51px] left-[681.77px] top-[220px] absolute origin-top-left rotate-[64deg] bg-slate-50 border-4 border-indigo-200" />
      <div className="w-72 h-[716.25px] left-[382.77px] top-[617px] absolute origin-top-left rotate-[64deg] bg-slate-50 border-4 border-indigo-200" />
    </div>
    <div className="left-[124px] top-[72px] absolute inline-flex flex-col justify-start items-start gap-12">
      <div className="w-[1192px] inline-flex justify-between items-end">
        <div className="justify-start"><span className="text-slate-800 text-5xl font-semibold font-['Clash_Display_Variable'] leading-[52.80px]">Latest </span><span className="text-sky-400 text-5xl font-semibold font-['Clash_Display_Variable'] leading-[52.80px]">jobs open</span></div>
        <div className="flex justify-end items-center gap-4">
          <div className="text-center justify-start text-indigo-600 text-base font-semibold font-['Epilogue'] leading-6">Show all jobs</div>
          <div data-name="Arrow Right" className="w-6 h-6 relative">
            <div className="w-0 h-3.5 left-[4.75px] top-[11.23px] absolute outline outline-2 outline-offset-[-1px] outline-indigo-600" />
            <div className="w-3.5 h-1.5 left-[13.70px] top-[20.21px] absolute outline outline-2 outline-offset-[-1px] outline-indigo-600" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-8 w-[1192px]">
        {jobs.length > 0 ? jobs.slice(0, 8).map((job) => (
          <div key={job.id} data-button="False" data-icon="False" data-label="True" data-progress="False" data-size="Small" data-type="Filled" className="w-[580px] px-10 py-6 bg-white inline-flex justify-start items-start gap-6 border border-zinc-200">
            <div data-property-1="Netlify" className="w-16 h-16 relative flex-shrink-0">
              <div className="w-16 h-16 left-0 top-0 absolute bg-stone-300 rounded-full flex items-center justify-center text-xl font-bold">
                 {job.company?.[0]?.toUpperCase()}
              </div>
            </div>
            <div className="inline-flex flex-col justify-start items-start gap-2">
              <div className="justify-start text-slate-800 text-xl font-semibold font-['Epilogue'] leading-6">{job.title}</div>
              <div className="h-7 inline-flex justify-center items-center gap-2">
                <div className="justify-start text-slate-600 text-base font-normal font-['Epilogue'] leading-6">{job.company}</div>
                <div className="w-1 h-1 bg-slate-600 rounded-full" />
                <div className="justify-start text-slate-600 text-base font-normal font-['Epilogue'] leading-6">{job.location}</div>
              </div>
              <div className="inline-flex justify-start items-start gap-2">
                  <div data-color="Green" data-type="Filled" className="px-2.5 py-1.5 bg-emerald-300/10 rounded-[80px] flex justify-center items-center gap-2">
                  <div className="justify-start text-emerald-300 text-sm font-semibold font-['Epilogue'] leading-6">Active</div>
                  </div>
                <div className="w-px self-stretch bg-zinc-200" />
                <div data-color="Yellow" data-type="Outline" className="px-2.5 py-1.5 rounded-[80px] outline outline-1 outline-offset-[-1px] outline-amber-400 flex justify-center items-center gap-2">
                  <div className="justify-start text-amber-400 text-sm font-semibold font-['Epilogue'] leading-6">{job.salary_min && job.salary_max ? "$" + job.salary_min + " - $" + job.salary_max : 'N/A'}</div>
                </div>
              </div>
            </div>
          </div>
        )) : (
           <p className="text-gray-500">Loading latest jobs...</p>
        )}
      </div>
  </div>
      </div>
      </>
  );
}
