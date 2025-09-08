import React, { useState } from "react";
import { motion } from "framer-motion";
import "./Portfolio.css";

const projects = [
  {
    title: "BLDC Motor Driver for Electric Vehicle",
    description: `This project was developed under the TÜBİTAK 2209-A program 
    with the title "FOC-Based 6 Layer PID Controller for Electric Vehicles". 
    It was also presented at TÜBİTAK Teknofest Efficiency Challenge 2025 and received award.`,
    features: [
      "12-85V Input voltage",
      "0-80V / 165A Output Spec",
      "Compatible with FOC and Six-Step Algorithms",
      "Phase-to-phase Voltage Measurements",
      "Phase Current Measurements",
      "Overcurrent Protection",
      "Hall Effect and Encoder Sensor Readings",
      "6-layer PCB",
      "Size: 10x10 cm"
    ],
    technologies: [
      "Embedded C / HAL Libraries",
      "Altium Designer (PCB Design)",
      "UART & RS232 & I2C Communication",
      "Field Oriented Control (FOC)",
      "Six-Step Commutation",
    ],
    previewImage: "/images/onarka.jpg",
    images: [
      "/images/ongoruntu.jpg",
      "/images/arkagoruntu.jpg",
      "/images/layer1.png",
      "/images/layer2.png",
      "/images/layer3.png",
      "/images/layer4.png"
    ],
    videos: [
      "/images/arabavideo.mp4",
      "/images/yerlilikvideo.mp4"
    ],
    link: "https://github.com/skeior/bldc-driver"
  },
  {
    title: "Ground Station for Electric Vehicle",
    description: `This application designed for remote monitoring and telemetry of electric vehicle. The application collects
    real-time data from all on-vehicle control boards via serial communication, and transmits
    it to the ground station.`,
    features: [
      "LoRa communication (up to 8 km)",
      "Real-time Telemetry from all vehicle control boards",
      "User-friendly ground station GUI (C#)",
      "Serial communication with vehicle electronics",
      "Transmits speed, temperature, voltage, remaining energy, etc.",

      "Fail-safe data logging"
    ],
    technologies: [
      "STM32 Microcontroller",
      "LoRa Wireless Modules",
      "Embedded C / Hal",
      "UART / SPI / I2C Communication",
      "C# GUI Development"
    ],
    previewImage: "/images/lorastation_preview.jpg",
    images: [
      "/images/lorastation_1.jpg",
      "/images/lorastation_2.jpg"
    ],
    videos: [
      "/images/lorastation_demo.mp4"
    ],
    link: "https://github.com/skeior/lorastation"
  },
  {
    title: "Göktim Academy - Robotics & Embedded Systems Instructor",
    description: `Conducted hands-on workshops on Arduino and embedded systems, teaching fundamental components such as ADCs, sensors, and basic engineering concepts through interactive exercises.`,
    features: [
      "Arduino & Microcontroller Workshops",
      "Teaching ADCs, Sensors, and Basic Electronics",
      "Hands-on Embedded Systems Projects",
      "STEM Education & Problem Solving"
    ],
    technologies: [
      "Arduino",
      "C/C++",
      "Electronics Fundamentals",
      "STEM Education",
      "Mentoring"
    ],
    previewImage: "/images/goktim_preview.jpg",
    images: [
      "/images/goktim_1.jpg",
      "/images/goktim_2.jpg"
    ],
    link: "#"
  },
  {
    title: "Efficiency Challenge Participation (2022-2024)",
    description: `Participated in Teknofest Efficiency Challenge with VoltaFCEV team. 
    Started as Telemetry System member in 2022, led Motor Driver unit in 2023, 
    and served as Captain of the Hydrogen-supported Electric Vehicle in 2024.`,
    features: [
      "Telemetry System Member (2022)",
      "Motor Driver Unit Lead (2023)",
      "Vehicle Team Captain (2024)"
    ],
    technologies: [
      "STM32 Microcontrollers",
      "BLDC Motor Control",
      "LoRa Telemetry",
      "Embedded C / C++",
      "Team Leadership & Project Management"
    ],
    previewImage: "/images/efficiency_preview.jpg",
    images: [
      "/images/efficiency_2.jpeg",
      "/images/efficiency_3.jpg"
    ],
    link: "#"
  },
  {
    title: "Supported / Awarded Academic Projects",
    description: `These projects have been supported by national research funds or recognized for academic merit.`,
    features: [
      "Scientific Research Project (BAP) - Hydrogen Fuel Cell Vehicle",
      "Mini Ornithopter Design - TUSAŞ Lift-Up",
      "Mini Ornithopter Design - TÜBİTAK 2209-B Project",
      "TÜBİTAK 2209-A BLDC Driver Design - FOC-Based 6 layer PID Controller for Electric Vehicles"
    ],
    previewImage: "/images/academic_preview.jpg",
    link: "#"
  }
];

const PortfolioPage: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="portfolio-main-container">
      <motion.header
        className="portfolio-header"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <h1 className="portfolio-title">Projects & Experience</h1>
        <p className="portfolio-subtitle">Electronics & Embedded Systems</p>
      </motion.header>

      <div className="projects-grid">
        {projects.map((project, index) => (
          <motion.div
            key={index}
            className="portfolio-card"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02 }}
          >
            <img
              src={project.previewImage}
              alt={`${project.title} Preview`}
              className="card-preview-image"
            />

            <h3 className="card-title">{project.title}</h3>

            <p className="card-description">{project.description}</p>

            <ul className="card-features">
              {project.features.slice(0, 3).map((f, i) => (
                <li key={i}>{f}</li>
              ))}
            </ul>

            <button
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
              className="show-more-btn"
            >
              {openIndex === index ? "Show Less" : "Show Details"}
            </button>

            {openIndex === index && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.4 }}
                className="card-details"
              >
                <ul>
                  {project.features.slice(3).map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>

                {project.technologies && (
                  <div className="project-technologies">
                    <h4>Technologies Used</h4>
                    <ul>
                      {project.technologies.map((tech, i) => (
                        <li key={i}>{tech}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {project.images && (
                  <div className="project-images">
                    {project.images.map((img, i) => (
                      <img key={i} src={img} alt={`${project.title} ${i}`} />
                    ))}
                  </div>
                )}

                {project.videos && (
                  <div className="project-videos">
                    <h4>Videos</h4>
                    {project.videos.map((vid, i) => (
                      <video key={i} controls width="300">
                        <source src={vid} type="video/mp4" />
                        Your browser does not support the video tag.
                      </video>
                    ))}
                  </div>
                )}

                {project.link && project.link !== "#" && (
                  <a
                    href={project.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="project-link"
                  >
                    GitHub Repository
                  </a>
                )}
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default PortfolioPage;
