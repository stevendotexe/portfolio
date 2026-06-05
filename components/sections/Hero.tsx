import Image from "next/image";
import { HeroStripes } from "./HeroStripes";

export function Hero() {
  return (
    <section className="hero" id="home">
      <div className="hero-container">
        <div className="hero-content">
          <h1 className="hero-title">
            <span className="title-line">Interface.</span>
            <span className="title-line">Outer Space.</span>
          </h1>

          <div className="hero-intro">
            <p className="hero-name">Steven Simbolon</p>
            <span className="hero-role">Fullstack Developer</span>
          </div>

          <p className="hero-description">
            Hello! I&apos;m Steven, a Software Engineering student from Bandung,
            Indonesia. I currently study in the Indonesian University of
            Education. I am currently on my third year.
          </p>

          <div className="hero-links">
            <a href="#about" className="hero-link">
              Here are my qualifications.
            </a>
            <a href="#projects" className="hero-link">
              My Projects
            </a>
          </div>

          <div className="hero-tags">
            <a href="#skills" className="hero-tag">
              Skills
            </a>
            <a href="#certifications" className="hero-tag">
              Certifications
            </a>
            <a href="#about" className="hero-tag">
              Biodata
            </a>
          </div>
        </div>

        <div className="hero-image-wrapper">
          <div className="hero-image-container">
            <Image
              src="/frontpage.png"
              alt="Steven Simbolon"
              className="hero-image"
              width={900}
              height={900}
              priority
              sizes="(max-width: 1024px) 350px, 450px"
            />
            <HeroStripes />
          </div>
        </div>
      </div>
    </section>
  );
}
