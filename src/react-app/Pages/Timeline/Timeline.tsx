import { motion } from "framer-motion";
import { FaGraduationCap, FaBriefcase, FaTrophy, FaLaptopCode, FaCar } from "react-icons/fa";
import "./Timeline.css";
import { useLanguage } from "../../Components/LanguageProvider";
const staticData = [
  // Eğitim
  { year: "2020 - 2025", title: "B.Sc. Computer Engineering", place: "Erciyes University", desc: "Focus on Embedded Systems, PCB Design, and Motor Control.", icon: <FaGraduationCap /> },
  { year: "2023 - 2025", title: "Associate Degree", place: "Anadolu University", desc: "Web Design and Coding.", icon: <FaLaptopCode /> },

  // İş ve takım deneyimleri
  { year: "2022 - 2023", title: "Telemetry Systems Developer", place: "VoltaCAR", desc: "Developed LoRa-based telemetry system.", icon: <FaBriefcase /> },
  { year: "2023 - 2024", title: "Motor Driver Unit Leader", place: "VoltaCAR", desc: "Designed BLDC motor driver for Teknofest Efficiency Challenge.", icon: <FaCar /> },
  { year: "2024 - 2025", title: "Team Captain", place: "VoltaFCEV", desc: "Team Captain of Hydrogen-supported Teknofest Efficiency Challenge.", icon: <FaTrophy /> },
  { year: "2024 - 2025", title: "Embedded Mentor", place: "Göktim Akademi", desc: "Mentored high school students in microcontrollers & embedded systems.", icon: <FaLaptopCode /> },
];

export default function Timeline() {
  const { t } = useLanguage();
  const translatedData: any = t("timeline.data");

  // Use staticData as the canonical baseline and overlay any translated fields
  // per-index. This prevents a partially-complete translation array from
  // hiding entries. Icons always come from staticData to keep visuals stable.
  let dataToUse: any[] = staticData;
  if (Array.isArray(translatedData)) {
    dataToUse = staticData.map((base, i) => {
      const trans = translatedData[i] || {};
      return {
        year: trans.year ?? base.year,
        title: trans.title ?? base.title,
        place: trans.place ?? base.place,
        desc: trans.desc ?? base.desc,
        icon: base.icon,
      };
    });
  }

  return (
    <div className="timeline-container">
      <h2 className="timeline-title">{t("timeline.title")}</h2>
      <div className="timeline-line"></div>
      <div className="timeline-items">
        {dataToUse.map((item: any, idx: number) => (
          <motion.div
            key={idx}
            className={`timeline-item ${idx % 2 === 0 ? "left" : "right"}`}
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, delay: idx * 0.1 }}
          >
            <div className="timeline-dot">{item.icon ?? staticData[idx]?.icon}</div>
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
