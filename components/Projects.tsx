"use client";

import { useRef, useEffect, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { projects } from "@/lib/projects";
import SpotlightCard from "@/components/reactbits/SpotlightCard";
import AnimatedContent from "@/components/reactbits/AnimatedContent";
import BlurText from "@/components/reactbits/BlurText";
import { isMobile } from "@/lib/device";

gsap.registerPlugin(ScrollTrigger);

function ProjectCard({ project, index }: { project: (typeof projects)[0]; index: number }) {
  return (
    <div className="flex-shrink-0 w-[85vw] md:w-[500px] lg:w-[550px]">
      <SpotlightCard
        spotlightColor={`${project.color}20`}
        className="h-full flex flex-col group"
      >
        {/* Image placeholder */}
        <div
          className="w-full aspect-[16/10] rounded-lg mb-5 overflow-hidden relative"
          style={{ background: `linear-gradient(135deg, ${project.color}15, ${project.color}05)` }}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="w-20 h-20 rounded-2xl opacity-30"
              style={{ background: `linear-gradient(135deg, ${project.color}, ${project.color}80)` }}
            />
          </div>
          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <span className="text-white font-medium text-sm border border-white/30 rounded-full px-4 py-2">
              Vedi Progetto
            </span>
          </div>
        </div>

        <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-blue-400 transition-colors">
          {project.title}
        </h3>
        <p className="text-zinc-400 text-sm leading-relaxed mb-4 flex-1">
          {project.description}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-2">
          {project.tags.map((tag) => (
            <span
              key={tag}
              className="text-xs px-2.5 py-1 rounded-full border border-zinc-800 text-zinc-400 bg-zinc-900/50"
            >
              {tag}
            </span>
          ))}
        </div>
      </SpotlightCard>
    </div>
  );
}

export default function Projects() {
  const sectionRef = useRef<HTMLElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    setMobile(isMobile());
  }, []);

  useEffect(() => {
    if (mobile || !scrollRef.current || !sectionRef.current) return;

    const scrollContainer = scrollRef.current;
    const totalScroll = scrollContainer.scrollWidth - scrollContainer.clientWidth;

    const trigger = ScrollTrigger.create({
      trigger: sectionRef.current,
      start: "top top",
      end: () => `+=${totalScroll}`,
      pin: true,
      scrub: 1,
      onUpdate: (self) => {
        scrollContainer.scrollLeft = self.progress * totalScroll;
      },
    });

    return () => {
      trigger.kill();
    };
  }, [mobile]);

  return (
    <section ref={sectionRef} id="progetti" className="py-24 md:py-32">
      <div className="max-w-6xl mx-auto px-6 mb-12">
        <BlurText
          text="Progetti Selezionati"
          className="text-3xl md:text-5xl font-bold text-white tracking-tight"
          delay={80}
          animateBy="words"
        />
        <AnimatedContent distance={20} delay={0.2}>
          <p className="text-zinc-400 mt-4 max-w-lg">
            Una selezione di lavori recenti che rappresentano il mio approccio al design e allo sviluppo.
          </p>
        </AnimatedContent>
      </div>

      {/* Horizontal scroll on desktop, stack on mobile */}
      {mobile ? (
        <div className="max-w-6xl mx-auto px-6 space-y-6">
          {projects.map((project, i) => (
            <AnimatedContent key={i} distance={30} delay={i * 0.1}>
              <ProjectCard project={project} index={i} />
            </AnimatedContent>
          ))}
        </div>
      ) : (
        <div
          ref={scrollRef}
          className="flex gap-6 px-6 overflow-hidden"
          style={{ scrollbarWidth: "none" }}
        >
          <div className="flex-shrink-0 w-[calc((100vw-1152px)/2)]" />
          {projects.map((project, i) => (
            <ProjectCard key={i} project={project} index={i} />
          ))}
          <div className="flex-shrink-0 w-24" />
        </div>
      )}
    </section>
  );
}
