import { useState, useEffect } from 'react';
import Hero from '../components/Hero';
import Companies from '../components/Companies';
import ExploreByCategory from '../components/ExploreByCategory';
import PostJobCTA from '../components/PostJobCTA';
import FeaturedJobs from '../components/FeaturedJobs';
import LatestJobs from '../components/LatestJobs';
import Footer from '../components/Footer';

export default function Home() {
  const [jobs, setJobs] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/jobs')
      .then(res => res.json())
      .then(data => setJobs(data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="bg-white flex flex-col justify-start items-start w-full overflow-hidden">
      <Hero />
      <Companies />
      <ExploreByCategory />
      <PostJobCTA />
      <FeaturedJobs />
      <LatestJobs jobs={jobs} />
      <Footer />
    </div>
  );
}
