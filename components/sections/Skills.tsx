import { Reveal } from "@/components/Reveal";
import { frameworkSkills, programmingSkills } from "@/lib/data";
import { SkillBar } from "./SkillBar";

export function Skills() {
  return (
    <section className="skills" id="skills">
      <div className="container">
        <h2 className="section-title">Skills &amp; Technologies</h2>

        <div className="skills-grid">
          <Reveal className="skill-category">
            <h3 className="skill-category-title">Programming Languages</h3>
            <div className="skill-items">
              {programmingSkills.map((skill) => (
                <SkillBar key={skill.name} {...skill} />
              ))}
            </div>
          </Reveal>

          <Reveal className="skill-category">
            <h3 className="skill-category-title">Frameworks &amp; Tools</h3>
            <div className="skill-tags">
              {frameworkSkills.map((tag) => (
                <span key={tag} className="skill-badge">
                  {tag}
                </span>
              ))}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
