import { Reveal } from "@/components/Reveal";
import { ExternalLinkIcon, GitHubIcon } from "@/components/icons";
import { projects } from "@/lib/data";

export function Projects() {
  return (
    <section className="projects" id="projects">
      <div className="container">
        <h2 className="section-title">My Projects</h2>
        <p className="section-subtitle">
          Click on a project to view its repository
        </p>

        <div className="projects-grid">
          {projects.map((project) => (
            <Reveal
              key={project.title}
              as="article"
              className={`project-card${project.featured ? " featured" : ""}`}
            >
              {project.badge ? (
                <div className="project-badge">{project.badge}</div>
              ) : null}
              <div className="project-content">
                <h3 className="project-title">{project.title}</h3>
                <p className="project-description">{project.description}</p>
                <div className="project-tech">
                  {project.techTags.map((tag) => (
                    <span key={tag} className="tech-tag">
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="project-links">
                  {project.links.github ? (
                    <a
                      href={project.links.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="project-link"
                    >
                      <GitHubIcon />
                      View on GitHub
                    </a>
                  ) : null}
                  {project.links.website ? (
                    <a
                      href={project.links.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="project-link primary"
                    >
                      <ExternalLinkIcon />
                      Visit {project.links.website.replace(/https?:\/\//, "")}
                    </a>
                  ) : null}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
