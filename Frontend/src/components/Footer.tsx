import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-[#202430] py-16 text-slate-300">
      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-8 px-4 sm:px-6 md:grid-cols-4 lg:gap-12">
        <div className="md:col-span-1">
          <Link to="/" className="mb-4 block text-2xl font-bold text-white">
            Remote<span className="text-primary">In</span>
          </Link>
          <p className="mb-6 text-sm leading-relaxed">
            Great platform for the job seeker that is passionate about startups. Find your dream job easier.
          </p>
        </div>

        <div>
           <h3 className="mb-4 font-semibold text-white">About</h3>
           <ul className="space-y-3 text-sm">
             <li><Link to="#" className="transition-colors hover:text-white">Companies</Link></li>
             <li><Link to="#" className="transition-colors hover:text-white">Pricing</Link></li>
             <li><Link to="#" className="transition-colors hover:text-white">Terms</Link></li>
             <li><Link to="#" className="transition-colors hover:text-white">Advice</Link></li>
             <li><Link to="#" className="transition-colors hover:text-white">Privacy Policy</Link></li>
           </ul>
        </div>

        <div>
           <h3 className="mb-4 font-semibold text-white">Resources</h3>
           <ul className="space-y-3 text-sm">
             <li><Link to="#" className="transition-colors hover:text-white">Help Docs</Link></li>
             <li><Link to="#" className="transition-colors hover:text-white">Guide</Link></li>
             <li><Link to="#" className="transition-colors hover:text-white">Updates</Link></li>
             <li><Link to="#" className="transition-colors hover:text-white">Contact Us</Link></li>
           </ul>
        </div>

        <div>
           <h3 className="mb-4 font-semibold text-white">Get job notifications</h3>
           <p className="mb-4 text-sm">The latest job news, articles, sent to your inbox weekly.</p>
           <form className="flex gap-2" onSubmit={(e) => e.preventDefault()}>
             <input 
               type="email" 
               placeholder="Email address" 
               className="w-full rounded border border-white/20 bg-white/10 px-3 py-2 text-sm text-white focus:border-primary focus:outline-none"
             />
             <button type="submit" className="rounded bg-primary px-4 py-2 font-medium text-white transition-colors hover:bg-primary-hover">
               Subscribe
             </button>
           </form>
        </div>
      </div>

      <div className="mx-auto mt-12 flex w-full max-w-6xl flex-col items-center justify-between border-t border-white/10 px-4 pt-8 text-sm sm:px-6 md:flex-row">
        <p>2026 © RemoteIn. All rights reserved.</p>
        <div className="mt-4 flex gap-4 md:mt-0">
          <a href="#" className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white/20">fb</a>
          <a href="#" className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white/20">in</a>
          <a href="#" className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white/20">tw</a>
        </div>
      </div>
    </footer>
  );
}
