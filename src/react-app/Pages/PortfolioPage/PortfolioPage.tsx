import React from "react";
import { motion } from "framer-motion";
import "./Portfolio.css";

const projects = [
  {
    title: "BLDC Motor Sürücü Tasarımı",
    desc: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Nobis dicta ex deleniti, sapiente magni ipsa eum eligendi eos mollitia ullam magnam quidem sed, laborum consequatur doloribus natus molestiae. Rerum quia maxime, delectus temporibus voluptas quis vel perspiciatis deleniti vero magni assumenda facere et possimus veniam illo aliquid ratione tempora consectetur?",
    link: "https://github.com/skeior/bldc-driver",
  },
  {
    title: "Telemetri Sistemi",
    desc: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Nobis dicta ex deleniti, sapiente magni ipsa eum eligendi eos mollitia ullam magnam quidem sed, laborum consequatur doloribus natus molestiae. Rerum quia maxime, delectus temporibus voluptas quis vel perspiciatis deleniti vero magni assumenda facere et possimus veniam illo aliquid ratione tempora consectetur?",
    link: "https://github.com/skeior/telemetry-system",
  },
  {
    title: "Batarya Dengeleme Devresi",
    desc: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Nobis dicta ex deleniti, sapiente magni ipsa eum eligendi eos mollitia ullam magnam quidem sed, laborum consequatur doloribus natus molestiae. Rerum quia maxime, delectus temporibus voluptas quis vel perspiciatis deleniti vero magni assumenda facere et possimus veniam illo aliquid ratione tempora consectetur?",
    link: "https://github.com/skeior/bms-balancing",
  },
  {
    title: "Mini Ornihopter (Bitirme Projesi)",
    desc: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Nobis dicta ex deleniti, sapiente magni ipsa eum eligendi eos mollitia ullam magnam quidem sed, laborum consequatur doloribus natus molestiae. Rerum quia maxime, delectus temporibus voluptas quis vel perspiciatis deleniti vero magni assumenda facere et possimus veniam illo aliquid ratione tempora consectetur?",
    link: "https://github.com/skeior/ornihopter",
  },
];

const PortfolioPage: React.FC = () => {
  return (
    <div className="app-container">
      {/* Header */}
      <motion.header
        className="portfolio-header"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <h1 className="portfolio-title">Projelerim</h1>
        <p className="portfolio-subtitle">
          Embedded Systems & Power Electronics projelerim
        </p>
      </motion.header>

      {/* Project Cards */}
      <motion.section
        className="portfolio-grid"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: {},
          visible: { transition: { staggerChildren: 0.2 } },
        }}
      >
        {projects.map((project, idx) => (
          <motion.a
            key={idx}
            href={project.link}
            target="_blank"
            rel="noopener noreferrer"
            className="portfolio-card"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: idx * 0.1 }}
            whileHover={{ scale: 1.05 }}
          >
            <h3 className="card-title">{project.title}</h3>
            <p className="card-desc">{project.desc}</p>
          </motion.a>
        ))}
      </motion.section>
    </div>
  );
};

export default PortfolioPage;
