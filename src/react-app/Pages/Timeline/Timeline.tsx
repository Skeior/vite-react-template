import { motion } from "framer-motion";
import { FaGraduationCap, FaBriefcase, FaTrophy, FaLaptopCode, FaCar } from "react-icons/fa";
import "./Timeline.css";

const data = [
  { year: "2020 - 2025", title: "B.Sc. Computer Engineering", place: "Erciyes University", desc: "Focus on Embedded Systems, PCB Design, and Motor Control.", icon: <FaGraduationCap /> },
  { year: "2023 - 2025", title: "Associate Degree", place: "Anadolu University", desc: "Web Design and Coding.", icon: <FaLaptopCode /> },
  { year: "2022 - 2023", title: "Telemetry Systems Developer", place: "VoltaCAR", desc: "Developed LoRa-based telemetry system with 1.5 km range.", icon: <FaBriefcase /> },
  { year: "2023 - 2024", title: "Motor Driver Unit Leader", place: "VoltaCAR", desc: "Designed STM32G431 based 6-layer BLDC driver with PID.", icon: <FaCar /> },
  { year: "2024 - 2025", title: "Team Captain", place: "VoltaFCEV", desc: "Led hydrogen fuel cell electric vehicle R&D for Teknofest.", icon: <FaTrophy /> },
  { year: "2024 - 2025", title: "Embedded Mentor", place: "Göktim Akademi", desc: "Mentored high school students in microcontrollers & embedded systems.", icon: <FaLaptopCode /> },
  { year: "2022 - 2025", title: "Teknofest Efficiency Challenge", place: "Participant / Finalist", desc: "Electric & Hydrogen-powered vehicle competitions.", icon: <FaTrophy /> },
  { year: "2025", title: "Mini Ornithopter Project", place: "TUSAŞ & TÜBİTAK", desc: "Bio-inspired flying drone with flapping wings.", icon: <FaCar /> },
  { year: "2024 - 2025", title: "BLDC Driver Design", place: "TÜBİTAK 2209-A", desc: "6-layer FOC-based motor controller for EVs.", icon: <FaCar /> },
  { year: "2025 - Present", title: "Hydrogen Fuel Cell Vehicle", place: "Scientific Research Project (BAP)", desc: "R&D on fuel cell integration for sustainable vehicles.", icon: <FaCar /> }
];

export default function Timeline() {
  return (
    <div className="timeline-container">
      <h2 className="timeline-title">My Journey</h2>
      <div className="timeline-line"></div>
      <div className="timeline-items">
        {data.map((item, idx) => (
          <motion.div
            key={idx}
            className={`timeline-item ${idx % 2 === 0 ? "left" : "right"}`}
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, delay: idx * 0.1 }}
          >
            <div className="timeline-dot">{item.icon}</div>
            <div className="timeline-content">
              <span className="timeline-year">{item.year}</span>
              <h3>{item.title}</h3>
              <h4>{item.place}</h4>
              <p>{item.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
