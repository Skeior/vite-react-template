import React, { useState } from "react";
import { motion } from "framer-motion";
import emailjs from "emailjs-com";
import { FaGithub, FaLinkedin } from "react-icons/fa";
import "./Contact.css";
import { useLanguage } from "../../Components/LanguageProvider";
import SEO from "../../Components/SEO";

const ContactPage: React.FC = () => {
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { t } = useLanguage();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const templateParams = {
      name: formData.name,
      email: formData.email,
      message: formData.message
    };
    
    const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID || "service_pnwsiys";
    const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || "template_ey6j43e";
    const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || "dd49VlOMNa9v-NiJ-";
    
    emailjs.send(
      serviceId,
      templateId,
      templateParams,
      publicKey
    )
    .then(() => {
      alert(t("contact.sentAlert"));
      setFormData({ name: "", email: "", message: "" });
    })
    .catch((err) => {
      console.error("EmailJS error:", err);
      alert(t("contact.errorAlert"));
    })
    .finally(() => {
      setIsSubmitting(false);
    });
  };

  return (
    <div className="app-container">
      <SEO 
        title={t("contact.title")}
        description={t("contact.subtitle")}
      />
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
          <button type="submit" className="button" disabled={isSubmitting}>
            {isSubmitting ? t("contact.sending") || "Sending..." : t("contact.send")}
          </button>
        </form>
      </motion.section>
    </div>
  );
};

export default ContactPage;
