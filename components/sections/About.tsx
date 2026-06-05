import Image from "next/image";
import { Reveal } from "@/components/Reveal";

const details = [
  {
    label: "Location",
    value: (
      <>
        Bandung | Bogor
        <br />
        <small>Indonesia</small>
      </>
    ),
  },
  {
    label: "Occupation",
    value: (
      <>
        Freelancer
        <br />
        Student
      </>
    ),
  },
  {
    label: "Specialty",
    value: (
      <>
        User Interface Design
        <br />
        Fullstack Development
      </>
    ),
  },
  {
    label: "Languages",
    value: (
      <>
        Indonesian <small>NATIVE</small>
        <br />
        English <small>C1</small>
      </>
    ),
  },
];

export function About() {
  return (
    <section className="about" id="about">
      <div className="container">
        <h2 className="section-title">About Me</h2>

        <div className="about-content">
          <div className="about-image-container">
            <Image
              src="/formal.jpg"
              alt="Steven Simbolon - Formal Photo"
              className="about-image"
              width={700}
              height={900}
              sizes="(max-width: 1024px) 400px, 350px"
            />
            <div className="about-image-decoration" aria-hidden="true" />
          </div>

          <div className="about-info">
            <p className="about-description">
              I am Steven, a student in the Indonesian University of Education,
              studying Software Engineering. I am currently on my third year
              and learning to build full-stack applications using modern
              technologies.
            </p>
            <p className="about-description">
              Aside from backend and frontend development, I am also
              experienced in UI/UX design, creating intuitive and beautiful
              user interfaces. I am passionate about building products that
              make a difference.
            </p>

            <div className="about-details">
              {details.map((detail) => (
                <Reveal key={detail.label} className="detail-card">
                  <span className="detail-label">{detail.label}</span>
                  <span className="detail-value">{detail.value}</span>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
