import React from "react";
import { motion } from "framer-motion";

// The modal accepts a flexible project object. Many projects in the repo only
// provide description, features, images, videos, technologies and link — so
// render those when a formal `caseStudy` object is not provided.
const CaseStudyModal: React.FC<{ project: any; onClose: () => void }> = ({ project, onClose }) => (
  <motion.div
    className="modal-backdrop"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    onClick={onClose}
  >
    <motion.article
      className="modal-panel"
      initial={{ opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 32 }}
      onClick={(event) => event.stopPropagation()}
    >
      <header className="modal-header">
        <div>
          {project.status && <p className="modal-kicker">{project.status === "delivered" ? "Delivered" : "Ongoing"}</p>}
          <h2>{project.title}</h2>
        </div>
        <button className="icon-button" onClick={onClose} aria-label="Close">
          ×
        </button>
      </header>

      <div className="modal-body">
        {/* Primary description */}
        {project.highlights && project.highlights.length > 0 && (
          <div className="project-highlights" aria-hidden={false}>
            {project.highlights.map((h: string, i: number) => (
              <span className="highlight-chip" key={i}>{h}</span>
            ))}
          </div>
        )}

        {project.description && (
          <section>
            <h3>Description</h3>
            <p>{project.description}</p>
          </section>
        )}

        {/* Features / bullet list */}
        {(project.features || []).length > 0 && (
          <section>
            <h3>Features</h3>
            <ul>
              {(
                (project.features || []).filter((f: string) => {
                  const sourceHighlights = project.highlights || [];
                  return !sourceHighlights.some((h: string) => (h || '').trim() === (f || '').trim());
                })
              ).map((f: any, i: number) => (
                <li key={i}>{f}</li>
              ))}
            </ul>
          </section>
        )}

        {/* Technologies */}
        {(project.technologies || []).length > 0 && (
          <section>
            <h3>Technologies</h3>
            <ul className="tech-list">
              {project.technologies.map((t: any, i: number) => (
                <li key={i}>{t}</li>
              ))}
            </ul>
          </section>
        )}

        {/* Images */}
        {(project.images || []).length > 0 && (
          <section>
            <h3>Images</h3>
            <div className="modal-images">
              {project.images.map((src: string, i: number) => (
                <img key={i} src={src} alt={`${project.title} ${i + 1}`} loading="lazy" />
              ))}
            </div>
          </section>
        )}

        {/* Videos */}
        {(project.videos || []).length > 0 && (
          <section>
            <h3>Videos</h3>
            <div className="modal-videos">
              {project.videos.map((src: string, i: number) => (
                <video key={i} controls width="320" preload="none">
                  <source src={src} />
                  Your browser does not support the video tag.
                </video>
              ))}
            </div>
          </section>
        )}

        {/* Link / external */}
        {project.link && project.link !== "#" && (
          <section>
            <a href={project.link} target="_blank" rel="noopener noreferrer" className="project-link">
              View project repository / external link
            </a>
          </section>
        )}

        {/* If a detailed caseStudy object is present, render its structured sections too */}
        {project.caseStudy && (
          <section>
            <h3>Case study</h3>
            {project.caseStudy.overview && <p>{project.caseStudy.overview}</p>}
            {(project.caseStudy.architecture || []).length > 0 && (
              <>
                <h4>Architecture</h4>
                <ul>
                  {project.caseStudy.architecture.map((a: any, i: number) => (
                    <li key={i}>{a}</li>
                  ))}
                </ul>
              </>
            )}
            {(project.caseStudy.lessons || []).length > 0 && (
              <>
                <h4>Lessons learned</h4>
                <ul>
                  {project.caseStudy.lessons.map((l: any, i: number) => (
                    <li key={i}>{l}</li>
                  ))}
                </ul>
              </>
            )}
            {(project.caseStudy.future || []).length > 0 && (
              <>
                <h4>Next steps</h4>
                <ul>
                  {project.caseStudy.future.map((f: any, i: number) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              </>
            )}
          </section>
        )}
      </div>
    </motion.article>
  </motion.div>
);

export default CaseStudyModal;
