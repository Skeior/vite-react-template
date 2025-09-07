import React, { useEffect } from "react";
import { FaMicrochip, FaProjectDiagram, FaCogs, FaBatteryHalf, FaCar, FaStar } from "react-icons/fa";
import Timeline from "../Timeline/Timeline";
import "./About.css";

const skills = [
  { icon: <FaMicrochip />, label: "Embedded systems development (STM32, C/C++)", stars: 5 },
  { icon: <FaProjectDiagram />, label: "PCB design & electronics integration (Altium Designer)", stars: 4 },
  { icon: <FaCogs />, label: "BLDC motor control & driver design (PWM, FOC, SixStep)", stars: 3 },
  { icon: <FaBatteryHalf />, label: "Battery Management Systems & energy optimization", stars: 4 },
  { icon: <FaCar />, label: "Leadership in R&D projects (electric & hydrogen vehicles)", stars: 5 }
];

const AboutPage: React.FC = () => {
  useEffect(() => {
    const fadeInElements = document.querySelectorAll(".fade-in");

    const handleScroll = () => {
      fadeInElements.forEach((el) => {
        const top = el.getBoundingClientRect().top;
        const windowHeight = window.innerHeight;
        if (top < windowHeight - 100) {
          el.classList.add("visible");
        }
      });
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <div className="about-skill-container fade-in">
        <div className="about-main">
          <section className="about-card about-summary">
            <h2>About Me</h2>
            <h1>Talha Karasu</h1>
            <p>Embedded Systems - R&D Engineer</p>
            <p>
              Erciyes University, final-year Computer Engineering student with practical experience in embedded systems and power electronics. Skilled in C and C++ programming and multi-layer PCB design.
            </p>
            <p>
              Experienced in both theoretical knowledge and hands-on embedded software & hardware design. Focused on local and efficient hardware-software integrated systems development, aiming for scalable and innovative solutions.
            </p>
            <p>
              My goal is to leverage technical skills and practical experience to build efficient, scalable, and innovative hardware-software integrated systems.
            </p>

            <a href="src/react-app/res.pdf" download className="button">
              Download CV
            </a>
          </section>

          <section className="about-card about-skills">
            <h2>Skills</h2>
            <ul>
              {skills.map((skill, idx) => (
                <li key={idx} className="skill-item">
                  <span className="skill-icon">{skill.icon}</span>
                  <span className="skill-label">{skill.label}</span>
                  <span className="skill-stars">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <FaStar key={i} className={i < skill.stars ? "filled" : ""} />
                    ))}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>

      <div className="timeline-container fade-in">
        <section className="about-timeline section-card">
          <Timeline />
        </section>
      </div>
    </>
  );
};

export default AboutPage;
