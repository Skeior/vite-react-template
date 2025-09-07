// AboutPage.tsx
import React from "react";
import { FaMicrochip, FaProjectDiagram, FaCogs, FaBatteryHalf, FaRocket } from "react-icons/fa";
import Timeline from "../Timeline/Timeline"; 
import "./About.css";

const skills = [
  { icon: <FaMicrochip />, label: "Embedded systems development (STM32, C/C++)" },
  { icon: <FaProjectDiagram />, label: "PCB design & electronics integration (Altium Designer)" },
  { icon: <FaCogs />, label: "BLDC motor control & driver design (PWM, FOC, SixStep)" },
  { icon: <FaBatteryHalf />, label: "Battery Management Systems & energy optimization" },
  { icon: <FaRocket />, label: "Leadership in R&D projects (electric & hydrogen vehicles)" }
];

const AboutPage: React.FC = () => {
  return (
    <div className="about-container">
      {/* Header */}
      <header className="about-header section-card">
        <h1>Talha Karasu</h1>
        <p>Embedded Systems Engineer - R&D Engineer</p>
        <a href="src\react-app\res.pdf" download className="button" style={{ marginTop: "15px" }}>
          Download CV
        </a>
      </header>

      {/* Summary */}
      <section className="about-summary section-card">
        <h2>About Me</h2>
        <p>
          Erciyes University, final-year Computer Engineering student with practical experience in embedded systems and power electronics. Skilled in C and C++ programming and multi-layer PCB design.
        </p>
        <p>
          Experienced in both theoretical knowledge and hands-on embedded software & hardware design. Focused on local and efficient hardware-software integrated systems development, aiming for scalable and innovative solutions.
        </p>
        <p>
          My goal is to leverage technical skills and practical experience to build efficient, scalable, and innovative hardware-software integrated systems.
        </p>
      </section>

      {/* Skills */}
      <section className="about-skills section-card">
        <h2>Skills</h2>
        <ul>
          {skills.map((skill, idx) => (
            <li key={idx} className="skill-item">
              <span className="skill-icon">{skill.icon}</span>
              {skill.label}
            </li>
          ))}
        </ul>
      </section>

      {/* Timeline */}
      <section className="about-timeline section-card">
        <h2>My Journey</h2>
        <Timeline />
      </section>
    </div>
  );
};

export default AboutPage;
