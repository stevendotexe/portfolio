import { Reveal } from "@/components/Reveal";
import { certifications } from "@/lib/data";
import { GraduationCapIcon } from "@/components/icons";

const iconMap: Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  "🎓": GraduationCapIcon,
  "graduation-cap": GraduationCapIcon,
};

export function Certifications() {
  return (
    <section className="certifications" id="certifications">
      <div className="container">
        <h2 className="section-title">Certifications</h2>

        <div className="certifications-grid">
          {certifications.map((cert) => {
            const Icon = iconMap[cert.icon] || GraduationCapIcon;
            return (
              <Reveal key={cert.title} className="certification-card">
                <div className="certification-icon" aria-hidden="true">
                  <Icon
                    width={40}
                    height={40}
                    style={{ display: "inline-block", verticalAlign: "middle" }}
                  />
                </div>
                <h3 className="certification-title">{cert.title}</h3>
                <p className="certification-issuer">{cert.issuer}</p>
                <p className="certification-description">{cert.description}</p>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
