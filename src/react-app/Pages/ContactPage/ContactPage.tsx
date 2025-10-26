import React, { useState } from "react";
import { motion } from "framer-motion";
import emailjs from "emailjs-com";
import { FaGithub, FaLinkedin } from "react-icons/fa"; // ← ikonları import ettik
import "./Contact.css";
import { useLanguage } from "../../Components/LanguageProvider";

const ContactPage: React.FC = () => {
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });
  const { t } = useLanguage();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const templateParams = {
      name: formData.name,
      email: formData.email,
      message: formData.message
    };
    emailjs.send(
      "service_pnwsiys",
      "template_ey6j43e",
      templateParams,
      "dd49VlOMNa9v-NiJ-"
    )
    .then(() => {
      alert(t("contact.sentAlert"));
      setFormData({ name: "", email: "", message: "" });
      console.log("Sent formData:", formData);
    })
    .catch((err) => {
      console.error("EmailJS error:", err);
      alert(t("contact.errorAlert"));
    });
  };

  return (
    <div className="app-container">
      {/* Header */}
      <motion.header
        className="portfolio-header text-center mb-12" // portfolio-header sınıfını ekledik
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <h1 className="portfolio-title">{t("contact.title")}</h1>
        <p className="portfolio-subtitle">{t("contact.subtitle")}</p>
      </motion.header>
      {/* Contact Info + Form Card */}
      <motion.section
        className="contact-card"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="contact-info">
          <p>
            <a href="mailto:talhakarasu2@gmail.com" className="contact-link">
              talhakarasu2@gmail.com
            </a>
          </p>
          <p className="contact-links">
            <a href="https://github.com/skeior" className="contact-link" target="_blank" rel="noreferrer">
              <FaGithub size={24} style={{ marginRight: "8px" }} /> GitHub
            </a>
            <a href="https://linkedin.com/in/talha-karasu" className="contact-link" target="_blank" rel="noreferrer">
              <FaLinkedin size={24} style={{ marginRight: "8px" }} /> LinkedIn
            </a>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="contact-form">
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder={t("contact.placeholderName")}
            required
            className="contact-input"
          />
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder={t("contact.placeholderEmail")}
            required
            className="contact-input"
          />
          <textarea
            name="message"
            value={formData.message}
            onChange={handleChange}
            placeholder={t("contact.placeholderMessage")}
            required
            rows={5}
            className="contact-input"
          />
          <button type="submit" className="button">
            {t("contact.send")}
          </button>
        </form>
      </motion.section>
    </div>
  );
};

export default ContactPage;
