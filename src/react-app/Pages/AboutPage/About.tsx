// AboutPage.tsx
import React from "react";
import { FaMicrochip, FaProjectDiagram, FaCogs, FaBatteryHalf } from "react-icons/fa";
import Timeline from "../Timeline/Timeline"; 
import "./About.css";

const skills = [
  { icon: <FaMicrochip />, label: "Embedded systems development & communication protocols (C/C++, UART, SPI, I2C, HAL)" },
  { icon: <FaProjectDiagram />, label: "PCB design & electronic circuit integration (Altium Designer)" },
  { icon: <FaCogs />, label: "BLDC motor control & driver design (PWM, FOC, SixStep Motor Control algorithms)" },
  { icon: <FaBatteryHalf />, label: "Battery management systems & energy optimization" }
];

const AboutPage: React.FC = () => {
  return (
    <div className="about-container">
      {/* Header */}
      <header className="about-header">
        <h1>Talha Karasu</h1>
        <p>Embedded Systems - R&D Engineer</p>
      </header>

      {/* Summary */}
      <section className="about-summary section-card">
        <h2>Summary</h2>
        <p>
          Final-year Computer Engineering student with practical experience in embedded systems, PCB design, and C/C++ firmware development. Skilled in STM32 microcontrollers, motor control, and telemetry design. Proven leadership in electric and hydrogen-powered vehicle R&D projects. Passionate about building local, efficient, and scalable hardware-software integrated systems.
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
