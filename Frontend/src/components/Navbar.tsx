import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <>
    <div data-device="Desktop" data-type="Top Nav" className="w-[1440px] px-32 left-0 top-0 absolute inline-flex justify-between items-center">
      <div className="self-stretch flex justify-center items-center gap-12">
        <Link to="/" className="flex justify-center items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 relative overflow-hidden">
            <div className="w-8 h-8 left-0 top-0 absolute bg-indigo-600 rounded-full" />
            <div className="w-4 h-1.5 left-[7px] top-[22px] absolute rounded-[0.50px] border-[3px] border-white" />
            <div className="w-5 h-5 left-[6px] top-[22.56px] absolute origin-top-left -rotate-90">
              <div className="w-3.5 h-3.5 left-[2.32px] top-[2.70px] absolute rounded-full outline outline-2 outline-offset-[-1px] outline-white" />
              <div className="w-[2.93px] h-[2.94px] left-[15.40px] top-[2.05px] absolute outline outline-2 outline-offset-[-1px] outline-white" />
            </div>
          </div>
          <div className="justify-start text-slate-800 text-2xl font-bold font-['Red_Hat_Display'] leading-9">JobHuntly</div>
        </Link>
        <div className="self-stretch flex justify-center items-end gap-4">
          <Link to="/remote-jobs" data-active="False" className="inline-flex flex-col justify-start items-start gap-6 cursor-pointer">
            <div className="justify-start text-slate-600 text-base font-medium font-['Epilogue'] leading-6 hover:text-indigo-600 transition-colors">Find Jobs</div>
            <div className="self-stretch h-1 bg-indigo-600/0" />
          </Link>
          <div data-active="False" className="inline-flex flex-col justify-start items-start gap-6">
            <div className="justify-start text-slate-600 text-base font-medium font-['Epilogue'] leading-6">Browse Companies</div>
            <div className="self-stretch h-1 bg-indigo-600/0" />
          </div>
        </div>
      </div>
      <div className="h-20 flex justify-center items-center gap-4">
        <Link to="/login" data-icon="No Icon" data-size="Medium" data-style="Text" data-type="Plain" className="px-6 py-3 rounded flex justify-center items-center gap-2.5 cursor-pointer hover:bg-indigo-50 transition-colors">
          <div className="text-center justify-start text-indigo-600 text-base font-bold font-['Epilogue'] leading-6">Login</div>
        </Link>
        <div className="w-12 h-0 origin-top-left rotate-90 outline outline-1 outline-offset-[-0.50px] outline-zinc-200"></div>
        <Link to="/register" data-icon="No Icon" data-size="Medium" data-style="Filled" data-type="Primary" className="px-6 py-3 bg-indigo-600 flex justify-center items-center gap-2.5 cursor-pointer hover:bg-indigo-700 transition-colors shadow-md rounded">
          <div className="text-center justify-start text-white text-base font-bold font-['Epilogue'] leading-6">Sign Up</div>
        </Link>
      </div>
    </div>

    </>
  );
}
