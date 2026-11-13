import React from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { useFetch } from "../hooks/useFetch.js";
import { LoadingState, ErrorState, EmptyState } from "../components/AsyncState.jsx";
import GazuEditorialArrival from "../components/editorial/GazuEditorialArrival.jsx";
import GazuEditNav from "../components/editorial/GazuEditNav.jsx";

export default function Launches() {
  const { data, loading, error, reload } = useFetch("/marketing/launches");
  const now = Date.now();
  return (
    <main className="gazu-editorial-page">
      <GazuEditorialArrival kicker="GAZU / THE JOURNAL" title="THE NEXT CHAPTER"
        description="What comes next. New perspectives, familiar attention to detail."
        actionLabel="VIEW ANNOUNCEMENTS" onAction={() => document.getElementById("gazu-announcements")?.scrollIntoView({ behavior: "smooth" })}/>
      <GazuEditNav />
      <section className="gazu-editorial-content" id="gazu-announcements" aria-labelledby="gazu-launch-heading">
        <div className="gazu-editorial-section-top"><span>03 / COLLECTION NOTES</span><span>GAZU STUDIO / 2026</span></div>
        <div className="gazu-editorial-title-row"><div><p className="gazu-editorial-kicker">COMING INTO FOCUS</p><h2 id="gazu-launch-heading">THE <em>NEW</em> EDIT</h2></div><p>Only launches confirmed by our store team are announced here. Dates and links come from the existing backend.</p></div>
        {loading ? <LoadingState>Loading collection announcements...</LoadingState>
          : error ? <ErrorState message={error} retry={reload} />
          : (data || []).length ? <div className="gazu-editorial-announcements">{data.map((item, i) => <article className="gazu-editorial-announcement" key={item._id}>
            <span className="gazu-editorial-kicker">GAZU EDIT / {String(i+1).padStart(2,"0")}</span><h3>{item.title}</h3><p>{item.description}</p><p className="gazu-editorial-date">{new Date(item.startsAt).getTime() > now ? "UPCOMING" : "AVAILABLE NOW"} · {new Date(item.startsAt).toLocaleDateString("en-IN")}</p>
            <Link className="gazu-editorial-link" to={item.link || "/shop"}>EXPLORE COLLECTION <ArrowUpRight size={16} aria-hidden="true" /></Link>
          </article>)}</div> : <EmptyState>No upcoming launches have been announced.</EmptyState>}
      </section>
    </main>
  );
}
